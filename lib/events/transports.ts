import type { StoredNegotiationNotification } from '@/lib/events/queue';

/**
 * meta: module=notification-transports version=0.1 owner=platform
 */
export interface NotificationTransport {
  key: string;
  deliver: (notification: StoredNegotiationNotification) => Promise<void> | void;
  supports?: (notification: StoredNegotiationNotification) => boolean;
}

const transports = new Map<string, NotificationTransport>();
const emailOutbox: StoredNegotiationNotification[] = [];
const smsOutbox: StoredNegotiationNotification[] = [];

export function registerNotificationTransport(transport: NotificationTransport) {
  transports.set(transport.key, transport);
}

export function getNotificationTransports(): NotificationTransport[] {
  return Array.from(transports.values());
}

function extractEscalationLabel(notification: StoredNegotiationNotification): string | null {
  const payload = notification.payload;

  if (payload && typeof payload === 'object' && !Array.isArray(payload)) {
    const record = payload as Record<string, unknown>;
    const escalation = record.escalation;
    return typeof escalation === 'string' ? escalation : null;
  }

  return null;
}

export function drainEmailNotificationQueue(): StoredNegotiationNotification[] {
  return emailOutbox.splice(0, emailOutbox.length);
}

export function drainSmsNotificationQueue(): StoredNegotiationNotification[] {
  return smsOutbox.splice(0, smsOutbox.length);
}

if (!transports.has('console-log')) {
  registerNotificationTransport({
    key: 'console-log',
    deliver(notification) {
      if (process.env.NODE_ENV !== 'test') {
        // eslint-disable-next-line no-console -- temporary transport until external webhooks are wired
        console.info(
          '[notification-transport][console]',
          notification.type,
          notification.negotiationId,
          notification.channels
        );
      }
    },
  });
}

if (!transports.has('queue:email')) {
  registerNotificationTransport({
    key: 'queue:email',
    supports(notification) {
      return notification.channels.includes('channel:email');
    },
    deliver(notification) {
      emailOutbox.push(notification);

      const escalation = extractEscalationLabel(notification);
      if (process.env.NODE_ENV !== 'test' && escalation) {
        // eslint-disable-next-line no-console -- SLA-critical alerts are logged for operational awareness only
        console.info('[notification-queue][email][sla]', notification.negotiationId, escalation);
      }
    },
  });
}

if (!transports.has('queue:sms')) {
  registerNotificationTransport({
    key: 'queue:sms',
    supports(notification) {
      return notification.channels.includes('channel:sms');
    },
    deliver(notification) {
      smsOutbox.push(notification);

      const escalation = extractEscalationLabel(notification);
      if (process.env.NODE_ENV !== 'test' && escalation) {
        // eslint-disable-next-line no-console -- SLA-critical alerts are logged for operational awareness only
        console.info('[notification-queue][sms][sla]', notification.negotiationId, escalation);
      }
    },
  });
}
