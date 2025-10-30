describe('scanDealDisputeSlaBreaches', () => {
  const prismaMock = {
    dealDispute: {
      findMany: jest.fn(),
      update: jest.fn(),
    },
    dealDisputeEvent: {
      create: jest.fn(),
    },
    $transaction: jest.fn(),
  } as unknown as {
    dealDispute: { findMany: jest.Mock; update: jest.Mock };
    dealDisputeEvent: { create: jest.Mock };
    $transaction: jest.Mock;
  };

  const publishNegotiationEventMock = jest.fn();

  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();

    prismaMock.dealDispute.findMany.mockReset();
    prismaMock.dealDispute.update.mockReset();
    prismaMock.dealDisputeEvent.create.mockReset();
    prismaMock.$transaction.mockReset().mockImplementation(async (fn: any) =>
      fn({
        dealDispute: { update: prismaMock.dealDispute.update },
        dealDisputeEvent: { create: prismaMock.dealDisputeEvent.create },
      })
    );
    publishNegotiationEventMock.mockReset();
  });

  async function loadJobModule() {
    jest.doMock('@prisma/client', () => ({
      DealDisputeStatus: {
        OPEN: 'OPEN',
        ESCALATED: 'ESCALATED',
      },
      DealDisputeEventType: {
        SLA_BREACH_RECORDED: 'SLA_BREACH_RECORDED',
      },
    }));
    jest.doMock('@/lib/db/prisma', () => ({ prisma: prismaMock }));
    jest.doMock('@/lib/events/negotiations', () => ({
      publishNegotiationEvent: publishNegotiationEventMock,
    }));
    jest.doMock('@/lib/disputes/service', () => ({
      ACTIVE_DISPUTE_STATUSES: ['OPEN', 'UNDER_REVIEW', 'ESCALATED'],
    }));

    const module = await import('@/lib/jobs/disputes/sla');
    return module;
  }

  it('marks overdue disputes as escalated and emits events', async () => {
    const referenceDate = new Date('2025-10-30T10:00:00.000Z');
    prismaMock.dealDispute.findMany.mockResolvedValueOnce([
      {
        id: 'disp-1',
        negotiationId: 'neg-1',
        status: 'OPEN',
        escalatedAt: null,
        negotiation: { status: 'ESCROW_FUNDED' },
      },
    ]);
    prismaMock.dealDispute.update.mockResolvedValueOnce({ id: 'disp-1', status: 'ESCALATED' });

    const { scanDealDisputeSlaBreaches } = await loadJobModule();
    const result = await scanDealDisputeSlaBreaches(referenceDate);

    expect(prismaMock.dealDispute.findMany).toHaveBeenCalledWith({
      where: {
        slaDueAt: { not: null, lt: referenceDate },
        slaBreachedAt: null,
        status: { in: ['OPEN', 'UNDER_REVIEW', 'ESCALATED'] },
      },
      select: expect.any(Object),
    });
    expect(prismaMock.dealDispute.update).toHaveBeenCalledWith({
      where: { id: 'disp-1' },
      data: expect.objectContaining({ slaBreachedAt: referenceDate, status: 'ESCALATED', escalatedAt: referenceDate }),
    });
    expect(prismaMock.dealDisputeEvent.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        disputeId: 'disp-1',
        type: 'SLA_BREACH_RECORDED',
        status: 'ESCALATED',
      }),
    });
    expect(publishNegotiationEventMock).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'DEAL_DISPUTE_SLA_BREACHED',
        negotiationId: 'neg-1',
        payload: expect.objectContaining({ disputeId: 'disp-1', escalated: true }),
      })
    );
    expect(result).toEqual(['disp-1']);
  });

  it('returns empty array when nothing is overdue', async () => {
    prismaMock.dealDispute.findMany.mockResolvedValueOnce([]);

    const { scanDealDisputeSlaBreaches } = await loadJobModule();
    const result = await scanDealDisputeSlaBreaches();

    expect(prismaMock.dealDispute.update).not.toHaveBeenCalled();
    expect(prismaMock.dealDisputeEvent.create).not.toHaveBeenCalled();
    expect(publishNegotiationEventMock).not.toHaveBeenCalled();
    expect(result).toEqual([]);
  });
});
