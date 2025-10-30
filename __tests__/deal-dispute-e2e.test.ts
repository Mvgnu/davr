import { NextRequest } from 'next/server';

const DealDisputeStatus = {
  OPEN: 'OPEN',
  UNDER_REVIEW: 'UNDER_REVIEW',
  AWAITING_PARTIES: 'AWAITING_PARTIES',
  ESCALATED: 'ESCALATED',
  RESOLVED: 'RESOLVED',
  CLOSED: 'CLOSED',
} as const;

const DealDisputeSeverity = {
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH',
  CRITICAL: 'CRITICAL',
} as const;

const DealDisputeCategory = {
  ESCROW: 'ESCROW',
  DELIVERY: 'DELIVERY',
  QUALITY: 'QUALITY',
  OTHER: 'OTHER',
} as const;

const DealDisputeEvidenceType = {
  LINK: 'LINK',
  FILE: 'FILE',
  NOTE: 'NOTE',
} as const;

const DealDisputeEventType = {
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
} as const;

const EscrowStatus = {
  PENDING: 'PENDING',
  FUNDED: 'FUNDED',
  DISPUTED: 'DISPUTED',
  RELEASED: 'RELEASED',
  REFUNDED: 'REFUNDED',
  CLOSED: 'CLOSED',
} as const;

const EscrowTransactionType = {
  DISPUTE_HOLD: 'DISPUTE_HOLD',
  DISPUTE_RELEASE: 'DISPUTE_RELEASE',
  DISPUTE_PAYOUT: 'DISPUTE_PAYOUT',
} as const;

const NegotiationStatus = {
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
  EXPIRED: 'EXPIRED',
} as const;

const NegotiationActivityAudience = {
  PARTICIPANTS: 'PARTICIPANTS',
  ADMIN: 'ADMIN',
  ALL: 'ALL',
} as const;

const NegotiationActivityType = {
  NEGOTIATION_CREATED: 'NEGOTIATION_CREATED',
  NEGOTIATION_COUNTER_SUBMITTED: 'NEGOTIATION_COUNTER_SUBMITTED',
  NEGOTIATION_ACCEPTED: 'NEGOTIATION_ACCEPTED',
  NEGOTIATION_CANCELLED: 'NEGOTIATION_CANCELLED',
  ESCROW_FUNDED: 'ESCROW_FUNDED',
  ESCROW_RELEASED: 'ESCROW_RELEASED',
  ESCROW_REFUNDED: 'ESCROW_REFUNDED',
  ESCROW_DISPUTE_OPENED: 'ESCROW_DISPUTE_OPENED',
  ESCROW_DISPUTE_RESOLVED: 'ESCROW_DISPUTE_RESOLVED',
  ESCROW_STATEMENT_READY: 'ESCROW_STATEMENT_READY',
  ESCROW_DISPUTE_HOLD_APPLIED: 'ESCROW_DISPUTE_HOLD_APPLIED',
  ESCROW_DISPUTE_COUNTER_PROPOSED: 'ESCROW_DISPUTE_COUNTER_PROPOSED',
  ESCROW_DISPUTE_PAYOUT_EXECUTED: 'ESCROW_DISPUTE_PAYOUT_EXECUTED',
  ESCROW_DISPUTE_SLA_BREACHED: 'ESCROW_DISPUTE_SLA_BREACHED',
  NEGOTIATION_SLA_WARNING: 'NEGOTIATION_SLA_WARNING',
  NEGOTIATION_SLA_BREACHED: 'NEGOTIATION_SLA_BREACHED',
  CONTRACT_SIGNATURE_REQUESTED: 'CONTRACT_SIGNATURE_REQUESTED',
  CONTRACT_SIGNATURE_COMPLETED: 'CONTRACT_SIGNATURE_COMPLETED',
} as const;

const PremiumConversionEventType = {
  PREMIUM_NEGOTIATION_COMPLETED: 'PREMIUM_NEGOTIATION_COMPLETED',
} as const;

jest.mock('@prisma/client', () => ({
  DealDisputeStatus,
  DealDisputeSeverity,
  DealDisputeCategory,
  DealDisputeEvidenceType,
  DealDisputeEventType,
  EscrowStatus,
  EscrowTransactionType,
  NegotiationStatus,
  NegotiationActivityAudience,
  NegotiationActivityType,
  PremiumConversionEventType,
}));

