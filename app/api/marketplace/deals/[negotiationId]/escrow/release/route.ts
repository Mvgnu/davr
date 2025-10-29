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
  escrowMutationSchema,
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

const RELEASE_STATUSES: NegotiationStatus[] = [
  NegotiationStatus.ESCROW_FUNDED,
  NegotiationStatus.CONTRACT_SIGNED,
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
  const validation = validateRequest(escrowMutationSchema, body);

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

    const escrowAccount = access.negotiation.escrowAccount;
    if (!escrowAccount) {
      return NextResponse.json(
        {
          error: 'ESCROW_NOT_INITIALISED',
          message: 'Kein Escrow-Konto für diese Verhandlung vorhanden',
        },
        { status: 409 }
      );
    }

    if (!RELEASE_STATUSES.includes(access.negotiation.status)) {
      return NextResponse.json(
        {
          error: 'NEGOTIATION_STATUS_INVALID',
          message: 'Escrow kann in diesem Status nicht freigegeben werden',
        },
        { status: 409 }
      );
    }

    const available =
      escrowAccount.fundedAmount - escrowAccount.releasedAmount - escrowAccount.refundedAmount;
    if (validation.data.amount > available) {
      return NextResponse.json(
        {
          error: 'ESCROW_RELEASE_EXCEEDS_FUNDS',
          message: 'Auszahlungsbetrag überschreitet verfügbares Escrow-Guthaben',
        },
        { status: 400 }
      );
    }

    const negotiation = await prisma.$transaction(async (tx) => {
      await mockEscrowProvider.release({
        escrowAccountId: escrowAccount.id,
        amount: validation.data.amount,
        type: EscrowTransactionType.RELEASE,
        reference: validation.data.reference,
      });

      await tx.escrowTransaction.create({
        data: {
          escrowAccountId: escrowAccount.id,
          type: EscrowTransactionType.RELEASE,
          amount: validation.data.amount,
          reference: validation.data.reference,
        },
      });

      const updatedAccount = await tx.escrowAccount.update({
        where: { id: escrowAccount.id },
        data: {
          releasedAmount: { increment: validation.data.amount },
          status: EscrowStatus.RELEASED,
        },
      });

      const residual =
        updatedAccount.fundedAmount - updatedAccount.releasedAmount - updatedAccount.refundedAmount;
      const fullyReleased = residual <= 0.01;

      if (fullyReleased) {
        await tx.escrowAccount.update({
          where: { id: escrowAccount.id },
          data: { status: EscrowStatus.CLOSED },
        });

        await tx.negotiation.update({
          where: { id: access.negotiation.id },
          data: {
            status: NegotiationStatus.COMPLETED,
            statusHistory: {
              create: {
                status: NegotiationStatus.COMPLETED,
                note: 'Verhandlung abgeschlossen – Escrow freigegeben',
                createdById: session.user.id,
              },
            },
          },
        });
      } else {
        await tx.negotiationStatusHistory.create({
          data: {
            negotiationId: access.negotiation.id,
            status: access.negotiation.status,
            note: 'Teilfreigabe aus Escrow gebucht',
            createdById: session.user.id,
          },
        });
      }

      const snapshot = await reloadNegotiationSnapshot(access.negotiation.id, tx);
      if (!snapshot) {
        throw new Error('NEGOTIATION_SNAPSHOT_MISSING');
      }

      return snapshot;
    });

    await publishNegotiationEvent({
      type: 'ESCROW_RELEASED',
      negotiationId: negotiation.id,
      triggeredBy: session.user.id,
      status: negotiation.status,
      payload: {
        amount: validation.data.amount,
        reference: validation.data.reference,
      },
    });

    return NextResponse.json({
      negotiation,
      message: 'Escrow-Auszahlung verbucht',
    });
  } catch (error) {
    if (error instanceof NegotiationAccessError) {
      return NextResponse.json(
        { error: error.code, message: error.message },
        { status: error.status }
      );
    }

    console.error('Failed to release escrow', error);
    return NextResponse.json(
      { error: 'ESCROW_RELEASE_FAILED', message: 'Escrow konnte nicht freigegeben werden' },
      { status: 500 }
    );
  }
}
