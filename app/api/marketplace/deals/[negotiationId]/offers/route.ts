import { NextResponse, type NextRequest } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { NegotiationStatus, OfferType } from '@prisma/client';

import { authOptions } from '@/lib/auth/options';
import { prisma } from '@/lib/db/prisma';
import {
  offerCounterSchema,
  validateRequest,
  formatValidationErrors,
} from '@/lib/api/validation';
import {
  getNegotiationWithAccess,
  NegotiationAccessError,
  isNegotiationTerminal,
  reloadNegotiationSnapshot,
  resolveAdminFlag,
} from '@/lib/api/negotiations';
import { publishNegotiationEvent } from '@/lib/events/negotiations';

const ALLOWED_COUNTER_STATUSES: NegotiationStatus[] = [
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

  const payload = await request.json().catch(() => ({}));
  const validation = validateRequest(offerCounterSchema, payload);

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

    if (isNegotiationTerminal(access.negotiation.status)) {
      return NextResponse.json(
        {
          error: 'NEGOTIATION_CLOSED',
          message: 'Abgeschlossene oder stornierte Verhandlungen können nicht geändert werden',
        },
        { status: 409 }
      );
    }

    if (!ALLOWED_COUNTER_STATUSES.includes(access.negotiation.status)) {
      return NextResponse.json(
        {
          error: 'NEGOTIATION_STATUS_INVALID',
          message: 'In diesem Status sind keine Gegenangebote möglich',
        },
        { status: 409 }
      );
    }

    const offerType = validation.data.type ?? OfferType.COUNTER;
    const nextStatus =
      access.negotiation.status === NegotiationStatus.INITIATED
        ? NegotiationStatus.COUNTERING
        : access.negotiation.status;

    const negotiation = await prisma.$transaction(async (tx) => {
      await tx.offerCounter.create({
        data: {
          negotiationId: access.negotiation.id,
          senderId: session.user.id,
          price: validation.data.price ?? null,
          quantity: validation.data.quantity ?? null,
          message: validation.data.message,
          type: offerType,
        },
      });

      if (nextStatus !== access.negotiation.status) {
        await tx.negotiation.update({
          where: { id: access.negotiation.id },
          data: { status: nextStatus },
        });

        await tx.negotiationStatusHistory.create({
          data: {
            negotiationId: access.negotiation.id,
            status: nextStatus,
            note: `Status gewechselt zu ${nextStatus} nach neuem Angebot`,
            createdById: session.user.id,
          },
        });
      }

      await tx.negotiationStatusHistory.create({
        data: {
          negotiationId: access.negotiation.id,
          status: nextStatus,
          note: `Angebot (${offerType}) eingereicht durch ${access.isBuyer ? 'Käufer' : 'Verkäufer'}`,
          createdById: session.user.id,
        },
      });

      const snapshot = await reloadNegotiationSnapshot(access.negotiation.id, tx);
      if (!snapshot) {
        throw new Error('NEGOTIATION_SNAPSHOT_MISSING');
      }

      return snapshot;
    });

    await publishNegotiationEvent({
      type: 'NEGOTIATION_COUNTER_SUBMITTED',
      negotiationId: negotiation.id,
      triggeredBy: session.user.id,
      status: negotiation.status,
      payload: {
        price: validation.data.price,
        quantity: validation.data.quantity,
        offerType,
      },
    });

    return NextResponse.json({
      negotiation,
      message: 'Gegenangebot erfolgreich gespeichert',
    });
  } catch (error) {
    if (error instanceof NegotiationAccessError) {
      return NextResponse.json(
        { error: error.code, message: error.message },
        { status: error.status }
      );
    }

    console.error('Failed to submit counter offer', error);
    return NextResponse.json(
      {
        error: 'NEGOTIATION_COUNTER_FAILED',
        message: 'Angebot konnte nicht gespeichert werden',
      },
      { status: 500 }
    );
  }
}
