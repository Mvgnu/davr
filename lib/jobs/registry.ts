/**
 * meta: module=job-registry version=0.1 owner=platform
 */
import { getPendingNegotiationNotifications, recordNotificationAttempt } from '@/lib/events/queue';
import { getNotificationTransports } from '@/lib/events/transports';
import { NotificationDeliveryStatus } from '@prisma/client';

import { reconcileEscrowLedgers } from './negotiations/reconciliation';
import { scanNegotiationSlaWindows } from './negotiations/sla';
import { registerJob } from './scheduler';

export function registerMarketplaceJobs() {
  registerJob({
    name: 'negotiation-sla-watchdog',
    intervalMs: 15 * 60 * 1000,
    handler: () => scanNegotiationSlaWindows(),
  });

  registerJob({
    name: 'escrow-reconciliation',
    intervalMs: 30 * 60 * 1000,
    handler: async () => {
      await reconcileEscrowLedgers(25);
    },
    metadata: { limit: 25 },
  });

  registerJob({
    name: 'notification-fanout',
    intervalMs: 5 * 60 * 1000,
    handler: async () => {
      const transports = getNotificationTransports();
      const pending = await getPendingNegotiationNotifications(100);

      if (!transports.length) {
        await Promise.all(
          pending.map((notification) =>
            recordNotificationAttempt(
              notification.id,
              NotificationDeliveryStatus.FAILED,
              'NO_TRANSPORT_REGISTERED'
            )
          )
        );
        return;
      }

      for (const notification of pending) {
        let delivered = false;
        let lastError: string | null = null;

        for (const transport of transports) {
          if (transport.supports && !transport.supports(notification)) {
            continue;
          }

          try {
            // eslint-disable-next-line no-await-in-loop -- sequential fan-out maintains transport ordering
            await transport.deliver(notification);
            delivered = true;
          } catch (transportError) {
            lastError = transportError instanceof Error ? transportError.message : String(transportError);
            break;
          }
        }

        if (delivered) {
          await recordNotificationAttempt(notification.id, NotificationDeliveryStatus.DELIVERED);
        } else {
          await recordNotificationAttempt(
            notification.id,
            NotificationDeliveryStatus.FAILED,
            lastError ?? 'DELIVERY_FAILED'
          );
        }
      }
    },
  });
}
