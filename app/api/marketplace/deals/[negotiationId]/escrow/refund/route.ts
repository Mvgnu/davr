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
import { getEscrowProvider } from '@/lib/integrations/escrow';
import { publishNegotiationEvent } from '@/lib/events/negotiations';

const REFUNDABLE_STATUSES: NegotiationStatus[] = [
  NegotiationStatus.CONTRACT_DRAFTING,
  NegotiationStatus.CONTRACT_SIGNED,
  NegotiationStatus.ESCROW_FUNDED,
  NegotiationStatus.CANCELLED,
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

    if (!escrowAccount.providerReference) {
      return NextResponse.json(
        {
          error: 'ESCROW_PROVIDER_REFERENCE_MISSING',
          message: 'Escrow-Konto besitzt keine Provider-Referenz',
        },
        { status: 409 }
      );
    }

    if (!REFUNDABLE_STATUSES.includes(access.negotiation.status)) {
      return NextResponse.json(
        {
          error: 'NEGOTIATION_STATUS_INVALID',
          message: 'Escrow kann in diesem Status nicht erstattet werden',
        },
        { status: 409 }
      );
    }

    const available =
      escrowAccount.fundedAmount - escrowAccount.releasedAmount - escrowAccount.refundedAmount;
    if (validation.data.amount > available) {
      return NextResponse.json(
        {
          error: 'ESCROW_REFUND_EXCEEDS_FUNDS',
          message: 'Rückerstattung überschreitet verfügbares Escrow-Guthaben',
        },
        { status: 400 }
      );
    }

    const { snapshot: negotiation, providerResult } = await prisma.$transaction(async (tx) => {
      const provider = getEscrowProvider();

      const providerResult = await provider.refund({
        escrowAccountId: escrowAccount.id,
        providerReference: escrowAccount.providerReference!,
        amount: validation.data.amount,
        type: EscrowTransactionType.REFUND,
        reference: validation.data.reference,
      });

      await tx.escrowTransaction.create({
        data: {
          escrowAccountId: escrowAccount.id,
          type: EscrowTransactionType.REFUND,
          amount: validation.data.amount,
          reference: providerResult.externalTransactionId,
          occurredAt: providerResult.occurredAt,
          metadata: {
            providerBalance: providerResult.balance,
            requestedReference: validation.data.reference ?? null,
          },
        },
      });

      const updatedAccount = await tx.escrowAccount.update({
        where: { id: escrowAccount.id },
        data: {
          refundedAmount: { increment: validation.data.amount },
          status: providerResult.status,
        },
      });

      const residual =
        updatedAccount.fundedAmount - updatedAccount.releasedAmount - updatedAccount.refundedAmount;
      const fullyRefunded = residual <= 0.01;

      if (fullyRefunded) {
        await tx.escrowAccount.update({
          where: { id: escrowAccount.id },
          data: { status: EscrowStatus.CLOSED },
        });

        if (access.negotiation.status !== NegotiationStatus.CANCELLED) {
          await tx.negotiation.update({
            where: { id: access.negotiation.id },
            data: {
              status: NegotiationStatus.CANCELLED,
              statusHistory: {
                create: {
                  status: NegotiationStatus.CANCELLED,
                  note: 'Verhandlung storniert nach vollständiger Rückerstattung',
                  createdById: session.user.id,
                },
              },
            },
          });
        }
      } else {
        await tx.negotiationStatusHistory.create({
          data: {
            negotiationId: access.negotiation.id,
            status: access.negotiation.status,
            note: 'Teilrückerstattung im Escrow verbucht',
            createdById: session.user.id,
          },
        });
      }

      const snapshot = await reloadNegotiationSnapshot(access.negotiation.id, tx);
      if (!snapshot) {
        throw new Error('NEGOTIATION_SNAPSHOT_MISSING');
      }

      return { snapshot, providerResult };
    });

    await publishNegotiationEvent({
      type: 'ESCROW_REFUNDED',
      negotiationId: negotiation.id,
      triggeredBy: session.user.id,
      status: negotiation.status,
      payload: {
        amount: validation.data.amount,
        requestedReference: validation.data.reference ?? null,
        providerReference: escrowAccount.providerReference,
        transactionReference: providerResult.externalTransactionId,
        providerBalance: providerResult.balance,
      },
    });

    return NextResponse.json({
      negotiation,
      message: 'Escrow-Rückerstattung verbucht',
    });
  } catch (error) {
    if (error instanceof NegotiationAccessError) {
      return NextResponse.json(
        { error: error.code, message: error.message },
        { status: error.status }
      );
    }

    console.error('Failed to refund escrow', error);
    return NextResponse.json(
      { error: 'ESCROW_REFUND_FAILED', message: 'Escrow konnte nicht erstattet werden' },
      { status: 500 }
    );
  }
}
