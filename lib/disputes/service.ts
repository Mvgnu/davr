import {
  DealDisputeStatus,
  DealDisputeSeverity,
  DealDisputeCategory,
  DealDisputeEventType,
  DealDisputeEvidenceType,
  EscrowStatus,
  EscrowTransactionType,
  type NegotiationStatus,
  type Prisma,
} from '@prisma/client';
import { addHours, differenceInHours, differenceInMinutes } from 'date-fns';

import { prisma } from '@/lib/db/prisma';
import { publishNegotiationEvent } from '@/lib/events/negotiations';
import { buildDealDisputeGuidance, type DealDisputeGuidance } from '@/lib/disputes/recommendations';

export interface DealDisputeAnalytics {
  openHours: number;
  hoursUntilBreach: number | null;
  hoursSinceBreach: number | null;
  hoursToResolution: number | null;
  reopenedCount: number;
}

export interface DealDisputeQueueItem {
  id: string;
  negotiationId: string;
  negotiationStatus: NegotiationStatus | null;
  status: DealDisputeStatus;
  severity: DealDisputeSeverity;
  category: DealDisputeCategory;
  summary: string;
  raisedAt: Date;
  slaDueAt: Date | null;
  slaBreachedAt: Date | null;
  holdAmount: number;
  counterProposalAmount: number | null;
  resolutionPayoutAmount: number | null;
  escrowStatus: EscrowStatus | null;
  escrowCurrency: string | null;
  assignedTo: { id: string; name: string | null; email: string | null } | null;
  raisedBy: { id: string; name: string | null; role: string | null };
  evidence: Array<{
    id: string;
    type: DealDisputeEvidenceType;
    url: string;
    label: string | null;
    uploadedAt: Date;
  }>;
  latestEvent: {
    type: DealDisputeEventType;
    status: DealDisputeStatus | null;
    message: string | null;
    createdAt: Date;
  } | null;
  analytics: DealDisputeAnalytics;
  guidance: DealDisputeGuidance;
}

export const ACTIVE_DISPUTE_STATUSES = [
  DealDisputeStatus.OPEN,
  DealDisputeStatus.UNDER_REVIEW,
  DealDisputeStatus.AWAITING_PARTIES,
  DealDisputeStatus.ESCALATED,
];

const SEVERITY_SLA_WINDOWS: Record<DealDisputeSeverity, number> = {
  [DealDisputeSeverity.LOW]: 72,
  [DealDisputeSeverity.MEDIUM]: 48,
  [DealDisputeSeverity.HIGH]: 24,
  [DealDisputeSeverity.CRITICAL]: 12,
};

function toHourFraction(minutes: number): number {
  return Number((minutes / 60).toFixed(2));
}

function countReopenings(events: Array<{ status: DealDisputeStatus | null }>): number {
  if (!events || events.length === 0) {
    return 0;
  }

  let reopenings = 0;
  let wasClosed = false;

  for (let index = events.length - 1; index >= 0; index -= 1) {
    const status = events[index]?.status;
    if (!status) {
      continue;
    }

    if (status === DealDisputeStatus.RESOLVED || status === DealDisputeStatus.CLOSED) {
      wasClosed = true;
      continue;
    }

    if (wasClosed && (status === DealDisputeStatus.OPEN || status === DealDisputeStatus.UNDER_REVIEW)) {
      reopenings += 1;
      wasClosed = false;
    }
  }

  return reopenings;
}

