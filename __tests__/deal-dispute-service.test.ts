const dealDisputeFindMany = jest.fn();
const dealDisputeFindUnique = jest.fn();
const dealDisputeFindFirst = jest.fn();
const dealDisputeCreate = jest.fn();
const dealDisputeUpdate = jest.fn();
const dealDisputeEventCreate = jest.fn();
const dealDisputeEvidenceCreateMany = jest.fn();
const escrowAccountUpdate = jest.fn();
const escrowTransactionCreate = jest.fn();
const negotiationFindUnique = jest.fn();
const publishNegotiationEventMock = jest.fn();

const transactionMock = jest.fn((operations) => {
  if (typeof operations === 'function') {
    return operations({
      dealDispute: { create: dealDisputeCreate, update: dealDisputeUpdate },
      dealDisputeEvent: { create: dealDisputeEventCreate },
      dealDisputeEvidence: { createMany: dealDisputeEvidenceCreateMany },
      escrowAccount: { update: escrowAccountUpdate },
      escrowTransaction: { create: escrowTransactionCreate },
    });
  }

  if (Array.isArray(operations)) {
    return Promise.all(operations);
  }

  return Promise.resolve(operations);
});

jest.mock('@prisma/client', () => ({
  DealDisputeStatus: {
    OPEN: 'OPEN',
    UNDER_REVIEW: 'UNDER_REVIEW',
    AWAITING_PARTIES: 'AWAITING_PARTIES',
    ESCALATED: 'ESCALATED',
    RESOLVED: 'RESOLVED',
    CLOSED: 'CLOSED',
  },
  DealDisputeSeverity: {
    LOW: 'LOW',
    MEDIUM: 'MEDIUM',
    HIGH: 'HIGH',
    CRITICAL: 'CRITICAL',
  },
  DealDisputeCategory: {
    ESCROW: 'ESCROW',
    DELIVERY: 'DELIVERY',
    QUALITY: 'QUALITY',
    OTHER: 'OTHER',
  },
  DealDisputeEventType: {
    CREATED: 'CREATED',
    STATUS_CHANGED: 'STATUS_CHANGED',
    ESCALATION_TRIGGERED: 'ESCALATION_TRIGGERED',
    RESOLUTION_RECORDED: 'RESOLUTION_RECORDED',
    ASSIGNMENT_UPDATED: 'ASSIGNMENT_UPDATED',
    EVIDENCE_ATTACHED: 'EVIDENCE_ATTACHED',
    SLA_BREACH_RECORDED: 'SLA_BREACH_RECORDED',
    ESCROW_HOLD_APPLIED: 'ESCROW_HOLD_APPLIED',
    ESCROW_COUNTER_PROPOSED: 'ESCROW_COUNTER_PROPOSED',
    ESCROW_PAYOUT_RELEASED: 'ESCROW_PAYOUT_RELEASED',
  },
  DealDisputeEvidenceType: {
    LINK: 'LINK',
    FILE: 'FILE',
    NOTE: 'NOTE',
  },
  EscrowStatus: {
    FUNDED: 'FUNDED',
    DISPUTED: 'DISPUTED',
    RELEASED: 'RELEASED',
    REFUNDED: 'REFUNDED',
  },
  EscrowTransactionType: {
    DISPUTE_HOLD: 'DISPUTE_HOLD',
    DISPUTE_RELEASE: 'DISPUTE_RELEASE',
    DISPUTE_PAYOUT: 'DISPUTE_PAYOUT',
  },
}), { virtual: true });

jest.mock('@/lib/db/prisma', () => ({
  prisma: {
    negotiation: {
      findUnique: negotiationFindUnique,
    },
    dealDispute: {
      findMany: dealDisputeFindMany,
      findUnique: dealDisputeFindUnique,
      findFirst: dealDisputeFindFirst,
      create: dealDisputeCreate,
      update: dealDisputeUpdate,
    },
    dealDisputeEvent: {
      create: dealDisputeEventCreate,
    },
    dealDisputeEvidence: {
      createMany: dealDisputeEvidenceCreateMany,
    },
    escrowAccount: {
      update: escrowAccountUpdate,
    },
    escrowTransaction: {
      create: escrowTransactionCreate,
    },
    $transaction: transactionMock,
  },
}));

jest.mock('@/lib/events/negotiations', () => ({
  publishNegotiationEvent: publishNegotiationEventMock,
}));

