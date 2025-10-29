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

export function registerNotificationTransport(transport: NotificationTransport) {
  transports.set(transport.key, transport);
}

export function getNotificationTransports(): NotificationTransport[] {
  return Array.from(transports.values());
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