function computeDisputeAnalytics(dispute: {
  raisedAt: Date;
  slaDueAt: Date | null;
  slaBreachedAt: Date | null;
  resolvedAt: Date | null;
  events: Array<{ status: DealDisputeStatus | null; createdAt: Date }>;
}): DealDisputeAnalytics {
  const now = new Date();
  const openReference = dispute.resolvedAt ?? now;
  const openMinutes = differenceInMinutes(openReference, dispute.raisedAt);
  const openHours = toHourFraction(Math.max(openMinutes, 0));

  let hoursUntilBreach: number | null = null;
  let hoursSinceBreach: number | null = null;

  if (dispute.slaBreachedAt) {
    const breachMinutes = differenceInMinutes(now, dispute.slaBreachedAt);
    hoursSinceBreach = toHourFraction(Math.max(breachMinutes, 0));
  } else if (dispute.slaDueAt) {
    const diffMinutes = differenceInMinutes(dispute.slaDueAt, now);
    if (diffMinutes >= 0) {
      hoursUntilBreach = toHourFraction(diffMinutes);
    } else {
      hoursSinceBreach = toHourFraction(Math.abs(diffMinutes));
    }
  }

  const hoursToResolution = dispute.resolvedAt
    ? toHourFraction(Math.max(differenceInMinutes(dispute.resolvedAt, dispute.raisedAt), 0))
    : null;

  return {
    openHours,
    hoursUntilBreach,
    hoursSinceBreach,
    hoursToResolution,
    reopenedCount: countReopenings(dispute.events),
  };
}

function determineMissingEvidence(evidence: Array<{ createdAt: Date }>): boolean {
  if (!evidence || evidence.length === 0) {
    return true;
  }

  const latest = evidence.reduce((acc, item) => {
    if (!acc) {
      return item.createdAt;
    }

    return item.createdAt > acc ? item.createdAt : acc;
  }, evidence[0]?.createdAt ?? null);

  if (!latest) {
    return true;
  }

  return differenceInHours(new Date(), latest) >= 24;
}

export class DealDisputeCreationError extends Error {
  constructor(
    public readonly code: 'ACTIVE_DISPUTE_EXISTS' | 'NEGOTIATION_NOT_FOUND',
    message: string,
    public readonly status = 409
  ) {
    super(message);
  }
}

/**
 * meta: module=deal-disputes owner=operations scope=admin version=0.2
 * Provides helpers for retrieving and updating escalation disputes in the
 * admin cockpit while recording lifecycle audit trails.
 */
export async function getDealDisputeQueue(limit = 20): Promise<DealDisputeQueueItem[]> {
  const disputes = await prisma.dealDispute.findMany({
    where: {
      status: { in: ACTIVE_DISPUTE_STATUSES },
    },
    include: {
      negotiation: {
        select: {
          id: true,
          status: true,
          escrowAccount: {
            select: { status: true, currency: true },
          },
        },
      },
      assignedTo: { select: { id: true, name: true, email: true } },
      raisedBy: { select: { id: true, name: true, role: true } },
      evidence: {
        orderBy: { createdAt: 'desc' },
        take: 10,
      },
      events: {
        orderBy: { createdAt: 'desc' },
        take: 20,
      },
    },
    orderBy: [
      { slaDueAt: 'asc' },
      { raisedAt: 'asc' },
    ],
    take: limit,
  });

  return disputes.map((dispute) => {
    const analytics = computeDisputeAnalytics({
      raisedAt: dispute.raisedAt,
      slaDueAt: dispute.slaDueAt ?? null,
      slaBreachedAt: dispute.slaBreachedAt ?? null,
      resolvedAt: dispute.resolvedAt ?? null,
      events: dispute.events,
    });

    const guidance = buildDealDisputeGuidance({
      id: dispute.id,
      negotiationId: dispute.negotiation?.id ?? dispute.negotiationId,
      status: dispute.status,
      severity: dispute.severity,
      category: dispute.category,
      raisedAt: dispute.raisedAt,
      slaDueAt: dispute.slaDueAt ?? null,
      slaBreachedAt: dispute.slaBreachedAt ?? null,
      resolvedAt: dispute.resolvedAt ?? null,
      acknowledgedAt: dispute.acknowledgedAt ?? null,
      escrowStatus: dispute.negotiation?.escrowAccount?.status ?? null,
      holdAmount: dispute.holdAmount ?? 0,
      counterProposalAmount: dispute.counterProposalAmount ?? null,
      resolutionPayoutAmount: dispute.resolutionPayoutAmount ?? null,
      missingEvidence: determineMissingEvidence(dispute.evidence),
      reopenedCount: analytics.reopenedCount,
      analytics,
    });

    return {
      id: dispute.id,
      negotiationId: dispute.negotiation?.id ?? dispute.negotiationId,
      negotiationStatus: dispute.negotiation?.status ?? null,
    status: dispute.status,
    severity: dispute.severity,
    category: dispute.category,
    summary: dispute.summary,
    raisedAt: dispute.raisedAt,
    slaDueAt: dispute.slaDueAt,
    slaBreachedAt: dispute.slaBreachedAt ?? null,
    holdAmount: dispute.holdAmount ?? 0,
    counterProposalAmount: dispute.counterProposalAmount ?? null,
    resolutionPayoutAmount: dispute.resolutionPayoutAmount ?? null,
    escrowStatus: dispute.negotiation?.escrowAccount?.status ?? null,
    escrowCurrency: dispute.negotiation?.escrowAccount?.currency ?? null,
    assignedTo: dispute.assignedTo
      ? {
          id: dispute.assignedTo.id,
          name: dispute.assignedTo.name,
          email: dispute.assignedTo.email,
        }
      : null,
    raisedBy: {
      id: dispute.raisedBy.id,
      name: dispute.raisedBy.name,
      role: dispute.raisedBy.role,
    },
    evidence: dispute.evidence.map((item) => ({
      id: item.id,
      type: item.type,
      url: item.url,
      label: item.label ?? null,
      uploadedAt: item.createdAt,
    })),
      latestEvent: dispute.events[0]
        ? {
            type: dispute.events[0].type,
            status: dispute.events[0].status,
            message: dispute.events[0].message,
            createdAt: dispute.events[0].createdAt,
          }
      : null,
      analytics,
      guidance,
    };
  });
}

