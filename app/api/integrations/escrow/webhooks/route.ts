import { createHmac, timingSafeEqual } from 'crypto';
import { NextResponse, type NextRequest } from 'next/server';
import { EscrowStatus, EscrowTransactionType, NegotiationStatus } from '@prisma/client';
import { z } from 'zod';

import { prisma } from '@/lib/db/prisma';
import { publishNegotiationEvent } from '@/lib/events/negotiations';
import type { EscrowWebhookEventType } from '@/lib/integrations/escrow';

const WEBHOOK_EVENTS = [
  'funding_confirmed',
  'release_settled',
  'refund_processed',
  'dispute_opened',
  'dispute_resolved',
  'statement_ready',
] as const satisfies readonly EscrowWebhookEventType[];

const webhookEnvelopeSchema = z.object({
  event: z.enum(WEBHOOK_EVENTS),
  providerReference: z.string().min(1),
  externalTransactionId: z.string().min(1),
  amount: z.number().optional(),
  currency: z.string().optional(),
  occurredAt: z.string().datetime().optional(),
  metadata: z.record(z.unknown()).optional(),
});

function getWebhookSecret() {
  const secret = process.env.ESCROW_WEBHOOK_SECRET;
  if (!secret) {
    throw new Error('ESCROW_WEBHOOK_SECRET is not configured');
  }
  return secret;
}

function verifySignature(rawBody: string, providedSignature: string | null) {
  const secret = getWebhookSecret();
  if (!providedSignature) {
    return false;
  }

  const hmac = createHmac('sha256', secret);
  hmac.update(rawBody, 'utf8');
  const expected = hmac.digest('hex');
  const sanitised = providedSignature.trim().toLowerCase();

  try {
    const expectedBuffer = Buffer.from(expected, 'hex');
    const providedBuffer = Buffer.from(sanitised, 'hex');

    if (expectedBuffer.length !== providedBuffer.length) {
      return false;
    }

    return timingSafeEqual(expectedBuffer, providedBuffer);
  } catch (error) {
    return false;
  }
}

function resolveOccurredAt(value: string | undefined) {
  if (!value) {
    return new Date();
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return new Date();
  }

  return date;
}

/**
 * meta: feature=escrow-webhooks scope=integrations version=0.2 owner=platform
 * Accepts provider callbacks and mirrors ledger updates into Prisma while
 * emitting negotiation lifecycle events.
 */
