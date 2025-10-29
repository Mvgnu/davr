describe('reconcileEscrowLedgers job', () => {
  const prismaMock = {
    escrowAccount: {
      findMany: jest.fn(),
    },
    escrowTransaction: {
      findFirst: jest.fn(),
      create: jest.fn(),
    },
  } as unknown as {
    escrowAccount: {
      findMany: jest.Mock;
    };
    escrowTransaction: {
      findFirst: jest.Mock;
      create: jest.Mock;
    };
  };

  const publishNegotiationEventMock = jest.fn();
  const getEscrowProviderMock = jest.fn();
  const providerDouble = {
    getStatement: jest.fn(),
  } as { getStatement: jest.Mock };

  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();

    prismaMock.escrowAccount.findMany.mockReset();
    prismaMock.escrowTransaction.findFirst.mockReset();
    prismaMock.escrowTransaction.create.mockReset();
    publishNegotiationEventMock.mockReset();
    getEscrowProviderMock.mockReset().mockReturnValue(providerDouble);
    providerDouble.getStatement.mockReset();
  });

  async function loadJobModule() {
    jest.doMock('@prisma/client', () => ({
      EscrowTransactionType: {
        ADJUSTMENT: 'ADJUSTMENT',
      },
    }));
    jest.doMock('@/lib/db/prisma', () => ({ prisma: prismaMock }));
    jest.doMock('@/lib/events/negotiations', () => ({
      publishNegotiationEvent: publishNegotiationEventMock,
    }));
    jest.doMock('@/lib/integrations/escrow', () => ({
      getEscrowProvider: getEscrowProviderMock,
    }));

    const module = await import('@/lib/jobs/negotiations/reconciliation');
    return module;
  }

  function buildAccount(
    overrides: Partial<{
      id: string;
      providerReference: string | null;
      fundedAmount: number;
      releasedAmount: number;
      refundedAmount: number;
      expectedAmount: number | null;
      negotiation: { id: string; status: string } | null;
    }> = {}
  ) {
    return {
      id: 'acc_1',
      providerReference: 'prov_1',
      fundedAmount: 100,
      releasedAmount: 0,
      refundedAmount: 0,
      expectedAmount: 100,
      negotiation: { id: 'neg_1', status: 'AWAITING_FUNDS' },
      ...overrides,
    };
  }

  it('records matched statements without publishing events', async () => {
    const { reconcileEscrowLedgers } = await loadJobModule();

    prismaMock.escrowAccount.findMany.mockResolvedValueOnce([buildAccount()]);
    prismaMock.escrowTransaction.findFirst.mockResolvedValueOnce(null);
    prismaMock.escrowTransaction.create.mockResolvedValueOnce({ id: 'txn_1' });

    providerDouble.getStatement.mockResolvedValueOnce({
      statementId: 'stmt_1',
      providerReference: 'prov_1',
      balance: 100,
      disputed: false,
      generatedAt: new Date('2025-06-04T10:00:00.000Z'),
      transactions: [],
    });

    const results = await reconcileEscrowLedgers();

    expect(prismaMock.escrowTransaction.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          reference: 'stmt_1',
          metadata: expect.objectContaining({
            reconciliation: expect.objectContaining({ status: 'MATCHED', delta: 0 }),
          }),
        }),
      })
    );
    expect(publishNegotiationEventMock).not.toHaveBeenCalled();
    expect(results).toEqual([
      { negotiationId: 'neg_1', reconciliationStatus: 'MATCHED' },
    ]);
  });

  it('emits negotiation event when balances mismatch', async () => {
    const { reconcileEscrowLedgers } = await loadJobModule();

    prismaMock.escrowAccount.findMany.mockResolvedValueOnce([
      buildAccount({
        fundedAmount: 200,
        negotiation: { id: 'neg_2', status: 'FUNDED' },
        providerReference: 'prov_2',
        id: 'acc_2',
      }),
    ]);
    prismaMock.escrowTransaction.findFirst.mockResolvedValueOnce(null);
    prismaMock.escrowTransaction.create.mockResolvedValueOnce({ id: 'txn_2' });

    providerDouble.getStatement.mockResolvedValueOnce({
      statementId: 'stmt_2',
      providerReference: 'prov_2',
      balance: 150,
      disputed: false,
      generatedAt: new Date('2025-06-04T10:05:00.000Z'),
      transactions: [],
    });

    const results = await reconcileEscrowLedgers();

    expect(prismaMock.escrowTransaction.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          metadata: expect.objectContaining({
            reconciliation: expect.objectContaining({ status: 'MISMATCH', delta: -50 }),
          }),
        }),
      })
    );
    expect(publishNegotiationEventMock).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'ESCROW_STATEMENT_READY',
        negotiationId: 'neg_2',
        payload: expect.objectContaining({
          providerReference: 'prov_2',
          statementId: 'stmt_2',
          delta: -50,
        }),
      })
    );
    expect(results).toEqual([
      { negotiationId: 'neg_2', reconciliationStatus: 'MISMATCH' },
    ]);
  });

  it('skips persistence when the latest statement already matched', async () => {
    const { reconcileEscrowLedgers } = await loadJobModule();

    prismaMock.escrowAccount.findMany.mockResolvedValueOnce([buildAccount()]);
    prismaMock.escrowTransaction.findFirst.mockResolvedValueOnce({
      metadata: { reconciliation: { status: 'MATCHED' } },
    });

    providerDouble.getStatement.mockResolvedValueOnce({
      statementId: 'stmt_3',
      providerReference: 'prov_1',
      balance: 100,
      disputed: false,
      generatedAt: new Date('2025-06-04T11:00:00.000Z'),
      transactions: [],
    });

    const results = await reconcileEscrowLedgers();

    expect(prismaMock.escrowTransaction.create).not.toHaveBeenCalled();
    expect(publishNegotiationEventMock).not.toHaveBeenCalled();
    expect(results).toEqual([
      { negotiationId: 'neg_1', reconciliationStatus: 'MATCHED' },
    ]);
  });
});