describe('deal dispute end-to-end flow', () => {
  const initialDisputeState = {
    status: 'idle' as const,
    disputeId: null,
    message: '',
    code: 'UPDATED' as const,
  };

  const activityLog: any[] = [];
  const disputeEventsLog: Record<string, any[]> = {};
  const disputeEvidenceLog: Record<string, any[]> = {};
  const escrowTransactions: any[] = [];
  let enqueueNegotiationLifecycleEventMock: jest.Mock;
  let revalidatePathMock: jest.Mock;
  let getServerSessionMock: jest.Mock;

  const negotiation = {
    id: 'neg-1',
    buyerId: 'buyer-1',
    sellerId: 'seller-1',
    status: 'IN_PROGRESS' as const,
    escrowAccount: {
      id: 'escrow-1',
      status: EscrowStatus.FUNDED,
      currency: 'EUR',
      releasedAmount: 0,
      refundedAmount: 0,
    },
    premiumTier: null as string | null,
    listing: {
      id: 'listing-1',
      title: 'Widget Bundle',
      seller_id: 'seller-1',
      isPremiumWorkflow: false,
    },
    contract: {
      documents: [],
    },
    offers: [],
    statusHistory: [],
    activities: activityLog,
    disputes: [] as any[],
  };

  const disputes = new Map<string, any>();

  function clone<T>(value: T): T {
    return JSON.parse(JSON.stringify(value));
  }

  function createDisputeSnapshot(disputeId: string) {
    const dispute = disputes.get(disputeId);
    if (!dispute) {
      return null;
    }

    return {
      ...clone(dispute),
      assignedTo: dispute.assignedToUserId
        ? { id: dispute.assignedToUserId, name: 'Admin Agent', email: 'admin@example.com' }
        : null,
      raisedBy: {
        id: dispute.raisedByUserId,
        name: dispute.raisedByUserId === 'buyer-1' ? 'Buyer One' : 'User',
        role: 'USER',
      },
      evidence: (disputeEvidenceLog[disputeId] ?? []).slice().reverse(),
      events: (disputeEventsLog[disputeId] ?? []).slice().reverse(),
    };
  }

  function buildNegotiationSnapshot() {
    return {
      ...clone(negotiation),
      escrowAccount: clone(negotiation.escrowAccount),
      disputes: Array.from(disputes.keys())
        .map((id) => createDisputeSnapshot(id))
        .filter(Boolean),
    };
  }

  function registerPrismaDouble() {
    let disputeCounter = 0;

    function updateDispute(id: string, data: any) {
      const dispute = disputes.get(id);
      if (!dispute) {
        throw new Error('Dispute not found');
      }

      if (data.status) {
        dispute.status = data.status;
      }
      if (data.assignedToUserId !== undefined) {
        dispute.assignedToUserId = data.assignedToUserId;
      }
      if (data.holdAmount !== undefined) {
        if (typeof data.holdAmount === 'number') {
          dispute.holdAmount = data.holdAmount;
        } else if (typeof data.holdAmount?.increment === 'number') {
          dispute.holdAmount += data.holdAmount.increment;
        }
      }
      if (data.counterProposalAmount !== undefined) {
        if (typeof data.counterProposalAmount === 'number') {
          dispute.counterProposalAmount = data.counterProposalAmount;
        } else if (typeof data.counterProposalAmount?.increment === 'number') {
          dispute.counterProposalAmount += data.counterProposalAmount.increment;
        }
      }
      if (data.resolutionPayoutAmount !== undefined) {
        if (typeof data.resolutionPayoutAmount === 'number') {
          dispute.resolutionPayoutAmount = data.resolutionPayoutAmount;
        } else if (typeof data.resolutionPayoutAmount?.increment === 'number') {
          dispute.resolutionPayoutAmount += data.resolutionPayoutAmount.increment;
        }
      }
      if (data.acknowledgedAt) {
        dispute.acknowledgedAt = data.acknowledgedAt;
      }
      if (data.escalatedAt) {
        dispute.escalatedAt = data.escalatedAt;
      }
      if (data.resolvedAt) {
        dispute.resolvedAt = data.resolvedAt;
      }
      if (data.closedAt) {
        dispute.closedAt = data.closedAt;
      }
      if (data.slaBreachedAt !== undefined) {
        dispute.slaBreachedAt = data.slaBreachedAt;
      }
      dispute.updatedAt = new Date();
      return clone(dispute);
    }

    const prismaDouble = {
      negotiation: {
        findUnique: jest.fn(async (args: any) => {
          if (args?.where?.id !== negotiation.id) {
            return null;
          }

          if (args?.select) {
            const result: Record<string, unknown> = {};
            for (const [key, enabled] of Object.entries(args.select)) {
              if (!enabled) continue;
              if (key === 'escrowAccount') {
                result.escrowAccount = clone(negotiation.escrowAccount);
              } else {
                result[key] = clone((negotiation as any)[key]);
              }
            }
            return result;
          }

          return buildNegotiationSnapshot();
        }),
        update: jest.fn(async ({ where, data }: any) => {
          if (where.id !== negotiation.id) {
            throw new Error('Negotiation not found');
          }
          Object.assign(negotiation, data);
          return buildNegotiationSnapshot();
        }),
      },
      negotiationActivity: {
        create: jest.fn(async ({ data }: any) => {
          const activity = { ...data, id: `act-${activityLog.length + 1}` };
          activityLog.push(activity);
          return activity;
        }),
      },
      negotiationStatusHistory: {
        create: jest.fn(async ({ data }: any) => {
          negotiation.statusHistory.push({ ...data, id: `hist-${negotiation.statusHistory.length + 1}` });
          return negotiation.statusHistory[negotiation.statusHistory.length - 1];
        }),
      },
      dealDispute: {
        findFirst: jest.fn(async ({ where }: any) => {
          for (const dispute of disputes.values()) {
            if (dispute.negotiationId === where.negotiationId && where.status?.in.includes(dispute.status)) {
              return { id: dispute.id };
            }
          }
          return null;
        }),
        findUnique: jest.fn(async ({ where, include }: any) => {
          const dispute = disputes.get(where.id);
          if (!dispute) {
            return null;
          }
          const result: any = clone(dispute);
          if (include?.negotiation) {
            result.negotiation = buildNegotiationSnapshot();
          }
          return result;
        }),
        create: jest.fn(async ({ data }: any) => {
          disputeCounter += 1;
          const id = `disp-${disputeCounter}`;
          const now = new Date();
          const record = {
            id,
            negotiationId: data.negotiationId,
            raisedByUserId: data.raisedByUserId,
            status: DealDisputeStatus.OPEN,
            severity: data.severity ?? 'MEDIUM',
            category: data.category ?? 'ESCROW',
            summary: data.summary,
            description: data.description ?? null,
            requestedOutcome: data.requestedOutcome ?? null,
            slaDueAt: data.slaDueAt ?? null,
            slaBreachedAt: null,
            holdAmount: 0,
            counterProposalAmount: null,
            resolutionPayoutAmount: null,
            raisedAt: now,
            acknowledgedAt: null,
            escalatedAt: null,
            resolvedAt: null,
            closedAt: null,
            assignedToUserId: null,
            createdAt: now,
            updatedAt: now,
          };
          disputes.set(id, record);
          disputeEventsLog[id] = [];
          disputeEvidenceLog[id] = [];
          negotiation.disputes = Array.from(disputes.keys()).map((key) => createDisputeSnapshot(key));
          return clone(record);
        }),
        update: jest.fn(async ({ where, data }: any) => updateDispute(where.id, data)),
      },
      dealDisputeEvent: {
        create: jest.fn(async ({ data }: any) => {
          const entry = {
            id: `event-${(disputeEventsLog[data.disputeId] ?? []).length + 1}`,
            disputeId: data.disputeId,
            actorUserId: data.actorUserId ?? null,
            type: data.type,
            status: data.status ?? null,
            message: data.message ?? null,
            metadata: data.metadata ?? null,
            createdAt: new Date(),
          };
          disputeEventsLog[data.disputeId] = (disputeEventsLog[data.disputeId] ?? []).concat(entry);
          return entry;
        }),
      },
      dealDisputeEvidence: {
        createMany: jest.fn(async ({ data }: any) => {
          const entries = data.map((item: any, index: number) => ({
            id: `evi-${(disputeEvidenceLog[item.disputeId] ?? []).length + index + 1}`,
            disputeId: item.disputeId,
            uploadedByUserId: item.uploadedByUserId,
            type: item.type,
            url: item.url,
            label: item.label ?? null,
            createdAt: new Date(),
          }));
          const disputeId = data[0]?.disputeId;
          if (disputeId) {
            disputeEvidenceLog[disputeId] = (disputeEvidenceLog[disputeId] ?? []).concat(entries);
          }
          return { count: entries.length };
        }),
      },
      escrowAccount: {
        update: jest.fn(async ({ where, data }: any) => {
          if (where.id !== negotiation.escrowAccount.id) {
            throw new Error('Escrow not found');
          }
          if (data.status) {
            negotiation.escrowAccount.status = data.status;
          }
          if (data.releasedAmount?.increment) {
            negotiation.escrowAccount.releasedAmount += data.releasedAmount.increment;
          }
          if (data.refundedAmount?.increment) {
            negotiation.escrowAccount.refundedAmount += data.refundedAmount.increment;
          }
          return clone(negotiation.escrowAccount);
        }),
      },
      escrowTransaction: {
        create: jest.fn(async ({ data }: any) => {
          const record = { ...data, id: `escrow-${escrowTransactions.length + 1}` };
          escrowTransactions.push(record);
          return record;
        }),
      },
      $transaction: jest.fn(async (arg: any) => {
        if (typeof arg === 'function') {
          const tx = {
            dealDispute: {
              create: prismaDouble.dealDispute.create,
              update: prismaDouble.dealDispute.update,
              findFirst: prismaDouble.dealDispute.findFirst,
            },
            dealDisputeEvent: {
              create: prismaDouble.dealDisputeEvent.create,
            },
            dealDisputeEvidence: {
              createMany: prismaDouble.dealDisputeEvidence.createMany,
            },
            escrowAccount: {
              update: prismaDouble.escrowAccount.update,
            },
            escrowTransaction: {
              create: prismaDouble.escrowTransaction.create,
            },
            negotiation: {
              findUnique: prismaDouble.negotiation.findUnique,
              update: prismaDouble.negotiation.update,
            },
            negotiationActivity: {
              create: prismaDouble.negotiationActivity.create,
            },
          };
          return arg(tx);
        }

        if (Array.isArray(arg)) {
          return Promise.all(arg);
        }

        return arg;
      }),
    };

    global.__PRISMA_TEST_DOUBLE__ = prismaDouble as any;
    return prismaDouble;
  }

  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    activityLog.splice(0, activityLog.length);
    escrowTransactions.splice(0, escrowTransactions.length);
    Object.keys(disputeEventsLog).forEach((key) => delete disputeEventsLog[key]);
    Object.keys(disputeEvidenceLog).forEach((key) => delete disputeEvidenceLog[key]);
    disputes.clear();
    negotiation.disputes = [];
    negotiation.escrowAccount.status = EscrowStatus.FUNDED;
    negotiation.escrowAccount.releasedAmount = 0;
    negotiation.escrowAccount.refundedAmount = 0;

    registerPrismaDouble();

    enqueueNegotiationLifecycleEventMock = jest.fn();
    jest.doMock('@/lib/events/queue', () => ({
      enqueueNegotiationLifecycleEvent: enqueueNegotiationLifecycleEventMock,
    }));
    jest.doMock('@/lib/premium/entitlements', () => ({
      recordPremiumConversionEvent: jest.fn(),
    }));

    revalidatePathMock = jest.fn();
    jest.doMock('next/cache', () => ({ revalidatePath: revalidatePathMock }));

    getServerSessionMock = jest.fn();
    jest.doMock('next-auth/next', () => ({ getServerSession: getServerSessionMock }));
    jest.doMock('@/lib/auth/options', () => ({ authOptions: {} }));
  });

  afterEach(() => {
    delete (global as any).__PRISMA_TEST_DOUBLE__;
  });

  it('runs the dispute lifecycle end-to-end with notifications', async () => {
    const { POST } = await import('@/app/api/marketplace/deals/[negotiationId]/disputes/route');

    getServerSessionMock.mockResolvedValueOnce({ user: { id: 'buyer-1', role: 'USER', isAdmin: false } });

    const request = new NextRequest('http://localhost', {
      method: 'POST',
      body: JSON.stringify({
        summary: 'Shipment missing components',
        description: 'Items arrived incomplete.',
        requestedOutcome: 'Send replacement parts',
        severity: 'HIGH',
        category: 'DELIVERY',
        attachments: [{ url: 'https://evidence.local/tracking', label: 'Tracking' }],
      }),
      headers: { 'Content-Type': 'application/json' },
    });

    const response = await POST(request, { params: { negotiationId: 'neg-1' } });
    expect(response.status).toBe(200);
    const payload = await response.json();
    expect(payload.negotiation.disputes).toHaveLength(1);

    const disputeId = payload.negotiation.disputes[0].id as string;
    expect(enqueueNegotiationLifecycleEventMock.mock.calls.map((call) => call[0].type)).toContain('DEAL_DISPUTE_RAISED');

    getServerSessionMock.mockResolvedValue({ user: { id: 'admin-ops', role: 'ADMIN', isAdmin: true } });

    const actions = await import('@/app/admin/deals/operations/actions');

    const assignForm = new FormData();
    assignForm.set('disputeId', disputeId);
    assignForm.set('assigneeUserId', 'admin-ops');
    const assignResult = await actions.assignDisputeAction(initialDisputeState, assignForm);
    expect(assignResult.status).toBe('success');

    const holdForm = new FormData();
    holdForm.set('disputeId', disputeId);
    holdForm.set('amount', '250');
    holdForm.set('reason', 'Partial shipment verified');
    const holdResult = await actions.applyDisputeHoldAction(initialDisputeState, holdForm);
    expect(holdResult.status).toBe('success');

    const counterForm = new FormData();
    counterForm.set('disputeId', disputeId);
    counterForm.set('amount', '125');
    counterForm.set('note', 'Offer partial refund');
    const counterResult = await actions.recordDisputeCounterProposalAction(initialDisputeState, counterForm);
    expect(counterResult.status).toBe('success');

    const payoutForm = new FormData();
    payoutForm.set('disputeId', disputeId);
    payoutForm.set('amount', '125');
    payoutForm.set('direction', 'REFUND_TO_BUYER');
    payoutForm.set('note', 'Customer accepted partial refund');
    const payoutResult = await actions.settleDisputePayoutAction(initialDisputeState, payoutForm);
    expect(payoutResult.status).toBe('success');

    const statusForm = new FormData();
    statusForm.set('disputeId', disputeId);
    statusForm.set('targetStatus', DealDisputeStatus.RESOLVED);
    statusForm.set('note', 'Refund issued and confirmed.');
    const statusResult = await actions.updateDisputeStatusAction(initialDisputeState, statusForm);
    expect(statusResult.status).toBe('success');

    const eventTypes = enqueueNegotiationLifecycleEventMock.mock.calls.map((call) => call[0].type);
    expect(eventTypes).toEqual(
      expect.arrayContaining([
        'DEAL_DISPUTE_RAISED',
        'DEAL_DISPUTE_ESCROW_HOLD',
        'DEAL_DISPUTE_ESCROW_COUNTER',
        'DEAL_DISPUTE_ESCROW_PAYOUT',
      ])
    );

    const disputeSnapshot = createDisputeSnapshot(disputeId)!;
    expect(disputeSnapshot.holdAmount).toBeCloseTo(125);
    expect(disputeSnapshot.counterProposalAmount).toBeCloseTo(125);
    expect(disputeSnapshot.resolutionPayoutAmount).toBeCloseTo(125);
    expect(disputeSnapshot.status).toBe(DealDisputeStatus.RESOLVED);
    expect(disputeSnapshot.assignedTo?.id).toBe('admin-ops');

    const disputeEventTypes = (disputeEventsLog[disputeId] ?? []).map((entry) => entry.type);
    expect(disputeEventTypes).toEqual(
      expect.arrayContaining([
        'CREATED',
        'EVIDENCE_ATTACHED',
        'ASSIGNMENT_UPDATED',
        'ESCROW_HOLD_APPLIED',
        'ESCROW_COUNTER_PROPOSED',
        'ESCROW_PAYOUT_RELEASED',
        'RESOLUTION_RECORDED',
      ])
    );

    expect(escrowTransactions).toHaveLength(2);
    expect(activityLog.some((activity) => activity.type === 'ESCROW_DISPUTE_PAYOUT_EXECUTED')).toBe(true);
    expect(revalidatePathMock).toHaveBeenCalledWith('/app/admin/deals/operations');
  });
});