export interface DealDisputeAnalyticsSnapshot {
  totalOpen: number;
  totalEscalated: number;
  resolvedLast30d: number;
  averageResolutionHoursLast30d: number | null;
  slaBreachRateLast30d: number | null;
  winLossBreakdownLast30d: {
    buyer: number;
    seller: number;
    neutral: number;
  };
}

export async function getDealDisputeAnalyticsSnapshot(): Promise<DealDisputeAnalyticsSnapshot> {
  const now = new Date();
  const since = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const [totalOpen, totalEscalated, resolved] = await Promise.all([
    prisma.dealDispute.count({
      where: { status: { in: ACTIVE_DISPUTE_STATUSES } },
    }),
    prisma.dealDispute.count({
      where: { status: DealDisputeStatus.ESCALATED },
    }),
    prisma.dealDispute.findMany({
      where: { resolvedAt: { not: null, gte: since } },
      select: { raisedAt: true, resolvedAt: true },
    }),
  ]);

  const resolutionDurations = resolved
    .map((entry) => {
      if (!entry.resolvedAt) {
        return null;
      }

      return Math.max(differenceInMinutes(entry.resolvedAt, entry.raisedAt), 0);
    })
    .filter((value): value is number => value != null);

  const averageResolutionHoursLast30d =
    resolutionDurations.length > 0
      ? toHourFraction(
          resolutionDurations.reduce((acc, value) => acc + value, 0) / resolutionDurations.length
        )
      : null;

  const slaBreachesLast30d = await prisma.dealDispute.count({
    where: { slaBreachedAt: { not: null, gte: since } },
  });

  const payoutEvents = await prisma.dealDisputeEvent.findMany({
    where: {
      type: DealDisputeEventType.ESCROW_PAYOUT_RELEASED,
      createdAt: { gte: since },
    },
    select: { metadata: true },
  });

  const winLoss = payoutEvents.reduce(
    (acc, event) => {
      const metadata = event.metadata && typeof event.metadata === 'object' ? event.metadata : {};
      const direction = (metadata as any).direction;
      switch (direction) {
        case 'REFUND_TO_BUYER':
          acc.buyer += 1;
          break;
        case 'RELEASE_TO_SELLER':
          acc.seller += 1;
          break;
        default:
          acc.neutral += 1;
          break;
      }
      return acc;
    },
    { buyer: 0, seller: 0, neutral: 0 }
  );

  return {
    totalOpen,
    totalEscalated,
    resolvedLast30d: resolved.length,
    averageResolutionHoursLast30d,
    slaBreachRateLast30d:
      resolved.length > 0 ? Number((slaBreachesLast30d / resolved.length).toFixed(2)) : null,
    winLossBreakdownLast30d: winLoss,
  };
}

