import {
  NegotiationActivityAudience,
  NegotiationActivityType,
  NegotiationStatus,
} from '@prisma/client';

import { prisma } from '@/lib/db/prisma';
import { recordPremiumConversionEvent } from '@/lib/premium/entitlements';
import { PremiumConversionEventType } from '@prisma/client';

import { enqueueNegotiationLifecycleEvent } from './queue';
import type { NegotiationQueueEnvelope } from './queue';

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
  | 'ESCROW_REFUNDED'
  | 'ESCROW_DISPUTE_OPENED'
  | 'ESCROW_DISPUTE_RESOLVED'
  | 'ESCROW_STATEMENT_READY'
  | 'DEAL_DISPUTE_RAISED'
  | 'DEAL_DISPUTE_ESCROW_HOLD'
  | 'DEAL_DISPUTE_ESCROW_COUNTER'
  | 'DEAL_DISPUTE_ESCROW_PAYOUT'
  | 'DEAL_DISPUTE_SLA_BREACHED'
  | 'NEGOTIATION_SLA_WARNING'
  | 'NEGOTIATION_SLA_BREACHED'
  | 'CONTRACT_SIGNATURE_REQUESTED'
  | 'CONTRACT_SIGNATURE_COMPLETED'
  | 'CONTRACT_REVISION_SUBMITTED'
  | 'CONTRACT_REVISION_ACCEPTED'
  | 'CONTRACT_REVISION_REJECTED'
  | 'CONTRACT_REVISION_COMMENTED'
  | 'FULFILMENT_ORDER_CREATED'
  | 'FULFILMENT_ORDER_SCHEDULED'
  | 'FULFILMENT_ORDER_UPDATED'
  | 'FULFILMENT_MILESTONE_RECORDED'
  | 'FULFILMENT_REMINDER_SCHEDULED'
  | 'FULFILMENT_REMINDER_SENT';

export interface NegotiationDomainEvent {
  type: NegotiationEventType;
  negotiationId: string;
  triggeredBy: string | null;
  status?: NegotiationStatus;
  payload?: Record<string, unknown>;
  occurredAt?: Date;
  channels?: string[];
}

export interface NegotiationEventHandlerContext {
  audience: NegotiationActivityAudience;
  activityType: NegotiationActivityType;
  label: string;
  description?: string | null;
}

type NegotiationEventHandler = (
  event: NegotiationDomainEvent & { occurredAt: Date },
  context: NegotiationEventHandlerContext
) => Promise<void> | void;

const negotiationEventHandlers = new Set<NegotiationEventHandler>();

export function registerNegotiationEventHandler(handler: NegotiationEventHandler) {
  negotiationEventHandlers.add(handler);
}

