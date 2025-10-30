import { DealDisputeEventType, DealDisputeStatus, type Prisma } from '@prisma/client';

import { prisma } from '@/lib/db/prisma';
import { publishNegotiationEvent } from '@/lib/events/negotiations';
import { ACTIVE_DISPUTE_STATUSES } from '@/lib/disputes/service';

/**
 * meta: module=dispute-jobs task=sla-monitor version=0.1 owner=operations
 * Scans offene Disputes auf SLA-Verstöße, protokolliert Ereignisse und
 * eskaliert automatisch für das Operations-Team.
 */
export async function scanDealDisputeSlaBreaches(referenceDate = new Date()) {
  const overdueDisputes = await prisma.dealDispute.findMany({
    where: {
      slaDueAt: { not: null, lt: referenceDate },
      slaBreachedAt: null,
      status: { in: ACTIVE_DISPUTE_STATUSES },
    },
    select: {
      id: true,
      negotiationId: true,
      status: true,
      escalatedAt: true,
      negotiation: { select: { status: true } },
    },
  });

  for (const dispute of overdueDisputes) {
    const occurredAt = referenceDate;
    const updated = await prisma.$transaction(async (tx) => {
      const update: Prisma.DealDisputeUpdateInput = {
        slaBreachedAt: occurredAt,
      };

      if (dispute.status !== DealDisputeStatus.ESCALATED) {
        update.status = DealDisputeStatus.ESCALATED;
      }

      if (!dispute.escalatedAt) {
        update.escalatedAt = occurredAt;
      }

      const disputeRecord = await tx.dealDispute.update({
        where: { id: dispute.id },
        data: update,
      });

      await tx.dealDisputeEvent.create({
        data: {
          disputeId: dispute.id,
          actorUserId: null,
          type: DealDisputeEventType.SLA_BREACH_RECORDED,
          status: disputeRecord.status,
          message: 'SLA überschritten – automatische Eskalation.',
          metadata: {
            occurredAt: occurredAt.toISOString(),
          },
        },
      });

      return disputeRecord;
    });

    await publishNegotiationEvent({
      type: 'DEAL_DISPUTE_SLA_BREACHED',
      negotiationId: dispute.negotiationId,
      triggeredBy: null,
      status: dispute.negotiation?.status ?? null,
      occurredAt,
      payload: {
        disputeId: dispute.id,
        escalated: updated.status === DealDisputeStatus.ESCALATED,
        slaBreachedAt: occurredAt.toISOString(),
      },
    });
  }

  return overdueDisputes.map((entry) => entry.id);
}