interface CreateDealDisputeInput {
  negotiationId: string;
  raisedByUserId: string;
  summary: string;
  description?: string | null;
  requestedOutcome?: string | null;
  severity?: DealDisputeSeverity;
  category?: DealDisputeCategory;
  attachments?: Array<{
    type?: DealDisputeEvidenceType;
    url: string;
    label?: string | null;
  }>;
}

export async function createDealDispute({
  negotiationId,
  raisedByUserId,
  summary,
  description,
  requestedOutcome,
  severity = DealDisputeSeverity.MEDIUM,
  category = DealDisputeCategory.ESCROW,
  attachments = [],
}: CreateDealDisputeInput) {
  const trimmedSummary = summary.trim();
  if (!trimmedSummary) {
    throw new Error('Dispute summary is required');
  }

  const negotiation = await prisma.negotiation.findUnique({
    where: { id: negotiationId },
    select: { id: true },
  });

  if (!negotiation) {
    throw new DealDisputeCreationError('NEGOTIATION_NOT_FOUND', 'Negotiation not found', 404);
  }

  const existing = await prisma.dealDispute.findFirst({
    where: {
      negotiationId,
      status: { in: ACTIVE_DISPUTE_STATUSES },
    },
    select: { id: true },
  });

  if (existing) {
    throw new DealDisputeCreationError(
      'ACTIVE_DISPUTE_EXISTS',
      'Es besteht bereits ein aktiver Disput für diese Verhandlung.'
    );
  }

  const slaWindow = SEVERITY_SLA_WINDOWS[severity] ?? 48;
  const slaDueAt = addHours(new Date(), slaWindow);

  const trimmedDescription = description?.trim() || null;
  const trimmedOutcome = requestedOutcome?.trim() || null;

  const dispute = await prisma.$transaction(async (tx) => {
    const created = await tx.dealDispute.create({
      data: {
        negotiationId,
        raisedByUserId,
        summary: trimmedSummary,
        description: trimmedDescription,
        requestedOutcome: trimmedOutcome,
        severity,
        category,
        slaDueAt,
      },
    });

    await tx.dealDisputeEvent.create({
      data: {
        disputeId: created.id,
        actorUserId: raisedByUserId,
        type: DealDisputeEventType.CREATED,
        status: DealDisputeStatus.OPEN,
        message: trimmedDescription,
        metadata: trimmedOutcome
          ? {
              requestedOutcome: trimmedOutcome,
            }
          : undefined,
      },
    });

    const sanitizedAttachments = attachments
      .map((attachment) => ({
        type: attachment.type ?? DealDisputeEvidenceType.LINK,
        url: attachment.url.trim(),
        label: attachment.label?.trim() || null,
      }))
      .filter((attachment) => attachment.url.length > 0)
      .slice(0, 10);

    if (sanitizedAttachments.length > 0) {
      await tx.dealDisputeEvidence.createMany({
        data: sanitizedAttachments.map((attachment) => ({
          disputeId: created.id,
          uploadedByUserId: raisedByUserId,
          type: attachment.type,
          url: attachment.url,
          label: attachment.label ?? undefined,
        })),
      });

      await tx.dealDisputeEvent.create({
        data: {
          disputeId: created.id,
          actorUserId: raisedByUserId,
          type: DealDisputeEventType.EVIDENCE_ATTACHED,
          status: DealDisputeStatus.OPEN,
          message: `${sanitizedAttachments.length} Nachweise hinzugefügt`,
        },
      });
    }

    return created;
  });

  await publishNegotiationEvent({
    type: 'DEAL_DISPUTE_RAISED',
    negotiationId,
    triggeredBy: raisedByUserId,
    status: null,
    payload: {
      disputeId: dispute.id,
      severity,
      category,
      attachments: attachments.length,
      slaDueAt: slaDueAt.toISOString(),
    },
  });

  return dispute;
}

