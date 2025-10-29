import { NegotiationStatus } from '@prisma/client';

/**
 * meta: module=negotiation-events version=0.2 owner=platform
 * Lightweight event publisher so negotiation lifecycle changes can fan out to
 * messaging queues and admin monitors once downstream integrations are ready.
 */
export type NegotiationEventType =
  | 'NEGOTIATION_CREATED'
  | 'NEGOTIATION_COUNTER_SUBMITTED'
  | 'NEGOTIATION_ACCEPTED'
  | 'NEGOTIATION_CANCELLED'
  | 'ESCROW_FUNDED'
  | 'ESCROW_RELEASED'
  | 'ESCROW_REFUNDED';

export interface NegotiationDomainEvent {
  type: NegotiationEventType;
  negotiationId: string;
  triggeredBy: string | null;
  status?: NegotiationStatus;
  payload?: Record<string, unknown>;
  occurredAt?: Date;
}

export async function publishNegotiationEvent(event: NegotiationDomainEvent) {
  const occurredAt = event.occurredAt ?? new Date();
  const payload = {
    ...event,
    occurredAt: occurredAt.toISOString(),
  };

  // eslint-disable-next-line no-console -- until messaging queue integration ships
  console.info('[negotiation-event]', JSON.stringify(payload));
}
