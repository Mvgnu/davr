/**
 * meta: module=job-registry version=0.1 owner=platform
 */
import { getPendingNegotiationNotifications, recordNotificationAttempt } from '@/lib/events/queue';
import { getNotificationTransports } from '@/lib/events/transports';
import { NotificationDeliveryStatus } from '@prisma/client';

import { scanDealDisputeSlaBreaches } from './disputes/sla';
import { runFulfilmentLogisticsSweep } from './fulfilment/reminders';
import { reconcileEscrowLedgers } from './negotiations/reconciliation';
import { scanNegotiationSlaWindows } from './negotiations/sla';
import { dispatchPremiumDunningReminders } from '@/lib/premium/reminders';
import { registerJob } from './scheduler';

export function registerMarketplaceJobs() {
  const fulfilmentJobMetadata: Record<string, unknown> = {};
  const premiumReminderMetadata: Record<string, unknown> = {};

  registerJob({
    name: 'negotiation-sla-watchdog',
    intervalMs: 15 * 60 * 1000,
    handler: () => scanNegotiationSlaWindows(),
  });

  registerJob({
    name: 'deal-dispute-sla-monitor',
    intervalMs: 10 * 60 * 1000,
    handler: () => scanDealDisputeSlaBreaches(),
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

  registerJob({
    name: 'fulfilment-logistics-sweep',
    intervalMs: 5 * 60 * 1000,
    metadata: fulfilmentJobMetadata,
    handler: async () => {
      const metrics = await runFulfilmentLogisticsSweep();
      fulfilmentJobMetadata.pendingReminderCount = metrics.pendingReminderCount;
      fulfilmentJobMetadata.remindersProcessed = metrics.remindersProcessed;
      fulfilmentJobMetadata.overdueOrdersEscalated = metrics.overdueOrdersEscalated;
      fulfilmentJobMetadata.slaAlertsQueued = metrics.slaAlertsQueued;
    },
  });

  registerJob({
    name: 'premium-dunning-reminders',
    intervalMs: 6 * 60 * 60 * 1000,
    metadata: premiumReminderMetadata,
    handler: async () => {
      const { remindersSent } = await dispatchPremiumDunningReminders();
      premiumReminderMetadata.remindersSent = remindersSent;
    },
  });
}