describe('deal dispute service', () => {
  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    dealDisputeFindMany.mockReset();
    dealDisputeFindUnique.mockReset();
    dealDisputeFindFirst.mockReset();
    dealDisputeCreate.mockReset();
    dealDisputeUpdate.mockReset();
    dealDisputeEventCreate.mockReset();
    dealDisputeEvidenceCreateMany.mockReset();
    escrowAccountUpdate.mockReset();
    escrowTransactionCreate.mockReset();
    negotiationFindUnique.mockReset();
    publishNegotiationEventMock.mockReset();
    transactionMock.mockClear();
  });

  it('maps disputes into queue items with metadata', async () => {
    const raisedAt = new Date('2025-10-20T10:00:00.000Z');
    const slaDueAt = new Date('2025-10-21T10:00:00.000Z');
    const latestEventCreatedAt = new Date('2025-10-20T12:00:00.000Z');

    dealDisputeFindMany.mockResolvedValue([
      {
        id: 'disp-1',
        negotiationId: 'neg-1',
        negotiation: { id: 'neg-1', status: 'ESCROW_FUNDED' },
        status: 'OPEN',
        severity: 'HIGH',
        category: 'ESCROW',
        summary: 'Escrow Auszahlung blockiert',
        raisedAt,
        slaDueAt,
        slaBreachedAt: null,
        holdAmount: 0,
        counterProposalAmount: null,
        resolutionPayoutAmount: null,
        escrowStatus: null,
        escrowCurrency: null,
        assignedTo: { id: 'admin-1', name: 'Admin', email: 'admin@example.com' },
        raisedBy: { id: 'buyer-1', name: 'Buyer', role: 'USER' },
        events: [
          {
            type: 'STATUS_CHANGED',
            status: 'OPEN',
            message: 'Initiale Erstellung',
            createdAt: latestEventCreatedAt,
          },
        ],
        evidence: [
          { id: 'ev-1', type: 'LINK', url: 'https://example.com', label: 'Nachweis', createdAt: new Date('2025-10-20T11:00:00.000Z') },
        ],
      },
    ]);

    const { getDealDisputeQueue } = await import('@/lib/disputes/service');
    const result = await getDealDisputeQueue();

    expect(dealDisputeFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { status: { in: expect.any(Array) } },
        take: 20,
      })
    );

    expect(result).toEqual([
      {
        id: 'disp-1',
        negotiationId: 'neg-1',
        negotiationStatus: 'ESCROW_FUNDED',
        status: 'OPEN',
        severity: 'HIGH',
        category: 'ESCROW',
        summary: 'Escrow Auszahlung blockiert',
        raisedAt,
        slaDueAt,
        slaBreachedAt: null,
        holdAmount: 0,
        counterProposalAmount: null,
        resolutionPayoutAmount: null,
        escrowStatus: null,
        escrowCurrency: null,
        assignedTo: { id: 'admin-1', name: 'Admin', email: 'admin@example.com' },
        raisedBy: { id: 'buyer-1', name: 'Buyer', role: 'USER' },
        evidence: [
          {
            id: 'ev-1',
            type: 'LINK',
            url: 'https://example.com',
            label: 'Nachweis',
            uploadedAt: new Date('2025-10-20T11:00:00.000Z'),
          },
        ],
        latestEvent: {
          type: 'STATUS_CHANGED',
          status: 'OPEN',
          message: 'Initiale Erstellung',
          createdAt: latestEventCreatedAt,
        },
      },
    ]);
  });

  it('records status transitions and audit events', async () => {
    dealDisputeFindUnique.mockResolvedValueOnce({
      status: 'OPEN',
      acknowledgedAt: null,
      escalatedAt: null,
      resolvedAt: null,
    });

    dealDisputeUpdate.mockResolvedValue({ id: 'disp-1', status: 'UNDER_REVIEW' });
    dealDisputeEventCreate.mockResolvedValue({ id: 'event-1' });

    const { transitionDealDisputeStatus } = await import('@/lib/disputes/service');
    await transitionDealDisputeStatus({
      disputeId: 'disp-1',
      targetStatus: 'UNDER_REVIEW',
      actorUserId: 'admin-1',
      note: 'Übernahme bestätigt',
    });

    expect(dealDisputeUpdate).toHaveBeenCalledWith({
      where: { id: 'disp-1' },
      data: expect.objectContaining({
        status: 'UNDER_REVIEW',
        acknowledgedAt: expect.any(Date),
      }),
    });

    expect(dealDisputeEventCreate).toHaveBeenCalledWith({
      data: {
        disputeId: 'disp-1',
        actorUserId: 'admin-1',
        type: 'STATUS_CHANGED',
        status: 'UNDER_REVIEW',
        message: 'Übernahme bestätigt',
      },
    });

    expect(transactionMock).toHaveBeenCalledTimes(1);
  });

  it('supports assignment updates with audit trail', async () => {
    dealDisputeUpdate.mockResolvedValue({ id: 'disp-2', assignedToUserId: 'admin-2' });
    dealDisputeEventCreate.mockResolvedValue({ id: 'event-2' });

    const { assignDealDispute } = await import('@/lib/disputes/service');
    await assignDealDispute({
      disputeId: 'disp-2',
      assigneeUserId: 'admin-2',
      actorUserId: 'admin-1',
    });

    expect(dealDisputeUpdate).toHaveBeenCalledWith({
      where: { id: 'disp-2' },
      data: { assignedToUserId: 'admin-2' },
    });

    expect(dealDisputeEventCreate).toHaveBeenCalledWith({
      data: {
        disputeId: 'disp-2',
        actorUserId: 'admin-1',
        type: 'ASSIGNMENT_UPDATED',
        status: null,
        message: 'Assigned to admin-2',
      },
    });
  });

  it('creates disputes with evidence and publishes events', async () => {
    negotiationFindUnique.mockResolvedValue({ id: 'neg-1' });
    dealDisputeFindFirst.mockResolvedValue(null);
    dealDisputeCreate.mockResolvedValue({ id: 'disp-100' });
    dealDisputeEvidenceCreateMany.mockResolvedValue({ count: 1 });

    const { createDealDispute } = await import('@/lib/disputes/service');

    await createDealDispute({
      negotiationId: 'neg-1',
      raisedByUserId: 'buyer-1',
      summary: 'Lieferung blieb aus trotz Zahlung',
      description: 'Bitte prüfen Sie den Status beim Spediteur',
      requestedOutcome: 'Ware verschicken oder Erstattung',
      severity: 'HIGH',
      category: 'DELIVERY',
      attachments: [
        { type: 'LINK', url: 'https://example.com/proof', label: 'Tracking' },
      ],
    });

    expect(negotiationFindUnique).toHaveBeenCalledWith({
      where: { id: 'neg-1' },
      select: { id: true },
    });
    expect(dealDisputeFindFirst).toHaveBeenCalledWith({
      where: { negotiationId: 'neg-1', status: { in: expect.any(Array) } },
      select: { id: true },
    });
    expect(dealDisputeCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        negotiationId: 'neg-1',
        raisedByUserId: 'buyer-1',
        summary: 'Lieferung blieb aus trotz Zahlung',
        severity: 'HIGH',
        category: 'DELIVERY',
      }),
    });
    expect(dealDisputeEvidenceCreateMany).toHaveBeenCalledWith({
      data: [
        {
          disputeId: 'disp-100',
          uploadedByUserId: 'buyer-1',
          type: 'LINK',
          url: 'https://example.com/proof',
          label: 'Tracking',
        },
      ],
    });
    expect(publishNegotiationEventMock).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'DEAL_DISPUTE_RAISED',
        negotiationId: 'neg-1',
        triggeredBy: 'buyer-1',
        payload: expect.objectContaining({ disputeId: 'disp-100', severity: 'HIGH', category: 'DELIVERY', attachments: 1 }),
      })
    );
  });

  it('applies escrow holds and records events', async () => {
    dealDisputeFindUnique.mockResolvedValueOnce({
      id: 'disp-esc',
      holdAmount: 0,
      negotiation: {
        id: 'neg-esc',
        status: 'ESCROW_FUNDED',
        escrowAccount: { id: 'esc-1', status: 'FUNDED', currency: 'EUR' },
      },
    });
    dealDisputeUpdate.mockResolvedValueOnce({ id: 'disp-esc', status: 'OPEN', holdAmount: 100 });
    escrowAccountUpdate.mockResolvedValueOnce({ id: 'esc-1', status: 'DISPUTED' });
    escrowTransactionCreate.mockResolvedValueOnce({ id: 'txn-1' });

    const { applyDisputeEscrowHold } = await import('@/lib/disputes/service');
    await applyDisputeEscrowHold({
      disputeId: 'disp-esc',
      actorUserId: 'admin-1',
      amount: 100,
      reason: 'Teilbetrag sichern',
    });

    expect(dealDisputeUpdate).toHaveBeenCalledWith({
      where: { id: 'disp-esc' },
      data: expect.objectContaining({ holdAmount: { increment: 100 } }),
    });
    expect(escrowTransactionCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          escrowAccountId: 'esc-1',
          type: 'DISPUTE_HOLD',
          amount: 100,
          metadata: expect.objectContaining({ disputeId: 'disp-esc', reason: 'Teilbetrag sichern' }),
        }),
      })
    );
    expect(escrowAccountUpdate).toHaveBeenCalledWith({
      where: { id: 'esc-1' },
      data: { status: 'DISPUTED' },
    });
    expect(dealDisputeEventCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        disputeId: 'disp-esc',
        type: 'ESCROW_HOLD_APPLIED',
        message: 'Teilbetrag sichern',
      }),
    });
    expect(publishNegotiationEventMock).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'DEAL_DISPUTE_ESCROW_HOLD',
        negotiationId: 'neg-esc',
        triggeredBy: 'admin-1',
        payload: expect.objectContaining({ amount: 100, reason: 'Teilbetrag sichern' }),
      })
    );
  });

  it('records counter proposals without touching escrow balances', async () => {
    dealDisputeFindUnique.mockResolvedValueOnce({
      id: 'disp-counter',
      negotiation: {
        id: 'neg-counter',
        status: 'ESCALATED',
        escrowAccount: { id: 'esc-2', status: 'DISPUTED', currency: 'EUR' },
      },
    });
    dealDisputeUpdate.mockResolvedValueOnce({ id: 'disp-counter', status: 'ESCALATED', counterProposalAmount: 150 });

    const { recordDisputeCounterProposal } = await import('@/lib/disputes/service');
    await recordDisputeCounterProposal({
      disputeId: 'disp-counter',
      actorUserId: 'admin-2',
      amount: 150,
      note: '50 % Erstattung anbieten',
    });

    expect(escrowTransactionCreate).not.toHaveBeenCalled();
    expect(escrowAccountUpdate).not.toHaveBeenCalled();
    expect(dealDisputeUpdate).toHaveBeenCalledWith({
      where: { id: 'disp-counter' },
      data: { counterProposalAmount: 150 },
    });
    expect(dealDisputeEventCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        disputeId: 'disp-counter',
        type: 'ESCROW_COUNTER_PROPOSED',
        message: '50 % Erstattung anbieten',
      }),
    });
    expect(publishNegotiationEventMock).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'DEAL_DISPUTE_ESCROW_COUNTER',
        negotiationId: 'neg-counter',
        triggeredBy: 'admin-2',
        payload: expect.objectContaining({ amount: 150, note: '50 % Erstattung anbieten' }),
      })
    );
  });

  it('settles dispute payouts and updates escrow metrics', async () => {
    dealDisputeFindUnique.mockResolvedValueOnce({
      id: 'disp-pay',
      holdAmount: 200,
      negotiation: {
        id: 'neg-pay',
        status: 'ESCALATED',
        escrowAccount: { id: 'esc-3', status: 'DISPUTED', currency: 'EUR' },
      },
    });
    dealDisputeUpdate.mockResolvedValueOnce({ id: 'disp-pay', status: 'ESCALATED', holdAmount: 50 });
    escrowAccountUpdate.mockResolvedValueOnce({ id: 'esc-3', releasedAmount: 150 });
    escrowTransactionCreate.mockResolvedValueOnce({ id: 'txn-3' });

    const { settleDisputeEscrowPayout } = await import('@/lib/disputes/service');
    await settleDisputeEscrowPayout({
      disputeId: 'disp-pay',
      actorUserId: 'admin-3',
      amount: 150,
      direction: 'RELEASE_TO_SELLER',
      note: 'Lieferung bestätigt',
    });

    expect(escrowTransactionCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          escrowAccountId: 'esc-3',
          type: 'DISPUTE_PAYOUT',
          amount: 150,
          metadata: expect.objectContaining({ direction: 'RELEASE_TO_SELLER' }),
        }),
      })
    );
    expect(escrowAccountUpdate).toHaveBeenCalledWith({
      where: { id: 'esc-3' },
      data: expect.objectContaining({ releasedAmount: { increment: 150 } }),
    });
    expect(dealDisputeUpdate).toHaveBeenCalledWith({
      where: { id: 'disp-pay' },
      data: expect.objectContaining({
        holdAmount: 50,
        resolutionPayoutAmount: { increment: 150 },
      }),
    });
    expect(dealDisputeEventCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        disputeId: 'disp-pay',
        type: 'ESCROW_PAYOUT_RELEASED',
        message: 'Lieferung bestätigt',
        metadata: expect.objectContaining({ amount: 150, remainingHold: 50 }),
      }),
    });
    expect(publishNegotiationEventMock).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'DEAL_DISPUTE_ESCROW_PAYOUT',
        negotiationId: 'neg-pay',
        triggeredBy: 'admin-3',
        payload: expect.objectContaining({ amount: 150, direction: 'RELEASE_TO_SELLER', remainingHold: 50 }),
      })
    );
  });
});