function resolveEventContext(
  event: NegotiationDomainEvent
): NegotiationEventHandlerContext {
  switch (event.type) {
    case 'NEGOTIATION_CREATED':
      return {
        audience: NegotiationActivityAudience.PARTICIPANTS,
        activityType: NegotiationActivityType.NEGOTIATION_CREATED,
        label: 'Verhandlung gestartet',
        description: 'Käufer hat eine neue Verhandlung initiiert.',
      };
    case 'NEGOTIATION_COUNTER_SUBMITTED':
      return {
        audience: NegotiationActivityAudience.PARTICIPANTS,
        activityType: NegotiationActivityType.NEGOTIATION_COUNTER_SUBMITTED,
        label: 'Neues Gegenangebot',
        description: 'Ein neues Angebot wurde eingereicht.',
      };
    case 'NEGOTIATION_ACCEPTED':
      return {
        audience: NegotiationActivityAudience.ALL,
        activityType: NegotiationActivityType.NEGOTIATION_ACCEPTED,
        label: 'Verhandlung akzeptiert',
        description: 'Parteien haben sich auf die Konditionen geeinigt.',
      };
    case 'NEGOTIATION_CANCELLED':
      return {
        audience: NegotiationActivityAudience.ALL,
        activityType: NegotiationActivityType.NEGOTIATION_CANCELLED,
        label: 'Verhandlung abgebrochen',
        description: 'Eine Partei hat die Verhandlung beendet.',
      };
    case 'ESCROW_FUNDED':
      return {
        audience: NegotiationActivityAudience.ALL,
        activityType: NegotiationActivityType.ESCROW_FUNDED,
        label: 'Treuhandkonto finanziert',
        description: 'Zahlung wurde auf das Treuhandkonto eingezahlt.',
      };
    case 'ESCROW_RELEASED':
      return {
        audience: NegotiationActivityAudience.ALL,
        activityType: NegotiationActivityType.ESCROW_RELEASED,
        label: 'Treuhandmittel freigegeben',
        description: 'Treuhandmittel wurden freigegeben.',
      };
    case 'ESCROW_REFUNDED':
      return {
        audience: NegotiationActivityAudience.ALL,
        activityType: NegotiationActivityType.ESCROW_REFUNDED,
        label: 'Treuhandmittel erstattet',
        description: 'Treuhandmittel wurden zurückerstattet.',
      };
    case 'ESCROW_DISPUTE_OPENED':
      return {
        audience: NegotiationActivityAudience.ADMIN,
        activityType: NegotiationActivityType.ESCROW_DISPUTE_OPENED,
        label: 'Treuhandkonto im Disput',
        description: 'Provider meldet einen Streitfall für dieses Escrow-Konto.',
      };
    case 'DEAL_DISPUTE_RAISED':
      return {
        audience: NegotiationActivityAudience.ADMIN,
        activityType: NegotiationActivityType.ESCROW_DISPUTE_OPENED,
        label: 'Neuer Deal-Disput gemeldet',
        description: 'Teilnehmende Partei hat einen neuen Disput eröffnet.',
      };
    case 'ESCROW_DISPUTE_RESOLVED':
      return {
        audience: NegotiationActivityAudience.ADMIN,
        activityType: NegotiationActivityType.ESCROW_DISPUTE_RESOLVED,
        label: 'Disput beigelegt',
        description: 'Escrow-Disput wurde durch den Provider aufgelöst.',
      };
    case 'ESCROW_STATEMENT_READY':
      return {
        audience: NegotiationActivityAudience.ADMIN,
        activityType: NegotiationActivityType.ESCROW_STATEMENT_READY,
        label: 'Provider-Kontoauszug verfügbar',
        description: 'Neuer Escrow-Statement eingetroffen – Reconciliation benötigt.',
      };
    case 'DEAL_DISPUTE_ESCROW_HOLD':
      return {
        audience: NegotiationActivityAudience.ADMIN,
        activityType: NegotiationActivityType.ESCROW_DISPUTE_HOLD_APPLIED,
        label: 'Teilbetrag blockiert',
        description: 'Treuhandmittel wurden aufgrund eines Disputs reserviert.',
      };
    case 'DEAL_DISPUTE_ESCROW_COUNTER':
      return {
        audience: NegotiationActivityAudience.ADMIN,
        activityType: NegotiationActivityType.ESCROW_DISPUTE_COUNTER_PROPOSED,
        label: 'Vergleichsvorschlag hinterlegt',
        description: 'Operations-Team hat einen Ausgleichsvorschlag dokumentiert.',
      };
    case 'DEAL_DISPUTE_ESCROW_PAYOUT':
      return {
        audience: NegotiationActivityAudience.ADMIN,
        activityType: NegotiationActivityType.ESCROW_DISPUTE_PAYOUT_EXECUTED,
        label: 'Auszahlung aus Disput',
        description: 'Treuhandmittel wurden im Rahmen des Disputs ausgezahlt.',
      };
    case 'DEAL_DISPUTE_SLA_BREACHED':
      return {
        audience: NegotiationActivityAudience.ADMIN,
        activityType: NegotiationActivityType.ESCROW_DISPUTE_SLA_BREACHED,
        label: 'Disput SLA verletzt',
        description: 'SLA-Fälligkeit des Disputs wurde überschritten.',
      };
    case 'NEGOTIATION_SLA_WARNING':
      return {
        audience: NegotiationActivityAudience.ALL,
        activityType: NegotiationActivityType.NEGOTIATION_SLA_WARNING,
        label: 'SLA Warnung',
        description: 'Die Verhandlung nähert sich dem Ablaufdatum.',
      };
    case 'NEGOTIATION_SLA_BREACHED':
      return {
        audience: NegotiationActivityAudience.ALL,
        activityType: NegotiationActivityType.NEGOTIATION_SLA_BREACHED,
        label: 'SLA verletzt',
        description: 'Die Verhandlung ist aufgrund eines SLA-Verstoßes abgelaufen.',
      };
    case 'CONTRACT_SIGNATURE_REQUESTED':
      return {
        audience: NegotiationActivityAudience.ALL,
        activityType: NegotiationActivityType.CONTRACT_SIGNATURE_REQUESTED,
        label: 'Signatur angefordert',
        description: 'Vertrag wartet auf Unterschriften.',
      };
    case 'CONTRACT_SIGNATURE_COMPLETED':
      return {
        audience: NegotiationActivityAudience.ALL,
        activityType: NegotiationActivityType.CONTRACT_SIGNATURE_COMPLETED,
        label: 'Signatur abgeschlossen',
        description: 'Alle Vertragsunterschriften liegen vor.',
      };
    case 'CONTRACT_REVISION_SUBMITTED':
      return {
        audience: NegotiationActivityAudience.PARTICIPANTS,
        activityType: NegotiationActivityType.CONTRACT_REVISION_SUBMITTED,
        label: 'Neue Vertragsrevision eingereicht',
        description: 'Eine Partei hat eine aktualisierte Vertragsfassung zur Prüfung eingereicht.',
      };
    case 'CONTRACT_REVISION_ACCEPTED':
      return {
        audience: NegotiationActivityAudience.ALL,
        activityType: NegotiationActivityType.CONTRACT_REVISION_ACCEPTED,
        label: 'Vertragsrevision akzeptiert',
        description: 'Die neueste Vertragsfassung wurde angenommen und ist jetzt gültig.',
      };
    case 'CONTRACT_REVISION_REJECTED':
      return {
        audience: NegotiationActivityAudience.PARTICIPANTS,
        activityType: NegotiationActivityType.CONTRACT_REVISION_REJECTED,
        label: 'Vertragsrevision abgelehnt',
        description: 'Die eingereichte Vertragsfassung erfordert weitere Überarbeitung.',
      };
    case 'CONTRACT_REVISION_COMMENTED':
      return {
        audience: NegotiationActivityAudience.PARTICIPANTS,
        activityType: NegotiationActivityType.CONTRACT_REVISION_COMMENTED,
        label: 'Kommentar zur Vertragsrevision',
        description: 'Ein Diskussionseintrag wurde zu einer Vertragsstelle hinzugefügt.',
      };
    case 'FULFILMENT_ORDER_CREATED':
      return {
        audience: NegotiationActivityAudience.ADMIN,
        activityType: NegotiationActivityType.FULFILMENT_ORDER_CREATED,
        label: 'Fulfilmentauftrag erstellt',
        description: 'Das Operations-Team hat einen neuen Fulfilmentauftrag aufgesetzt.',
      };
    case 'FULFILMENT_ORDER_SCHEDULED':
      return {
        audience: NegotiationActivityAudience.ALL,
        activityType: NegotiationActivityType.FULFILMENT_ORDER_SCHEDULED,
        label: 'Fulfilmenttermin bestätigt',
        description: 'Abhol- und Lieferfenster wurden bestätigt und freigegeben.',
      };
    case 'FULFILMENT_ORDER_UPDATED': {
      const escalation =
        event.payload && typeof event.payload === 'object'
          ? (event.payload as Record<string, unknown>).escalation
          : undefined;

      if (escalation) {
        return {
          audience: NegotiationActivityAudience.ADMIN,
          activityType: NegotiationActivityType.FULFILMENT_ORDER_UPDATED,
          label: 'Fulfilment SLA verletzt',
          description: 'Ein Fulfilmentauftrag benötigt sofortige Aufmerksamkeit wegen einer SLA-Verletzung.',
        };
      }

      return {
        audience: NegotiationActivityAudience.ALL,
        activityType: NegotiationActivityType.FULFILMENT_ORDER_UPDATED,
        label: 'Fulfilmentauftrag aktualisiert',
        description: 'Der Fulfilmentauftrag wurde mit neuen Informationen aktualisiert.',
      };
    }
    case 'FULFILMENT_MILESTONE_RECORDED':
      return {
        audience: NegotiationActivityAudience.ALL,
        activityType: NegotiationActivityType.FULFILMENT_MILESTONE_RECORDED,
        label: 'Fulfilment-Meilenstein dokumentiert',
        description: 'Ein neuer Status wurde im Fulfilment-Prozess festgehalten.',
      };
    case 'FULFILMENT_REMINDER_SCHEDULED':
      return {
        audience: NegotiationActivityAudience.ADMIN,
        activityType: NegotiationActivityType.FULFILMENT_REMINDER_SCHEDULED,
        label: 'Fulfilment-Erinnerung geplant',
        description: 'Eine zeitkritische Fulfilment-Erinnerung wurde eingeplant.',
      };
    case 'FULFILMENT_REMINDER_SENT':
      return {
        audience: NegotiationActivityAudience.ADMIN,
        activityType: NegotiationActivityType.FULFILMENT_REMINDER_SENT,
        label: 'Fulfilment-Erinnerung versendet',
        description: 'Eine geplante Fulfilment-Erinnerung wurde ausgelöst.',
      };
    default:
      return {
        audience: NegotiationActivityAudience.PARTICIPANTS,
        activityType: NegotiationActivityType.NEGOTIATION_CREATED,
        label: 'Verhandlungsereignis',
        description: 'Aktualisierung im Verhandlungsprozess.',
      };
  }
}

