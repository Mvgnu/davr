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

const FUNDABLE_STATUSES: NegotiationStatus[] = [
  NegotiationStatus.CONTRACT_DRAFTING,
  NegotiationStatus.CONTRACT_SIGNED,
  NegotiationStatus.AGREED,
  NegotiationStatus.ESCROW_FUNDED,
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

    if (!access.negotiation.escrowAccount) {
      return NextResponse.json(
        {
          error: 'ESCROW_NOT_INITIALISED',
          message: 'Kein Escrow-Konto für diese Verhandlung vorhanden',
        },
        { status: 409 }
      );
    }

    if (!access.negotiation.escrowAccount.providerReference) {
      return NextResponse.json(
        {
          error: 'ESCROW_PROVIDER_REFERENCE_MISSING',
          message: 'Escrow-Konto besitzt keine Provider-Referenz',
        },
        { status: 409 }
      );
    }

    if (!FUNDABLE_STATUSES.includes(access.negotiation.status)) {
      return NextResponse.json(
        {
          error: 'NEGOTIATION_STATUS_INVALID',
          message: 'Escrow kann in diesem Verhandlungsstatus nicht befüllt werden',
        },
        { status: 409 }
      );
    }

    const { snapshot: negotiation, providerResult } = await prisma.$transaction(async (tx) => {
      const provider = getEscrowProvider();
      const providerResult = await provider.fund({
        escrowAccountId: access.negotiation.escrowAccount!.id,
        providerReference: access.negotiation.escrowAccount!.providerReference!,
        amount: validation.data.amount,
        type: EscrowTransactionType.FUND,
        reference: validation.data.reference,
      });

      await tx.escrowTransaction.create({
        data: {
          escrowAccountId: access.negotiation.escrowAccount!.id,
          type: EscrowTransactionType.FUND,
          amount: validation.data.amount,
          reference: providerResult.externalTransactionId,
          occurredAt: providerResult.occurredAt,
          metadata: {
            providerBalance: providerResult.balance,
            requestedReference: validation.data.reference ?? null,
          },
        },
      });

      const escrowAccount = await tx.escrowAccount.update({
        where: { id: access.negotiation.escrowAccount!.id },
        data: {
          fundedAmount: { increment: validation.data.amount },
          status: providerResult.status,
        },
      });

      const expected = escrowAccount.expectedAmount ?? 0;
      const fullyFunded = expected > 0 && escrowAccount.fundedAmount >= expected - 0.01;

      if (fullyFunded) {
        await tx.escrowAccount.update({
          where: { id: escrowAccount.id },
          data: { status: EscrowStatus.FUNDED },
        });

        if (access.negotiation.status !== NegotiationStatus.ESCROW_FUNDED) {
          await tx.negotiation.update({
            where: { id: access.negotiation.id },
            data: {
              status: NegotiationStatus.ESCROW_FUNDED,
              statusHistory: {
                create: {
                  status: NegotiationStatus.ESCROW_FUNDED,
                  note: 'Escrow vollständig befüllt',
                  createdById: session.user.id,
                },
              },
            },
          });
        } else {
          await tx.negotiationStatusHistory.create({
            data: {
              negotiationId: access.negotiation.id,
              status: NegotiationStatus.ESCROW_FUNDED,
              note: 'Zusätzliche Einzahlung bestätigt',
              createdById: session.user.id,
            },
          });
        }
      } else {
        await tx.negotiationStatusHistory.create({
          data: {
            negotiationId: access.negotiation.id,
            status: access.negotiation.status,
            note: 'Escrow-Teilzahlung eingegangen',
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
      type: 'ESCROW_FUNDED',
      negotiationId: negotiation.id,
      triggeredBy: session.user.id,
      status: negotiation.status,
      payload: {
        amount: validation.data.amount,
        requestedReference: validation.data.reference ?? null,
        providerReference: access.negotiation.escrowAccount.providerReference,
        transactionReference: providerResult.externalTransactionId,
        providerBalance: providerResult.balance,
      },
    });

    return NextResponse.json({
      negotiation,
      message: 'Escrow-Einzahlung verbucht',
    });
  } catch (error) {
    if (error instanceof NegotiationAccessError) {
      return NextResponse.json(
        { error: error.code, message: error.message },
        { status: error.status }
      );
    }

    console.error('Failed to fund escrow', error);
    return NextResponse.json(
      { error: 'ESCROW_FUND_FAILED', message: 'Escrow konnte nicht befüllt werden' },
      { status: 500 }
    );
  }
}
