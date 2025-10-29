import { addHours, isBefore } from 'date-fns';
import { NegotiationStatus } from '@prisma/client';

import { prisma } from '@/lib/db/prisma';
import { publishNegotiationEvent } from '@/lib/events/negotiations';

const WARNING_THRESHOLD_HOURS = 12;

/**
 * meta: module=negotiation-jobs task=sla-watchdog version=0.1 owner=platform
 * Scans negotiations nearing expiry and emits SLA warnings/breach events so the
 * workspace timeline and admin console can surface risk in near real-time.
 */
export async function scanNegotiationSlaWindows(referenceDate = new Date()) {
  const warningWindowEnd = addHours(referenceDate, WARNING_THRESHOLD_HOURS);
  const activeNegotiations = await prisma.negotiation.findMany({
    where: {
      status: { notIn: [NegotiationStatus.CANCELLED, NegotiationStatus.COMPLETED, NegotiationStatus.EXPIRED] },
      expiresAt: { not: null },
    },
    select: {
      id: true,
      expiresAt: true,
    },
  });

  for (const negotiation of activeNegotiations) {
    if (!negotiation.expiresAt) {
      continue;
    }

    if (isBefore(negotiation.expiresAt, referenceDate)) {
      await publishNegotiationEvent({
        type: 'NEGOTIATION_SLA_BREACHED',
        negotiationId: negotiation.id,
        triggeredBy: null,
        status: NegotiationStatus.EXPIRED,
        occurredAt: referenceDate,
        payload: {
          expiresAt: negotiation.expiresAt.toISOString(),
        },
      });
      continue;
    }

    if (isBefore(negotiation.expiresAt, warningWindowEnd)) {
      await publishNegotiationEvent({
        type: 'NEGOTIATION_SLA_WARNING',
        negotiationId: negotiation.id,
        triggeredBy: null,
        status: NegotiationStatus.COUNTERING,
        occurredAt: referenceDate,
        payload: {
          expiresAt: negotiation.expiresAt.toISOString(),
        },
      });
    }
  }
}
