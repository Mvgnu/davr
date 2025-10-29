import { EscrowTransactionType } from '@prisma/client';

import { prisma } from '@/lib/db/prisma';
import { publishNegotiationEvent } from '@/lib/events/negotiations';
import { getEscrowProvider } from '@/lib/integrations/escrow';

const RECONCILIATION_TOLERANCE = 0.01;

/**
 * meta: module=negotiation-jobs task=escrow-reconciliation version=0.1 owner=platform
 * Pulls provider statements and records reconciliation snapshots so admins can
 * flag ledger mismatches from the operations console.
 */
export async function reconcileEscrowLedgers(limit = 20) {
  const provider = getEscrowProvider();
  const accounts = await prisma.escrowAccount.findMany({
    where: { providerReference: { not: null } },
    include: {
      negotiation: { select: { id: true, status: true } },
    },
    orderBy: { updatedAt: 'desc' },
    take: limit,
  });

  const results: Array<{ negotiationId: string; reconciliationStatus: 'MATCHED' | 'MISMATCH' }>
    = [];

  for (const account of accounts) {
    if (!account.providerReference || !account.negotiation) {
      continue;
    }

    const statement = await provider.getStatement(account.providerReference);

    const existing = await prisma.escrowTransaction.findFirst({
      where: {
        escrowAccountId: account.id,
        reference: statement.statementId,
      },
    });

    const ledgerBalance = account.fundedAmount - account.releasedAmount - account.refundedAmount;
    const delta = Number((statement.balance - ledgerBalance).toFixed(2));
    const status = Math.abs(delta) <= RECONCILIATION_TOLERANCE ? 'MATCHED' : 'MISMATCH';

    if (existing) {
      const existingStatus = existing.metadata && typeof existing.metadata === 'object'
        ? (existing.metadata as any)?.reconciliation?.status
        : null;
      if (existingStatus === status) {
        results.push({ negotiationId: account.negotiation.id, reconciliationStatus: status });
        continue;
      }
    }

    await prisma.escrowTransaction.create({
      data: {
        escrowAccountId: account.id,
        type: EscrowTransactionType.ADJUSTMENT,
        amount: 0,
        reference: statement.statementId,
        metadata: {
          providerEvent: 'statement_polled',
          reconciliation: {
            status,
            providerBalance: statement.balance,
            ledgerBalance,
            delta,
            generatedAt: statement.generatedAt.toISOString(),
          },
        },
      },
    });

    if (status === 'MISMATCH') {
      await publishNegotiationEvent({
        type: 'ESCROW_STATEMENT_READY',
        negotiationId: account.negotiation.id,
        triggeredBy: null,
        status: account.negotiation.status,
        payload: {
          providerReference: account.providerReference,
          statementId: statement.statementId,
          providerBalance: statement.balance,
          ledgerBalance,
          delta,
          source: 'RECONCILIATION_JOB',
        },
      });
    }

    results.push({ negotiationId: account.negotiation.id, reconciliationStatus: status });
  }

  return results;
}