async function persistNegotiationActivity(
  event: NegotiationDomainEvent & { occurredAt: Date },
  context: NegotiationEventHandlerContext
) {
  await prisma.negotiationActivity.create({
    data: {
      negotiationId: event.negotiationId,
      type: context.activityType,
      audience: context.audience,
      label: context.label,
      description: context.description ?? null,
      status: event.status,
      payload: event.payload ?? null,
      triggeredById: event.triggeredBy ?? undefined,
      occurredAt: event.occurredAt,
    },
  });
}

async function resolveNotificationChannels(
  event: NegotiationDomainEvent & { occurredAt: Date },
  context: NegotiationEventHandlerContext
): Promise<string[]> {
  const channels = new Set<string>();
  channels.add('events:all');
  channels.add(`negotiation:${event.negotiationId}`);
  channels.add(`audience:${context.audience}`);

  if (context.audience === NegotiationActivityAudience.ALL || context.audience === NegotiationActivityAudience.ADMIN) {
    channels.add('audience:ADMIN');
  }

  const negotiation = await prisma.negotiation.findUnique({
    where: { id: event.negotiationId },
    select: { buyerId: true, sellerId: true },
  });

  if (negotiation?.buyerId) {
    channels.add(`user:${negotiation.buyerId}`);
  }

  if (negotiation?.sellerId) {
    channels.add(`user:${negotiation.sellerId}`);
  }

  if (event.triggeredBy) {
    channels.add(`user:${event.triggeredBy}`);
  }

  return Array.from(channels);
}

