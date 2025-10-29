import type { JobExecutionStatus } from '@prisma/client';

describe('job scheduler', () => {
  const mockPrisma = {
    recurringJob: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      findMany: jest.fn(),
    },
    jobExecutionLog: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
  } as any;

  let consoleInfoSpy: jest.SpyInstance;
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    (Object.values(mockPrisma.recurringJob) as jest.Mock[]).forEach((fn) => fn.mockReset());
    mockPrisma.jobExecutionLog.create.mockReset();
    mockPrisma.jobExecutionLog.findMany.mockReset();
    consoleInfoSpy = jest.spyOn(console, 'info').mockImplementation(() => undefined);
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    consoleInfoSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  async function prepareModule() {
    jest.doMock('@/lib/db/prisma', () => ({ prisma: mockPrisma }));
    const scheduler = await import('@/lib/jobs/scheduler');
    return scheduler;
  }

  it('executes due jobs and schedules the next run', async () => {
    const scheduler = await prepareModule();

    const handler = jest.fn();
    scheduler.registerJob({ name: 'demo-job', intervalMs: 60_000, handler });

    mockPrisma.recurringJob.findUnique.mockResolvedValueOnce(null);
    mockPrisma.recurringJob.create.mockResolvedValue({
      name: 'demo-job',
      intervalMs: 60_000,
      nextRunAt: new Date('2025-06-04T10:01:00.000Z'),
      metadata: { attempt: 1 },
    });
    mockPrisma.recurringJob.findMany.mockResolvedValueOnce([
      { name: 'demo-job', intervalMs: 60_000, metadata: { attempt: 1 } },
    ]);
    mockPrisma.recurringJob.update.mockResolvedValue({});

    await scheduler.runDueJobs(new Date('2025-06-04T10:05:00.000Z'));

    expect(handler).toHaveBeenCalledTimes(1);
    expect(mockPrisma.jobExecutionLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          jobName: 'demo-job',
          status: 'SUCCEEDED' satisfies JobExecutionStatus,
          attempt: 1,
          metadata: expect.objectContaining({ attempt: 1, lastSuccessAt: expect.any(String) }),
        }),
      })
    );
    expect(mockPrisma.recurringJob.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { name: 'demo-job' },
        data: expect.objectContaining({
          nextRunAt: expect.any(Date),
          lastRunAt: expect.any(Date),
          metadata: expect.objectContaining({ attempt: 1, lastSuccessAt: expect.any(String) }),
        }),
      })
    );
  });

  it('records failures and schedules retry sooner', async () => {
    const scheduler = await prepareModule();

    const handler = jest.fn(() => {
      throw new Error('boom');
    });

    scheduler.registerJob({ name: 'failing-job', intervalMs: 120_000, handler });

    mockPrisma.recurringJob.findUnique.mockResolvedValueOnce(null);
    mockPrisma.recurringJob.create.mockResolvedValue({
      name: 'failing-job',
      intervalMs: 120_000,
      nextRunAt: new Date('2025-06-04T10:03:00.000Z'),
      metadata: { attempt: 1 },
    });
    mockPrisma.recurringJob.findMany.mockResolvedValueOnce([
      { name: 'failing-job', intervalMs: 120_000, metadata: { attempt: 1 } },
    ]);
    mockPrisma.recurringJob.update.mockResolvedValue({});

    await scheduler.runDueJobs(new Date('2025-06-04T10:05:00.000Z'));

    expect(handler).toHaveBeenCalledTimes(1);
    expect(mockPrisma.jobExecutionLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          jobName: 'failing-job',
          status: 'FAILED' satisfies JobExecutionStatus,
          error: 'boom',
          metadata: expect.objectContaining({ attempt: 2, lastError: 'boom', lastErrorAt: expect.any(String) }),
        }),
      })
    );
    expect(mockPrisma.recurringJob.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          metadata: expect.objectContaining({ attempt: 2, lastError: 'boom', lastErrorAt: expect.any(String) }),
        }),
      })
    );
  });

  it('disables jobs after max attempts', async () => {
    const scheduler = await prepareModule();

    const handler = jest.fn(() => {
      throw new Error('still failing');
    });

    scheduler.registerJob({ name: 'persistent-failure', intervalMs: 90_000, handler });

    mockPrisma.recurringJob.findUnique.mockResolvedValueOnce({
      name: 'persistent-failure',
      intervalMs: 90_000,
      metadata: { attempt: 5 },
    });
    mockPrisma.recurringJob.findMany.mockResolvedValueOnce([
      { name: 'persistent-failure', intervalMs: 90_000, metadata: { attempt: 5 } },
    ]);
    mockPrisma.recurringJob.update.mockResolvedValue({});

    await expect(scheduler.runDueJobs(new Date('2025-06-04T11:00:00.000Z'))).resolves.toBeUndefined();

    expect(mockPrisma.recurringJob.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { name: 'persistent-failure' },
        data: expect.objectContaining({
          isActive: false,
          metadata: expect.objectContaining({
            attempt: 5,
            lastError: 'still failing',
            disabledAt: expect.any(String),
          }),
        }),
      })
    );
  });

  it('allows manual job trigger', async () => {
    const scheduler = await prepareModule();

    const handler = jest.fn();
    scheduler.registerJob({ name: 'manual-job', intervalMs: 30_000, handler });

    mockPrisma.recurringJob.findUnique.mockResolvedValueOnce(null);
    mockPrisma.recurringJob.create.mockResolvedValue({
      name: 'manual-job',
      intervalMs: 30_000,
      nextRunAt: new Date(),
      metadata: { attempt: 1 },
    });
    mockPrisma.recurringJob.update.mockResolvedValue({});
    mockPrisma.jobExecutionLog.create.mockResolvedValue({});

    await scheduler.triggerJob('manual-job');

    expect(handler).toHaveBeenCalledTimes(1);
    expect(mockPrisma.jobExecutionLog.create).toHaveBeenCalled();
  });

  it('computes backlog metadata for admin diagnostics', async () => {
    const scheduler = await prepareModule();

    mockPrisma.recurringJob.findMany.mockResolvedValueOnce([
      {
        name: 'notification-fanout',
        handlerKey: 'notification-fanout',
        intervalMs: 5 * 60_000,
        nextRunAt: new Date('2025-06-04T09:50:00.000Z'),
        lastRunAt: new Date('2025-06-04T09:45:00.000Z'),
        metadata: { attempt: 1 },
        isActive: true,
        createdAt: new Date('2025-06-01T10:00:00.000Z'),
        updatedAt: new Date('2025-06-04T09:45:00.000Z'),
        id: 'job-notification-fanout',
      },
    ]);
    mockPrisma.jobExecutionLog.findMany.mockResolvedValueOnce([]);

    const { jobs } = await scheduler.getJobHealth(new Date('2025-06-04T10:50:00.000Z'));

    expect(jobs).toEqual([
      expect.objectContaining({
        name: 'notification-fanout',
        backlogRunCount: 12,
        overdueByMs: 60 * 60 * 1000,
      }),
    ]);
  });
});
