import { FulfilmentMilestoneType, FulfilmentOrderStatus } from '@prisma/client';

import { prisma } from '@/lib/db/prisma';
import { markReminderSent } from '@/lib/fulfilment/service';
import { publishNegotiationEvent } from '@/lib/events/negotiations';

const SLA_ESCALATION_CHANNELS = ['channel:email', 'channel:sms'];

// meta: module=fulfilment-jobs task=reminder-sweep version=0.1 owner=operations

const ESCALATION_STATUSES = [
  FulfilmentOrderStatus.SCHEDULING,
  FulfilmentOrderStatus.SCHEDULED,
  FulfilmentOrderStatus.IN_TRANSIT,
];

export interface FulfilmentSweepMetrics {
  remindersProcessed: number;
  overdueOrdersEscalated: number;
  pendingReminderCount: number;
  slaAlertsQueued: number;
}

export async function processFulfilmentReminders(limit = 25): Promise<number> {
  const dueReminders = await prisma.fulfilmentReminder.findMany({
    where: {
      sentAt: null,
      scheduledFor: { lte: new Date() },
    },
    orderBy: { scheduledFor: 'asc' },
    take: limit,
  });

  for (const reminder of dueReminders) {
    await markReminderSent(reminder.id);
  }

  return dueReminders.length;
}

export async function escalateMissedPickups(limit = 25): Promise<number> {
  const overdueOrders = await prisma.fulfilmentOrder.findMany({
    where: {
      status: { in: ESCALATION_STATUSES },
      pickupWindowEnd: { lt: new Date() },
      milestones: {
        none: {
          type: {
            in: [
              FulfilmentMilestoneType.PICKED_UP,
              FulfilmentMilestoneType.IN_TRANSIT,
              FulfilmentMilestoneType.DELIVERED,
            ],
          },
        },
      },
    },
    select: { id: true, negotiationId: true },
    take: limit,
  });

  for (const order of overdueOrders) {
    await publishNegotiationEvent({
      type: 'FULFILMENT_ORDER_UPDATED',
      negotiationId: order.negotiationId,
      triggeredBy: null,
      payload: {
        orderId: order.id,
        escalation: 'PICKUP_WINDOW_MISSED',
        severity: 'CRITICAL',
      },
      channels: SLA_ESCALATION_CHANNELS,
    });
  }

  return overdueOrders.length;
}

export async function runFulfilmentLogisticsSweep(): Promise<FulfilmentSweepMetrics> {
  const pendingReminderCount = await prisma.fulfilmentReminder.count({
    where: { sentAt: null, scheduledFor: { gte: new Date() } },
  });

  const remindersProcessed = await processFulfilmentReminders();
  const overdueOrdersEscalated = await escalateMissedPickups();
  const slaAlertsQueued = overdueOrdersEscalated;

  return {
    pendingReminderCount,
    remindersProcessed,
    overdueOrdersEscalated,
    slaAlertsQueued,
  };
}