export async function POST(request: NextRequest) {
  let rawBody: string;
  try {
    rawBody = await request.text();
  } catch (readError) {
    return NextResponse.json(
      {
        error: 'BODY_READ_FAILED',
        message: 'Webhook payload konnte nicht gelesen werden',
      },
      { status: 500 }
    );
  }

  let parsedBody: unknown;
  try {
    parsedBody = JSON.parse(rawBody);
  } catch (parseError) {
    return NextResponse.json(
      {
        error: 'INVALID_JSON',
        message: 'Webhook payload ist kein valides JSON',
      },
      { status: 400 }
    );
  }

  let signatureIsValid = false;
  try {
    signatureIsValid = verifySignature(rawBody, request.headers.get('x-escrow-signature'));
  } catch (configError) {
    return NextResponse.json(
      {
        error: 'WEBHOOK_SECRET_NOT_CONFIGURED',
        message: 'ESCROW_WEBHOOK_SECRET ist nicht gesetzt',
      },
      { status: 500 }
    );
  }

  if (!signatureIsValid) {
    return NextResponse.json(
      {
        error: 'INVALID_SIGNATURE',
        message: 'Webhook-Signatur ungültig oder fehlt',
      },
      { status: 401 }
    );
  }

  const parsed = webhookEnvelopeSchema.safeParse(parsedBody);

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: 'INVALID_PAYLOAD',
        message: 'Webhook payload konnte nicht validiert werden',
        details: parsed.error.flatten(),
      },
      { status: 400 }
    );
  }

  const envelope = parsed.data;
  const occurredAt = resolveOccurredAt(envelope.occurredAt);

  const account = await prisma.escrowAccount.findFirst({
    where: { providerReference: envelope.providerReference },
    include: { negotiation: { select: { id: true, status: true } } },
  });

  if (!account || !account.negotiation) {
    return NextResponse.json(
      {
        error: 'ESCROW_ACCOUNT_NOT_FOUND',
        message: 'Kein passendes Escrow-Konto für die Provider-Referenz gefunden',
      },
      { status: 404 }
    );
  }

  const existingTransaction = await prisma.escrowTransaction.findFirst({
    where: {
      escrowAccountId: account.id,
      reference: envelope.externalTransactionId,
    },
  });

  if (existingTransaction) {
    return NextResponse.json({ status: 'idempotent-ok' }, { status: 200 });
  }

  const amount = envelope.amount ?? 0;

  const result = await prisma.$transaction(async (tx) => {
    const baseTransactionData = {
      escrowAccountId: account.id,
      reference: envelope.externalTransactionId,
      occurredAt,
      metadata: {
        providerEvent: envelope.event,
        providerMetadata: envelope.metadata ?? null,
        currency: envelope.currency ?? account.currency,
      },
    } as const;

    let updatedAccount = account;
    let negotiationStatus: NegotiationStatus | undefined;
    let eventType: Parameters<typeof publishNegotiationEvent>[0]['type'] | null = null;
    let payload: Record<string, unknown> = {
      providerReference: envelope.providerReference,
      transactionReference: envelope.externalTransactionId,
      amount,
      currency: envelope.currency ?? account.currency,
      source: 'ESCROW_WEBHOOK',
    };

    switch (envelope.event) {
      case 'funding_confirmed': {
        await tx.escrowTransaction.create({
          data: {
            ...baseTransactionData,
            type: EscrowTransactionType.FUND,
            amount,
          },
        });

        updatedAccount = await tx.escrowAccount.update({
          where: { id: account.id },
          data: {
            fundedAmount: { increment: amount },
            status:
              account.expectedAmount && account.expectedAmount > 0 && account.fundedAmount + amount >= account.expectedAmount - 0.01
                ? EscrowStatus.FUNDED
                : EscrowStatus.AWAITING_FUNDS,
          },
        });

        if (
          updatedAccount.status === EscrowStatus.FUNDED &&
          account.negotiation.status !== NegotiationStatus.ESCROW_FUNDED
        ) {
          await tx.negotiation.update({
            where: { id: account.negotiation.id },
            data: {
              status: NegotiationStatus.ESCROW_FUNDED,
              statusHistory: {
                create: {
                  status: NegotiationStatus.ESCROW_FUNDED,
                  note: 'Escrow-Finanzierung durch Provider bestätigt',
                },
              },
            },
          });
          negotiationStatus = NegotiationStatus.ESCROW_FUNDED;
        }

        eventType = 'ESCROW_FUNDED';
        payload = { ...payload, providerBalance: updatedAccount.fundedAmount };
        break;
      }
      case 'release_settled': {
        await tx.escrowTransaction.create({
          data: {
            ...baseTransactionData,
            type: EscrowTransactionType.RELEASE,
            amount,
          },
        });

        updatedAccount = await tx.escrowAccount.update({
          where: { id: account.id },
          data: {
            releasedAmount: { increment: amount },
            status: EscrowStatus.RELEASED,
          },
        });

        const residual =
          updatedAccount.fundedAmount - updatedAccount.releasedAmount - updatedAccount.refundedAmount;

        if (residual <= 0.01) {
          updatedAccount = await tx.escrowAccount.update({
            where: { id: account.id },
            data: { status: EscrowStatus.CLOSED },
          });

          await tx.negotiation.update({
            where: { id: account.negotiation.id },
            data: {
              status: NegotiationStatus.COMPLETED,
              statusHistory: {
                create: {
                  status: NegotiationStatus.COMPLETED,
                  note: 'Escrow-Freigabe durch Provider abgeschlossen',
                },
              },
            },
          });
          negotiationStatus = NegotiationStatus.COMPLETED;
        }

        eventType = 'ESCROW_RELEASED';
        payload = { ...payload, providerBalance: residual };
        break;
      }
      case 'refund_processed': {
        await tx.escrowTransaction.create({
          data: {
            ...baseTransactionData,
            type: EscrowTransactionType.REFUND,
            amount,
          },
        });

        updatedAccount = await tx.escrowAccount.update({
          where: { id: account.id },
          data: {
            refundedAmount: { increment: amount },
            status: EscrowStatus.REFUNDED,
          },
        });

        const residual =
          updatedAccount.fundedAmount - updatedAccount.releasedAmount - updatedAccount.refundedAmount;

        if (residual <= 0.01) {
          updatedAccount = await tx.escrowAccount.update({
            where: { id: account.id },
            data: { status: EscrowStatus.CLOSED },
          });

          if (account.negotiation.status !== NegotiationStatus.CANCELLED) {
            await tx.negotiation.update({
              where: { id: account.negotiation.id },
              data: {
                status: NegotiationStatus.CANCELLED,
                statusHistory: {
                  create: {
                    status: NegotiationStatus.CANCELLED,
                    note: 'Verhandlung nach vollständiger Rückerstattung geschlossen',
                  },
                },
              },
            });
            negotiationStatus = NegotiationStatus.CANCELLED;
          }
        }

        eventType = 'ESCROW_REFUNDED';
        payload = { ...payload, providerBalance: residual };
        break;
      }
      case 'dispute_opened': {
        await tx.escrowTransaction.create({
          data: {
            ...baseTransactionData,
            type: EscrowTransactionType.ADJUSTMENT,
            amount,
            metadata: {
              ...baseTransactionData.metadata,
              dispute: { state: 'OPEN', details: envelope.metadata ?? null },
            },
          },
        });

        updatedAccount = await tx.escrowAccount.update({
          where: { id: account.id },
          data: { status: EscrowStatus.DISPUTED },
        });

        eventType = 'ESCROW_DISPUTE_OPENED';
        payload = { ...payload, disputeDetails: envelope.metadata ?? null };
        break;
      }
      case 'dispute_resolved': {
        await tx.escrowTransaction.create({
          data: {
            ...baseTransactionData,
            type: EscrowTransactionType.ADJUSTMENT,
            amount,
            metadata: {
              ...baseTransactionData.metadata,
              dispute: { state: 'RESOLVED', details: envelope.metadata ?? null },
            },
          },
        });

        const refreshedAccount = await tx.escrowAccount.findUnique({
          where: { id: account.id },
          select: { fundedAmount: true, releasedAmount: true, refundedAmount: true },
        });

        const residual = refreshedAccount
          ? refreshedAccount.fundedAmount - refreshedAccount.releasedAmount - refreshedAccount.refundedAmount
          : 0;
        const status = residual <= 0.01 ? EscrowStatus.CLOSED : EscrowStatus.FUNDED;

        updatedAccount = await tx.escrowAccount.update({
          where: { id: account.id },
          data: { status },
        });

        eventType = 'ESCROW_DISPUTE_RESOLVED';
        payload = { ...payload, disputeDetails: envelope.metadata ?? null, providerBalance: residual };
        break;
      }
      case 'statement_ready': {
        await tx.escrowTransaction.create({
          data: {
            ...baseTransactionData,
            type: EscrowTransactionType.ADJUSTMENT,
            amount: 0,
            metadata: {
              ...baseTransactionData.metadata,
              reconciliation: {
                status: 'PENDING',
                statementId: envelope.externalTransactionId,
                providerBalance: amount,
              },
            },
          },
        });

        eventType = 'ESCROW_STATEMENT_READY';
        payload = {
          ...payload,
          providerBalance: amount,
          reconciliationStatementId: envelope.externalTransactionId,
        };
        break;
      }
      default:
        eventType = null;
        break;
    }

    return {
      updatedAccount,
      negotiationStatus,
      eventType,
      payload,
    };
  });

  if (result.eventType) {
    await publishNegotiationEvent({
      type: result.eventType,
      negotiationId: account.negotiation.id,
      triggeredBy: null,
      status: result.negotiationStatus ?? account.negotiation.status,
      occurredAt,
      payload: result.payload,
    });
  }

  return NextResponse.json({ status: 'ok' });
}
