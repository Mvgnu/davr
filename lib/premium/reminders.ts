/**
 * meta: module=premium-reminders version=0.1 owner=platform
 * intent: dispatch grace-period billing nudges while avoiding excess telemetry
 */
import { PremiumSubscriptionStatus } from '@prisma/client';

import { prisma } from '@/lib/db/prisma';

import {
  applyPremiumLifecyclePatch,
  resolvePremiumLifecycleState,
  type PremiumLifecyclePatch,
} from './entitlements';

interface ReminderMetrics {
  remindersSent: number;
}

function shouldThrottleReminder(lastSentAt: Date | null, now: Date): boolean {
  if (!lastSentAt) {
    return false;
  }

  const elapsedMs = now.getTime() - lastSentAt.getTime();
  return elapsedMs < 24 * 60 * 60 * 1000;
}

export async function dispatchPremiumDunningReminders(now: Date = new Date()): Promise<ReminderMetrics> {
  const subscriptions = await prisma.premiumSubscription.findMany({
    where: { status: PremiumSubscriptionStatus.EXPIRED },
    select: {
      id: true,
      userId: true,
      tier: true,
      metadata: true,
    },
  });

  let remindersSent = 0;

  for (const subscription of subscriptions) {
    const lifecycle = resolvePremiumLifecycleState(subscription, now);

    if (lifecycle.dunningState !== 'PAYMENT_FAILED') {
      continue;
    }

    if (!lifecycle.gracePeriodEndsAt || lifecycle.gracePeriodEndsAt.getTime() <= now.getTime()) {
      continue;
    }

    if (shouldThrottleReminder(lifecycle.lastReminderSentAt, now)) {
      continue;
    }

    console.info('[premium-dunning] reminder-dispatched', {
      subscriptionId: subscription.id,
      userId: subscription.userId,
      tier: subscription.tier,
    });

    const patch: PremiumLifecyclePatch = {
      lastReminderSentAt: now,
    };

    await prisma.premiumSubscription.update({
      where: { id: subscription.id },
      data: { metadata: applyPremiumLifecyclePatch(subscription.metadata, patch) },
    });

    remindersSent += 1;
  }

  return { remindersSent };
}