function deriveEventTypeForStatus(status: DealDisputeStatus): DealDisputeEventType {
  switch (status) {
    case DealDisputeStatus.ESCALATED:
      return DealDisputeEventType.ESCALATION_TRIGGERED;
    case DealDisputeStatus.RESOLVED:
      return DealDisputeEventType.RESOLUTION_RECORDED;
    default:
      return DealDisputeEventType.STATUS_CHANGED;
  }
}

interface TransitionDealDisputeStatusInput {
  disputeId: string;
  targetStatus: DealDisputeStatus;
  actorUserId?: string | null;
  note?: string | null;
}

export async function transitionDealDisputeStatus({
  disputeId,
  targetStatus,
  actorUserId,
  note,
}: TransitionDealDisputeStatusInput) {
  const trimmedNote = typeof note === 'string' ? note.trim() : null;
  const dispute = await prisma.dealDispute.findUnique({
    where: { id: disputeId },
    select: {
      status: true,
      acknowledgedAt: true,
      escalatedAt: true,
      resolvedAt: true,
    },
  });

  if (!dispute) {
    throw new Error('Dispute nicht gefunden.');
  }

  if (dispute.status === targetStatus) {
    return prisma.dealDispute.findUnique({ where: { id: disputeId } });
  }

  const now = new Date();
  const update: Prisma.DealDisputeUpdateInput = {
    status: targetStatus,
  };

  if (!dispute.acknowledgedAt && targetStatus !== DealDisputeStatus.OPEN) {
    update.acknowledgedAt = now;
  }

  if (targetStatus === DealDisputeStatus.AWAITING_PARTIES && !dispute.acknowledgedAt) {
    update.acknowledgedAt = now;
  }

  if (targetStatus === DealDisputeStatus.ESCALATED) {
    update.escalatedAt = now;
  }

  if (targetStatus === DealDisputeStatus.RESOLVED) {
    update.resolvedAt = now;
  }

  if (targetStatus === DealDisputeStatus.CLOSED) {
    update.closedAt = now;
    if (!dispute.resolvedAt) {
      update.resolvedAt = now;
    }
  }

  const eventType = deriveEventTypeForStatus(targetStatus);

  const [updated] = await prisma.$transaction([
    prisma.dealDispute.update({
      where: { id: disputeId },
      data: update,
    }),
    prisma.dealDisputeEvent.create({
      data: {
        disputeId,
        actorUserId: actorUserId ?? null,
        type: eventType,
        status: targetStatus,
        message: trimmedNote && trimmedNote.length > 0 ? trimmedNote : null,
      },
    }),
  ]);

  return updated;
}

interface AssignDealDisputeInput {
  disputeId: string;
  assigneeUserId: string | null;
  actorUserId?: string | null;
}

export async function assignDealDispute({
  disputeId,
  assigneeUserId,
  actorUserId,
}: AssignDealDisputeInput) {
  const [updated] = await prisma.$transaction([
    prisma.dealDispute.update({
      where: { id: disputeId },
      data: { assignedToUserId: assigneeUserId },
    }),
    prisma.dealDisputeEvent.create({
      data: {
        disputeId,
        actorUserId: actorUserId ?? null,
        type: DealDisputeEventType.ASSIGNMENT_UPDATED,
        status: null,
        message: assigneeUserId ? `Assigned to ${assigneeUserId}` : 'Assignment cleared',
      },
    }),
  ]);

  return updated;
}

