import { differenceInMinutes } from 'date-fns';
import { EscrowStatus, EscrowTransactionType, type Prisma } from '@prisma/client';

import { prisma } from '@/lib/db/prisma';
import { getDealDisputeQueue, type DealDisputeQueueItem } from '@/lib/disputes/service';

const OVERDUE_THRESHOLD_HOURS = 24;

export type DisputeQueueItem = DealDisputeQueueItem;

export interface ReconciliationAlertItem {
  negotiationId: string;
  negotiationStatus: NegotiationStatus;
  providerReference: string | null;
  statementId: string | null;
  delta: number;
  providerBalance: number;
  ledgerBalance: number;
  occurredAt: Date;
}

export interface EscrowFundingLatencyMetrics {
  sampleSize: number;
  averageMinutes: number | null;
  medianMinutes: number | null;
  percentile90Minutes: number | null;
  awaitingFundingCount: number;
  overdueAwaitingCount: number;
  overdueThresholdHours: number;
  recentSamples: Array<{ negotiationId: string; minutes: number; occurredAt: Date }>;
}

/**
 * meta: module=escrow-metrics owner=platform scope=operations version=0.2
 * Aggregates reconciliation and funding latency insights for the admin
 * operations console and proxies the dedicated dispute queue helper.
 */
export const getEscrowDisputeQueue = getDealDisputeQueue;

export async function getEscrowReconciliationAlerts(
  limit = 20
): Promise<ReconciliationAlertItem[]> {
  const adjustments = await prisma.escrowTransaction.findMany({
    where: {
      type: EscrowTransactionType.ADJUSTMENT,
      metadata: {
        path: ['reconciliation', 'status'],
        equals: 'MISMATCH',
      },
    },
    include: {
      escrowAccount: {
        include: {
          negotiation: { select: { id: true, status: true } },
        },
      },
    },
    orderBy: { occurredAt: 'desc' },
    take: limit,
  });

  return adjustments
    .filter((txn) => txn.escrowAccount?.negotiation)
    .map((txn) => {
      const reconciliation = (txn.metadata as Prisma.JsonObject | null | undefined)?.reconciliation as
        | Prisma.JsonObject
        | undefined;

      const delta = typeof reconciliation?.delta === 'number' ? reconciliation.delta : 0;
      const providerBalance =
        typeof reconciliation?.providerBalance === 'number' ? reconciliation.providerBalance : 0;
      const ledgerBalance =
        typeof reconciliation?.ledgerBalance === 'number' ? reconciliation.ledgerBalance : 0;
      const statementId =
        typeof reconciliation?.statementId === 'string'
          ? reconciliation.statementId
          : typeof reconciliation?.providerStatementId === 'string'
          ? reconciliation.providerStatementId
          : txn.reference ?? null;

      return {
        negotiationId: txn.escrowAccount!.negotiation!.id,
        negotiationStatus: txn.escrowAccount!.negotiation!.status,
        providerReference: txn.escrowAccount!.providerReference,
        statementId,
        delta: Number(delta.toFixed(2)),
        providerBalance: Number(providerBalance.toFixed(2)),
        ledgerBalance: Number(ledgerBalance.toFixed(2)),
        occurredAt: txn.occurredAt,
      };
    });
}

export async function getEscrowFundingLatencyMetrics(): Promise<EscrowFundingLatencyMetrics> {
  const [fundingTransactions, awaitingFundingCount, overdueAwaitingCount] = await Promise.all([
    prisma.escrowTransaction.findMany({
      where: { type: EscrowTransactionType.FUND },
      include: {
        escrowAccount: {
          include: {
            negotiation: { select: { id: true, initiatedAt: true } },
          },
        },
      },
      orderBy: { occurredAt: 'desc' },
      take: 100,
    }),
    prisma.escrowAccount.count({ where: { status: EscrowStatus.AWAITING_FUNDS } }),
    prisma.escrowAccount.count({
      where: {
        status: EscrowStatus.AWAITING_FUNDS,
        createdAt: {
          lt: new Date(Date.now() - OVERDUE_THRESHOLD_HOURS * 60 * 60 * 1000),
        },
      },
    }),
  ]);

  const latencies = fundingTransactions
    .filter((txn) => txn.escrowAccount?.negotiation)
    .map((txn) => {
      const negotiation = txn.escrowAccount!.negotiation!;
      const minutes = Math.max(
        0,
        differenceInMinutes(txn.occurredAt, negotiation.initiatedAt ?? txn.occurredAt)
      );
      return { negotiationId: negotiation.id, minutes, occurredAt: txn.occurredAt };
    });

  const samples = latencies.sort((a, b) => b.occurredAt.getTime() - a.occurredAt.getTime());
  const stats = computeLatencyStats(samples.map((sample) => sample.minutes));

  return {
    sampleSize: samples.length,
    averageMinutes: stats.average,
    medianMinutes: stats.median,
    percentile90Minutes: stats.percentile90,
    awaitingFundingCount,
    overdueAwaitingCount,
    overdueThresholdHours: OVERDUE_THRESHOLD_HOURS,
    recentSamples: samples.slice(0, 5),
  };
}

function computeLatencyStats(values: number[]): {
  average: number | null;
  median: number | null;
  percentile90: number | null;
} {
  if (!values.length) {
    return { average: null, median: null, percentile90: null };
  }

  const sorted = [...values].sort((a, b) => a - b);
  const sum = sorted.reduce((acc, value) => acc + value, 0);
  const average = Number((sum / sorted.length).toFixed(1));

  const mid = Math.floor(sorted.length / 2);
  const median =
    sorted.length % 2 === 0
      ? Number(((sorted[mid - 1] + sorted[mid]) / 2).toFixed(1))
      : Number(sorted[mid].toFixed(1));

  const percentileIndex = Math.min(sorted.length - 1, Math.floor(sorted.length * 0.9));
  const percentile90 = Number(sorted[percentileIndex].toFixed(1));

  return { average, median, percentile90 };
}
