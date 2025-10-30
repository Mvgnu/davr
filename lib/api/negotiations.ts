import { EscrowStatus, NegotiationStatus, Prisma } from '@prisma/client';

import { prisma } from '@/lib/db/prisma';
import { publishNegotiationEvent } from '@/lib/events/negotiations';

export const TERMINAL_NEGOTIATION_STATUSES: NegotiationStatus[] = [
  NegotiationStatus.CANCELLED,
  NegotiationStatus.COMPLETED,
  NegotiationStatus.EXPIRED,
];

export const NEGOTIATION_DETAIL_INCLUDE = {
  offers: {
    orderBy: { createdAt: 'desc' as const },
    take: 25,
  },
  statusHistory: {
    orderBy: { createdAt: 'desc' as const },
    take: 25,
  },
  activities: {
    orderBy: { occurredAt: 'desc' as const },
    take: 50,
  },
  disputes: {
    orderBy: { raisedAt: 'desc' as const },
    take: 5,
    include: {
      raisedBy: { select: { id: true, name: true, role: true } },
      assignedTo: { select: { id: true, name: true, email: true } },
      evidence: {
        orderBy: { createdAt: 'desc' as const },
        take: 5,
      },
      events: {
        orderBy: { createdAt: 'desc' as const },
        take: 5,
      },
    },
  },
  escrowAccount: true,
  contract: {
    include: {
      documents: {
        orderBy: { createdAt: 'desc' as const },
        take: 5,
      },
    },
  },
  contractRevisions: {
    orderBy: { createdAt: 'desc' as const },
    take: 12,
    include: {
      createdBy: { select: { id: true, name: true, email: true } },
      comments: {
        orderBy: { createdAt: 'asc' as const },
        include: {
          author: { select: { id: true, name: true, email: true } },
          resolvedBy: { select: { id: true, name: true, email: true } },
        },
      },
    },
  },
  listing: {
    select: { id: true, title: true, seller_id: true, isPremiumWorkflow: true },
  },
  fulfilmentOrders: {
    orderBy: { pickupWindowStart: 'asc' as const },
    include: {
      milestones: {
        orderBy: { occurredAt: 'asc' as const },
        include: { recordedBy: { select: { id: true, name: true } } },
      },
      reminders: { orderBy: { scheduledFor: 'asc' as const } },
    },
  },
} satisfies Prisma.NegotiationInclude;

export class NegotiationAccessError extends Error {
  constructor(
    public readonly code:
      | 'NEGOTIATION_NOT_FOUND'
      | 'NEGOTIATION_FORBIDDEN'
      | 'NEGOTIATION_EXPIRED',
    public readonly status: number,
    message: string
  ) {
    super(message);
  }
}

export function isNegotiationTerminal(status: NegotiationStatus) {
  return TERMINAL_NEGOTIATION_STATUSES.includes(status);
}

export interface NegotiationAccessContext {
  negotiation: Prisma.NegotiationGetPayload<{ include: typeof NEGOTIATION_DETAIL_INCLUDE }>;
  isBuyer: boolean;
  isSeller: boolean;
  isAdmin: boolean;
}

interface AccessOptions {
  include?: Prisma.NegotiationInclude;
}

export async function getNegotiationWithAccess(
  negotiationId: string,
  userId: string,
  { isAdmin }: { isAdmin: boolean },
  options: AccessOptions = {}
): Promise<NegotiationAccessContext> {
  const include = options.include ?? NEGOTIATION_DETAIL_INCLUDE;

  const negotiation = await prisma.negotiation.findUnique({
    where: { id: negotiationId },
    include,
  });

  if (!negotiation) {
    throw new NegotiationAccessError(
      'NEGOTIATION_NOT_FOUND',
      404,
      'Verhandlung wurde nicht gefunden'
    );
  }

  const isBuyer = negotiation.buyerId === userId;
  const isSeller = negotiation.sellerId === userId;

  if (!isBuyer && !isSeller && !isAdmin) {
    throw new NegotiationAccessError(
      'NEGOTIATION_FORBIDDEN',
      403,
      'Kein Zugriff auf diese Verhandlung'
    );
  }

  if (
    negotiation.expiresAt &&
    negotiation.expiresAt.getTime() < Date.now() &&
    !isNegotiationTerminal(negotiation.status)
  ) {
    await prisma.$transaction(async (tx) => {
      await tx.negotiation.update({
        where: { id: negotiation.id },
        data: { status: NegotiationStatus.EXPIRED },
      });

      await tx.negotiationStatusHistory.create({
        data: {
          negotiationId: negotiation.id,
          status: NegotiationStatus.EXPIRED,
          note: 'Negotiation automatically expired after SLA breach',
        },
      });

      if (negotiation.escrowAccount && negotiation.escrowAccount.status !== EscrowStatus.CLOSED) {
        await tx.escrowAccount.update({
          where: { id: negotiation.escrowAccount.id },
          data: { status: EscrowStatus.CLOSED },
        });
      }
    });

    await publishNegotiationEvent({
      type: 'NEGOTIATION_SLA_BREACHED',
      negotiationId: negotiation.id,
      triggeredBy: null,
      status: NegotiationStatus.EXPIRED,
      payload: {
        expiresAt: negotiation.expiresAt?.toISOString() ?? null,
      },
    });

    throw new NegotiationAccessError(
      'NEGOTIATION_EXPIRED',
      409,
      'Verhandlung ist abgelaufen'
    );
  }

  return { negotiation, isBuyer, isSeller, isAdmin };
}

export async function reloadNegotiationSnapshot(
  negotiationId: string,
  client: Prisma.TransactionClient | typeof prisma = prisma,
  include: Prisma.NegotiationInclude = NEGOTIATION_DETAIL_INCLUDE
) {
  return client.negotiation.findUnique({
    where: { id: negotiationId },
    include,
  });
}

export function ensureCounterparty(
  userId: string,
  lastOfferSenderId: string | null
): asserts lastOfferSenderId is string {
  if (lastOfferSenderId === userId) {
    throw new NegotiationAccessError(
      'NEGOTIATION_FORBIDDEN',
      403,
      'Eigenes Angebot kann nicht akzeptiert werden'
    );
  }
}

export function resolveAdminFlag(user: { isAdmin?: boolean; role?: string } | null | undefined) {
  if (!user) {
    return false;
  }

  return Boolean(user.isAdmin) || user.role === 'ADMIN';
}
