/**
 * meta: module=job-scheduler version=0.1 owner=platform
 */
import { addMilliseconds } from 'date-fns';
import type { JobExecutionStatus, Prisma } from '@prisma/client';

import { prisma } from '@/lib/db/prisma';

export interface RegisteredJob {
  name: string;
  intervalMs: number;
  handler: () => Promise<void> | void;
  metadata?: Record<string, unknown>;
}

const registry = new Map<string, RegisteredJob>();
let schedulerTimer: NodeJS.Timeout | null = null;

const MAX_JOB_ATTEMPTS = 5;
const RETRY_BASE_DELAY_MS = 60_000;

export interface JobHealthEntry {
  name: string;
  intervalMs: number;
  nextRunAt: Date | null;
  lastRunAt: Date | null;
  isActive: boolean;
  metadata: Prisma.JsonValue | null;
  backlogRunCount: number;
  overdueByMs: number;
}

function computeRetryDelay(intervalMs: number, attempt: number) {
  const backoff = RETRY_BASE_DELAY_MS * 2 ** Math.max(attempt - 1, 0);
  return Math.min(intervalMs, backoff);
}

function normaliseMetadata(metadata: unknown): Record<string, unknown> {
  if (!metadata || typeof metadata !== 'object') {
    return {};
  }

  return metadata as Record<string, unknown>;
}

export function registerJob(job: RegisteredJob) {
  registry.set(job.name, job);
}

function deriveBacklog(intervalMs: number, nextRunAt: Date | null, reference: Date): {
  backlogRunCount: number;
  overdueByMs: number;
} {
  if (!nextRunAt) {
    return { backlogRunCount: 0, overdueByMs: 0 };
  }

  const overdueByMs = Math.max(0, reference.getTime() - nextRunAt.getTime());
  if (overdueByMs === 0 || intervalMs <= 0) {
    return { backlogRunCount: 0, overdueByMs };
  }

  const backlogRunCount = Math.max(1, Math.ceil(overdueByMs / intervalMs));
  return { backlogRunCount, overdueByMs };
}

async function ensureJobRow(job: RegisteredJob, tx: Prisma.TransactionClient | typeof prisma) {
  const existing = await tx.recurringJob.findUnique({ where: { name: job.name } });
  if (existing) {
    if (existing.intervalMs !== job.intervalMs) {
      await tx.recurringJob.update({
        where: { name: job.name },
        data: { intervalMs: job.intervalMs, metadata: job.metadata ?? existing.metadata },
      });
    }
    return existing;
  }

  return tx.recurringJob.create({
    data: {
      name: job.name,
      handlerKey: job.name,
      intervalMs: job.intervalMs,
      nextRunAt: addMilliseconds(new Date(), job.intervalMs),
      metadata: job.metadata ?? null,
    },
  });
}

async function logJobExecution(
  jobName: string,
  status: JobExecutionStatus,
  attempt: number,
  startedAt: Date,
  metadata?: Record<string, unknown>,
  error?: unknown
) {
  await prisma.jobExecutionLog.create({
    data: {
      jobName,
      status,
      attempt,
      startedAt,
      finishedAt: new Date(),
      error: error instanceof Error ? error.message : error ? String(error) : null,
      metadata: metadata ?? null,
    },
  });
}