async function dispatchToQueue(
  event: NegotiationDomainEvent & { occurredAt: Date },
  context: NegotiationEventHandlerContext
) {
  const channels = await resolveNotificationChannels(event, context);
  const extraChannels = event.channels ?? [];
  const mergedChannels = Array.from(new Set([...channels, ...extraChannels]));

  const envelope: NegotiationQueueEnvelope = {
    ...event,
    occurredAt: event.occurredAt.toISOString(),
    audience: context.audience,
    channels: mergedChannels,
  };

  await enqueueNegotiationLifecycleEvent(envelope);
}

async function trackPremiumMilestones(event: NegotiationDomainEvent & { occurredAt: Date }) {
  if (event.type !== 'ESCROW_RELEASED' && event.type !== 'CONTRACT_SIGNATURE_COMPLETED') {
    return;
  }

  const negotiation = await prisma.negotiation.findUnique({
    where: { id: event.negotiationId },
    select: { premiumTier: true, status: true },
  });

  if (!negotiation?.premiumTier) {
    return;
  }

  if (event.type === 'ESCROW_RELEASED' && negotiation.status !== NegotiationStatus.COMPLETED) {
    return;
  }

  await recordPremiumConversionEvent({
    negotiationId: event.negotiationId,
    userId: event.triggeredBy ?? undefined,
    eventType: PremiumConversionEventType.PREMIUM_NEGOTIATION_COMPLETED,
    tier: negotiation.premiumTier ?? undefined,
    metadata: { sourceEvent: event.type },
  });
}

registerNegotiationEventHandler(persistNegotiationActivity);
registerNegotiationEventHandler(dispatchToQueue);
registerNegotiationEventHandler(trackPremiumMilestones);

export async function publishNegotiationEvent(event: NegotiationDomainEvent) {
  const occurredAt = event.occurredAt ?? new Date();
  const context = resolveEventContext(event);

  for (const handler of negotiationEventHandlers) {
    try {
      // eslint-disable-next-line no-await-in-loop -- sequential fan-out keeps ordering deterministic
      await handler({ ...event, occurredAt }, context);
    } catch (error) {
      // eslint-disable-next-line no-console -- persistent logs for failed dispatch until observability stack lands
      console.error('[negotiation-event][dispatch-failed]', event.type, error);
    }
  }
}
