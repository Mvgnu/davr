import { NextResponse, type NextRequest } from 'next/server';
import { getServerSession } from 'next-auth/next';
import {
  EscrowStatus,
  EscrowTransactionType,
  NegotiationStatus,
} from '@prisma/client';

import { authOptions } from '@/lib/auth/options';
import { prisma } from '@/lib/db/prisma';
import {
  cancelNegotiationSchema,
  formatValidationErrors,
  validateRequest,
} from '@/lib/api/validation';
import {
  getNegotiationWithAccess,
  NegotiationAccessError,
  reloadNegotiationSnapshot,
  resolveAdminFlag,
} from '@/lib/api/negotiations';
import { mockEscrowProvider } from '@/lib/integrations/escrow';
import { publishNegotiationEvent } from '@/lib/events/negotiations';

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
  const validation = validateRequest(cancelNegotiationSchema, body);

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

    if (access.negotiation.status === NegotiationStatus.CANCELLED) {
      return NextResponse.json(
        {
          error: 'NEGOTIATION_ALREADY_CANCELLED',
          message: 'Verhandlung wurde bereits storniert',
        },
        { status: 409 }
      );
    }

    if (access.negotiation.status === NegotiationStatus.COMPLETED) {
      return NextResponse.json(
        {
          error: 'NEGOTIATION_COMPLETED',
          message: 'Abgeschlossene Verhandlungen können nicht storniert werden',
        },
        { status: 409 }
      );
    }

    const cancellationReason = validation.data.reason?.trim();
    const note = cancellationReason
      ? `Verhandlung storniert: ${cancellationReason}`
      : 'Verhandlung storniert';

    const negotiation = await prisma.$transaction(async (tx) => {
      if (access.negotiation.escrowAccount) {
        const { escrowAccount } = access.negotiation;
        const funded = escrowAccount.fundedAmount;
        const released = escrowAccount.releasedAmount;
        const refunded = escrowAccount.refundedAmount;
        const outstanding = funded - released - refunded;

        if (outstanding > 0) {
          await mockEscrowProvider.refund({
            escrowAccountId: escrowAccount.id,
            amount: outstanding,
            type: EscrowTransactionType.REFUND,
          });

          await tx.escrowTransaction.create({
            data: {
              escrowAccountId: escrowAccount.id,
              type: EscrowTransactionType.REFUND,
              amount: outstanding,
              reference: validation.data.reason ?? 'negotiation_cancelled',
            },
          });

          await tx.escrowAccount.update({
            where: { id: escrowAccount.id },
            data: {
              status: EscrowStatus.REFUNDED,
              refundedAmount: { increment: outstanding },
            },
          });
        } else {
          await tx.escrowAccount.update({
            where: { id: escrowAccount.id },
            data: { status: EscrowStatus.CLOSED },
          });
        }
      }

      await tx.negotiation.update({
        where: { id: access.negotiation.id },
        data: {
          status: NegotiationStatus.CANCELLED,
          notes: cancellationReason
            ? [access.negotiation.notes, `Cancellation: ${cancellationReason}`]
                .filter(Boolean)
                .join('\n')
            : access.negotiation.notes,
          statusHistory: {
            create: {
              status: NegotiationStatus.CANCELLED,
              note,
              createdById: session.user.id,
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
      type: 'NEGOTIATION_CANCELLED',
      negotiationId: negotiation.id,
      triggeredBy: session.user.id,
      status: negotiation.status,
      payload: {
        reason: cancellationReason,
      },
    });

    return NextResponse.json({
      negotiation,
      message: 'Verhandlung wurde storniert',
    });
  } catch (error) {
    if (error instanceof NegotiationAccessError) {
      return NextResponse.json(
        { error: error.code, message: error.message },
        { status: error.status }
      );
    }

    console.error('Failed to cancel negotiation', error);
    return NextResponse.json(
      { error: 'NEGOTIATION_CANCEL_FAILED', message: 'Verhandlung konnte nicht storniert werden' },
      { status: 500 }
    );
  }
}