async function executeJob(job: RegisteredJob, record: { attempt: number; metadata?: Record<string, unknown> }) {
  const startedAt = new Date();
  const baseMetadata = normaliseMetadata(record.metadata);

  // eslint-disable-next-line no-console -- structured diagnostics until observability stack lands
  console.info('[scheduler][job-start]', { job: job.name, attempt: record.attempt, metadata: baseMetadata });
  try {
    await job.handler();
    const successMetadata = {
      ...(job.metadata ?? {}),
      ...baseMetadata,
      attempt: 1,
      lastSuccessAt: startedAt.toISOString(),
      lastError: null,
      lastErrorAt: null,
    } as Record<string, unknown>;

    await logJobExecution(job.name, 'SUCCEEDED', record.attempt, startedAt, successMetadata);
    await prisma.recurringJob.update({
      where: { name: job.name },
      data: {
        lastRunAt: startedAt,
        nextRunAt: addMilliseconds(startedAt, job.intervalMs),
        metadata: successMetadata,
      },
    });
    // eslint-disable-next-line no-console -- structured diagnostics until observability stack lands
    console.info('[scheduler][job-success]', {
      job: job.name,
      attempt: record.attempt,
      durationMs: Date.now() - startedAt.getTime(),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const nextAttempt = Math.min(record.attempt + 1, MAX_JOB_ATTEMPTS);
    const failureMetadata = {
      ...(job.metadata ?? {}),
      ...baseMetadata,
      attempt: nextAttempt,
      lastError: message,
      lastErrorAt: startedAt.toISOString(),
    } as Record<string, unknown>;

    if (record.attempt >= MAX_JOB_ATTEMPTS) {
      failureMetadata.disabledAt = startedAt.toISOString();
    }

    await logJobExecution(job.name, 'FAILED', record.attempt, startedAt, failureMetadata, error);
    const retryDelay = computeRetryDelay(job.intervalMs, record.attempt);

    const updateData: Prisma.RecurringJobUpdateArgs = {
      where: { name: job.name },
      data: {
        lastRunAt: startedAt,
        nextRunAt: addMilliseconds(startedAt, retryDelay),
        metadata: failureMetadata,
      },
    };

    if (record.attempt >= MAX_JOB_ATTEMPTS) {
      updateData.data.isActive = false;
    }

    await prisma.recurringJob.update(updateData);
    // eslint-disable-next-line no-console -- structured diagnostics until observability stack lands
    console.error('[scheduler][job-failed]', {
      job: job.name,
      attempt: record.attempt,
      error: message,
      nextAttempt,
    });
    throw error;
  }
}

export async function runDueJobs(referenceDate = new Date()) {
  for (const job of registry.values()) {
    await ensureJobRow(job, prisma);
  }

  const dueJobs = await prisma.recurringJob.findMany({
    where: {
      isActive: true,
      OR: [
        { nextRunAt: null },
        { nextRunAt: { lte: referenceDate } },
      ],
    },
  });

  for (const due of dueJobs) {
    const job = registry.get(due.name);
    if (!job) {
      continue;
    }

    const metadata = normaliseMetadata(due.metadata);
    const attempt = typeof metadata.attempt === 'number' && Number.isFinite(metadata.attempt) ? metadata.attempt : 1;
    try {
      await executeJob(job, { attempt, metadata });
    } catch (error) {
      // handled inside executeJob; keep loop running
    }
  }
}

export function startScheduler(pollIntervalMs = 30_000) {
  if (schedulerTimer) {
    return;
  }

  schedulerTimer = setInterval(() => {
    void runDueJobs().catch((error) => {
      // eslint-disable-next-line no-console -- Scheduler bootstrap logging until observability stack lands
      console.error('[scheduler][runDueJobs-failed]', error);
    });
  }, pollIntervalMs);
}

export function stopScheduler() {
  if (schedulerTimer) {
    clearInterval(schedulerTimer);
    schedulerTimer = null;
  }
}

export async function getJobHealth(referenceDate = new Date()) {
  const rows = await prisma.recurringJob.findMany({
    orderBy: { name: 'asc' },
  });

  const latestLogs = await prisma.jobExecutionLog.findMany({
    orderBy: { startedAt: 'desc' },
    take: 25,
  });

  const jobs: JobHealthEntry[] = rows.map((row) => {
    const nextRunAt = row.nextRunAt ? new Date(row.nextRunAt) : null;
    const lastRunAt = row.lastRunAt ? new Date(row.lastRunAt) : null;
    const { backlogRunCount, overdueByMs } = deriveBacklog(row.intervalMs, nextRunAt, referenceDate);

    return {
      name: row.name,
      intervalMs: row.intervalMs,
      nextRunAt,
      lastRunAt,
      isActive: row.isActive,
      metadata: row.metadata,
      backlogRunCount,
      overdueByMs,
    } satisfies JobHealthEntry;
  });

  return { jobs, logs: latestLogs };
}

export async function triggerJob(name: string) {
  const job = registry.get(name);
  if (!job) {
    throw new Error('JOB_NOT_REGISTERED');
  }

  const row = await ensureJobRow(job, prisma);
  const metadata = normaliseMetadata(row.metadata);
  await executeJob(job, { attempt: 1, metadata });
}
