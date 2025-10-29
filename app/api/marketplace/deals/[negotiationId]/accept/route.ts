import { NextResponse, type NextRequest } from 'next/server';
import { getServerSession } from 'next-auth/next';
import {
  ContractStatus,
  EscrowStatus,
  NegotiationStatus,
  OfferType,
} from '@prisma/client';

import { authOptions } from '@/lib/auth/options';
import { prisma } from '@/lib/db/prisma';
import {
  acceptNegotiationSchema,
  formatValidationErrors,
  validateRequest,
} from '@/lib/api/validation';
import {
  ensureCounterparty,
  getNegotiationWithAccess,
  NegotiationAccessError,
  reloadNegotiationSnapshot,
  resolveAdminFlag,
} from '@/lib/api/negotiations';
import { publishNegotiationEvent } from '@/lib/events/negotiations';

const ACCEPTABLE_STATUSES: NegotiationStatus[] = [
  NegotiationStatus.INITIATED,
  NegotiationStatus.COUNTERING,
];

export async function POST(
  request: NextRequest,
  { params }: { params: { negotiationId: string } }
) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json(
      { error: 'UNAUTHENTICATED', message: 'Anmeldung erforderlich' },
      { status: 401 }
    );
  }

  const body = await request.json().catch(() => ({}));
  const validation = validateRequest(acceptNegotiationSchema, body);

  if (!validation.success) {
    return NextResponse.json(
      {
        error: 'VALIDATION_ERROR',
        message: 'Ungültige Anfrageparameter',
        details: formatValidationErrors(validation.error),
      },
      { status: 400 }
    );
  }

  try {
    const access = await getNegotiationWithAccess(
      params.negotiationId,
      session.user.id,
      { isAdmin: resolveAdminFlag(session.user) }
    );

    if (!ACCEPTABLE_STATUSES.includes(access.negotiation.status)) {
      return NextResponse.json(
        {
          error: 'NEGOTIATION_STATUS_INVALID',
          message: 'Verhandlung kann in diesem Status nicht akzeptiert werden',
        },
        { status: 409 }
      );
    }

    const lastOffer = access.negotiation.offers[0] ?? null;
    if (!lastOffer) {
      return NextResponse.json(
        {
          error: 'NEGOTIATION_NO_OFFER',
          message: 'Keine Angebote verfügbar, die akzeptiert werden können',
        },
        { status: 409 }
      );
    }

    ensureCounterparty(session.user.id, lastOffer.senderId);

    const finalPrice = validation.data.agreedPrice ?? lastOffer.price ?? undefined;
    if (typeof finalPrice !== 'number') {
      return NextResponse.json(
        {
          error: 'NEGOTIATION_PRICE_REQUIRED',
          message: 'Preis muss für die Annahme vorhanden sein',
        },
        { status: 400 }
      );
    }

    const finalQuantity = validation.data.agreedQuantity ?? lastOffer.quantity ?? null;
    const expectedAmount =
      typeof finalQuantity === 'number' ? finalPrice * finalQuantity : finalPrice;

    const negotiation = await prisma.$transaction(async (tx) => {
      await tx.offerCounter.create({
        data: {
          negotiationId: access.negotiation.id,
          senderId: session.user.id,
          price: finalPrice,
          quantity: finalQuantity,
          message: validation.data.note ?? 'Verhandlung angenommen',
          type: OfferType.FINAL,
        },
      });

      await tx.negotiation.update({
        where: { id: access.negotiation.id },
        data: {
          status: NegotiationStatus.CONTRACT_DRAFTING,
          agreedPrice: finalPrice,
          agreedQuantity: finalQuantity,
          statusHistory: {
            create: [
              {
                status: NegotiationStatus.AGREED,
                note: `Konditionen akzeptiert von ${access.isBuyer ? 'Käufer' : 'Verkäufer'}`,
                createdById: session.user.id,
              },
              {
                status: NegotiationStatus.CONTRACT_DRAFTING,
                note: 'Vertragserstellung gestartet',
                createdById: session.user.id,
              },
            ],
          },
          contract: {
            upsert: {
              create: {
                status: ContractStatus.DRAFT,
                draftTerms: validation.data.note ?? null,
              },
              update: {
                status: ContractStatus.DRAFT,
                draftTerms: validation.data.note ?? undefined,
              },
            },
          },
          escrowAccount: access.negotiation.escrowAccount
            ? {
                update: {
                  status: EscrowStatus.AWAITING_FUNDS,
                  expectedAmount,
                },
              }
            : {
                create: {
                  status: EscrowStatus.AWAITING_FUNDS,
                  expectedAmount,
                  currency: access.negotiation.currency,
                },
              },
        },
      });

      const snapshot = await reloadNegotiationSnapshot(access.negotiation.id, tx);
      if (!snapshot) {
        throw new Error('NEGOTIATION_SNAPSHOT_MISSING');
      }

      return snapshot;
    });

    await publishNegotiationEvent({
      type: 'NEGOTIATION_ACCEPTED',
      negotiationId: negotiation.id,
      triggeredBy: session.user.id,
      status: negotiation.status,
      payload: {
        price: finalPrice,
        quantity: finalQuantity,
      },
    });

    return NextResponse.json({
      negotiation,
      message: 'Verhandlung erfolgreich akzeptiert',
    });
  } catch (error) {
    if (error instanceof NegotiationAccessError) {
      return NextResponse.json(
        { error: error.code, message: error.message },
        { status: error.status }
      );
    }

    console.error('Failed to accept negotiation', error);
    return NextResponse.json(
      { error: 'NEGOTIATION_ACCEPT_FAILED', message: 'Verhandlung konnte nicht akzeptiert werden' },
      { status: 500 }
    );
  }
}