interface ApplyDisputeEscrowHoldInput {
  disputeId: string;
  actorUserId?: string | null;
  amount: number;
  reason?: string | null;
}

interface RecordDisputeCounterProposalInput {
  disputeId: string;
  actorUserId?: string | null;
  amount: number;
  note?: string | null;
}

type DisputePayoutDirection = 'RELEASE_TO_SELLER' | 'REFUND_TO_BUYER';

interface SettleDisputeEscrowPayoutInput {
  disputeId: string;
  actorUserId?: string | null;
  amount: number;
  direction: DisputePayoutDirection;
  note?: string | null;
}

function normaliseAmount(amount: number) {
  const parsed = Number(amount);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new Error('Betrag muss größer als 0 sein.');
  }

  return Number(parsed.toFixed(2));
}

function normaliseOptionalText(value: string | null | undefined) {
  if (typeof value !== 'string') {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

async function getDisputeWithEscrowOrThrow(disputeId: string) {
  const dispute = await prisma.dealDispute.findUnique({
    where: { id: disputeId },
    include: {
      negotiation: {
        select: {
          id: true,
          status: true,
          escrowAccount: {
            select: {
              id: true,
              status: true,
              currency: true,
              releasedAmount: true,
              refundedAmount: true,
            },
          },
        },
      },
    },
  });

  if (!dispute) {
    throw new Error('Dispute nicht gefunden.');
  }

  if (!dispute.negotiation?.escrowAccount) {
    throw new Error('Kein Treuhandkonto für diese Verhandlung vorhanden.');
  }

  return dispute;
}

export async function applyDisputeEscrowHold({
  disputeId,
  actorUserId,
  amount,
  reason,
}: ApplyDisputeEscrowHoldInput) {
  const holdAmount = normaliseAmount(amount);
  const note = normaliseOptionalText(reason ?? null);
  const dispute = await getDisputeWithEscrowOrThrow(disputeId);
  const escrowAccount = dispute.negotiation!.escrowAccount!;
  const currency = escrowAccount.currency ?? 'EUR';
  const occurredAt = new Date();

  const updated = await prisma.$transaction(async (tx) => {
    await tx.escrowTransaction.create({
      data: {
        escrowAccountId: escrowAccount.id,
        type: EscrowTransactionType.DISPUTE_HOLD,
        amount: holdAmount,
        occurredAt,
        metadata: {
          disputeId,
          reason: note ?? undefined,
        },
      },
    });

    await tx.escrowAccount.update({
      where: { id: escrowAccount.id },
      data: { status: EscrowStatus.DISPUTED },
    });

    const disputeUpdate = await tx.dealDispute.update({
      where: { id: disputeId },
      data: {
        holdAmount: { increment: holdAmount },
      },
    });

    await tx.dealDisputeEvent.create({
      data: {
        disputeId,
        actorUserId: actorUserId ?? null,
        type: DealDisputeEventType.ESCROW_HOLD_APPLIED,
        status: disputeUpdate.status,
        message: note,
        metadata: {
          amount: holdAmount,
          currency,
        },
      },
    });

    return disputeUpdate;
  });

  await publishNegotiationEvent({
    type: 'DEAL_DISPUTE_ESCROW_HOLD',
    negotiationId: dispute.negotiation!.id,
    triggeredBy: actorUserId ?? null,
    status: dispute.negotiation?.status ?? null,
    payload: {
      disputeId,
      amount: holdAmount,
      currency,
      reason: note,
    },
  });

  return updated;
}

export async function recordDisputeCounterProposal({
  disputeId,
  actorUserId,
  amount,
  note,
}: RecordDisputeCounterProposalInput) {
  const counterAmount = normaliseAmount(amount);
  const comment = normaliseOptionalText(note ?? null);
  const dispute = await getDisputeWithEscrowOrThrow(disputeId);
  const currency = dispute.negotiation!.escrowAccount!.currency ?? 'EUR';
  const updated = await prisma.$transaction(async (tx) => {
    const disputeUpdate = await tx.dealDispute.update({
      where: { id: disputeId },
      data: {
        counterProposalAmount: counterAmount,
      },
    });

    await tx.dealDisputeEvent.create({
      data: {
        disputeId,
        actorUserId: actorUserId ?? null,
        type: DealDisputeEventType.ESCROW_COUNTER_PROPOSED,
        status: disputeUpdate.status,
        message: comment,
        metadata: {
          amount: counterAmount,
          currency,
        },
      },
    });

    return disputeUpdate;
  });

  await publishNegotiationEvent({
    type: 'DEAL_DISPUTE_ESCROW_COUNTER',
    negotiationId: dispute.negotiation!.id,
    triggeredBy: actorUserId ?? null,
    status: dispute.negotiation?.status ?? null,
    payload: {
      disputeId,
      amount: counterAmount,
      currency,
      note: comment,
    },
  });

  return updated;
}

export async function settleDisputeEscrowPayout({
  disputeId,
  actorUserId,
  amount,
  direction,
  note,
}: SettleDisputeEscrowPayoutInput) {
  const payoutAmount = normaliseAmount(amount);
  const comment = normaliseOptionalText(note ?? null);
  const dispute = await getDisputeWithEscrowOrThrow(disputeId);
  const escrowAccount = dispute.negotiation!.escrowAccount!;
  const currentHold = dispute.holdAmount ?? 0;

  if (payoutAmount - currentHold > 0.01) {
    throw new Error('Betrag überschreitet den gesperrten Betrag.');
  }

  const currency = escrowAccount.currency ?? 'EUR';
  const occurredAt = new Date();
  const remainingHold = Number(Math.max(0, currentHold - payoutAmount).toFixed(2));

  const updated = await prisma.$transaction(async (tx) => {
    await tx.escrowTransaction.create({
      data: {
        escrowAccountId: escrowAccount.id,
        type:
          direction === 'RELEASE_TO_SELLER'
            ? EscrowTransactionType.DISPUTE_PAYOUT
            : EscrowTransactionType.DISPUTE_RELEASE,
        amount: payoutAmount,
        occurredAt,
        metadata: {
          disputeId,
          direction,
          note: comment ?? undefined,
        },
      },
    });

    const accountUpdate: Prisma.EscrowAccountUpdateInput =
      direction === 'RELEASE_TO_SELLER'
        ? { releasedAmount: { increment: payoutAmount } }
        : { refundedAmount: { increment: payoutAmount } };

    if (remainingHold <= 0.01) {
      accountUpdate.status =
        direction === 'RELEASE_TO_SELLER' ? EscrowStatus.RELEASED : EscrowStatus.REFUNDED;
    }

    await tx.escrowAccount.update({
      where: { id: escrowAccount.id },
      data: accountUpdate,
    });

    const disputeUpdate = await tx.dealDispute.update({
      where: { id: disputeId },
      data: {
        holdAmount: remainingHold,
        resolutionPayoutAmount: {
          increment: payoutAmount,
        },
      },
    });

    await tx.dealDisputeEvent.create({
      data: {
        disputeId,
        actorUserId: actorUserId ?? null,
        type: DealDisputeEventType.ESCROW_PAYOUT_RELEASED,
        status: disputeUpdate.status,
        message: comment,
        metadata: {
          amount: payoutAmount,
          currency,
          direction,
          remainingHold,
        },
      },
    });

    return disputeUpdate;
  });

  await publishNegotiationEvent({
    type: 'DEAL_DISPUTE_ESCROW_PAYOUT',
    negotiationId: dispute.negotiation!.id,
    triggeredBy: actorUserId ?? null,
    status: dispute.negotiation?.status ?? null,
    payload: {
      disputeId,
      amount: payoutAmount,
      currency,
      direction,
      remainingHold,
      note: comment,
    },
  });

  return updated;
}
