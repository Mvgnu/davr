const escrowAccountFindMany = jest.fn();
const escrowTransactionFindMany = jest.fn();
const escrowAccountCount = jest.fn();

jest.mock('@prisma/client', () => ({
  EscrowStatus: {
    DISPUTED: 'DISPUTED',
    AWAITING_FUNDS: 'AWAITING_FUNDS',
  },
  EscrowTransactionType: {
    ADJUSTMENT: 'ADJUSTMENT',
    FUND: 'FUND',
  },
}), { virtual: true });

jest.mock('@/lib/db/prisma', () => ({
  prisma: {
    escrowAccount: {
      findMany: escrowAccountFindMany,
      count: escrowAccountCount,
    },
    escrowTransaction: {
      findMany: escrowTransactionFindMany,
    },
  },
}));

describe('escrow metrics helpers', () => {
  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    escrowAccountFindMany.mockReset();
    escrowTransactionFindMany.mockReset();
    escrowAccountCount.mockReset();
  });

  it('returns dispute queue items with outstanding amount and labels', async () => {
    const disputeOccurredAt = new Date('2025-06-05T09:00:00.000Z');
    escrowAccountFindMany.mockResolvedValue([
      {
        status: 'DISPUTED',
        negotiation: { id: 'neg-123456', status: 'ESCROW_FUNDED' },
        providerReference: 'prov-1',
        fundedAmount: 1500,
        releasedAmount: 500,
        refundedAmount: 200,
        updatedAt: new Date('2025-06-05T10:00:00.000Z'),
        transactions: [
          {
            occurredAt: disputeOccurredAt,
            metadata: { providerEvent: 'dispute_opened' },
          },
        ],
      },
    ]);

    const { getEscrowDisputeQueue } = await import('@/lib/escrow/metrics');
    const result = await getEscrowDisputeQueue();

    expect(escrowAccountFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { status: 'DISPUTED' },
        take: 20,
      })
    );
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      negotiationId: 'neg-123456',
      outstandingAmount: 800,
      lastEventLabel: 'Dispute eröffnet',
    });
    expect(result[0].disputedSince.toISOString()).toBe(disputeOccurredAt.toISOString());
  });

  it('maps reconciliation adjustments into alert items', async () => {
    const occurredAt = new Date('2025-06-06T08:30:00.000Z');
    escrowTransactionFindMany.mockResolvedValue([
      {
        occurredAt,
        reference: 'stmt-1',
        metadata: {
          reconciliation: {
            status: 'MISMATCH',
            delta: 12.345,
            providerBalance: 1000.129,
            ledgerBalance: 988.6,
            statementId: 'stmt-1',
          },
        },
        escrowAccount: {
          providerReference: 'prov-1',
          negotiation: { id: 'neg-abc', status: 'ESCROW_FUNDED' },
        },
      },
    ]);

    const { getEscrowReconciliationAlerts } = await import('@/lib/escrow/metrics');
    const alerts = await getEscrowReconciliationAlerts();

    expect(escrowTransactionFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ type: 'ADJUSTMENT' }),
        take: 20,
      })
    );
    expect(alerts).toHaveLength(1);
    expect(alerts[0]).toMatchObject({
      negotiationId: 'neg-abc',
      delta: 12.35,
      providerBalance: 1000.13,
      ledgerBalance: 988.6,
      statementId: 'stmt-1',
    });
    expect(alerts[0].occurredAt.toISOString()).toBe(occurredAt.toISOString());
  });

  it('computes funding latency aggregates and samples', async () => {
    const firstOccurredAt = new Date('2025-06-07T12:00:00.000Z');
    const secondOccurredAt = new Date('2025-06-07T09:30:00.000Z');

    escrowTransactionFindMany.mockResolvedValue([
      {
        occurredAt: firstOccurredAt,
        escrowAccount: {
          negotiation: { id: 'neg-one', initiatedAt: new Date('2025-06-07T10:00:00.000Z') },
        },
      },
      {
        occurredAt: secondOccurredAt,
        escrowAccount: {
          negotiation: { id: 'neg-two', initiatedAt: new Date('2025-06-07T09:00:00.000Z') },
        },
      },
    ]);

    escrowAccountCount.mockResolvedValueOnce(3);
    escrowAccountCount.mockResolvedValueOnce(1);

    const { getEscrowFundingLatencyMetrics } = await import('@/lib/escrow/metrics');
    const metrics = await getEscrowFundingLatencyMetrics();

    expect(escrowTransactionFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ type: 'FUND' }),
        take: 100,
      })
    );
    expect(metrics.sampleSize).toBe(2);
    expect(metrics.awaitingFundingCount).toBe(3);
    expect(metrics.overdueAwaitingCount).toBe(1);
    expect(metrics.averageMinutes).toBeCloseTo(75);
    expect(metrics.medianMinutes).toBeCloseTo(75);
    expect(metrics.percentile90Minutes).toBeCloseTo(120);
    expect(metrics.recentSamples[0].negotiationId).toBe('neg-one');
  });
});
