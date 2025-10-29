/**
 * meta: module=premium-metrics version=0.2 owner=platform
 * Aggregates premium monetisation conversion funnel metrics for admin insights.
 */
import { addDays, startOfDay, subDays } from 'date-fns';
import { Prisma, PremiumConversionEventType, PremiumSubscriptionStatus, PremiumTier } from '@prisma/client';

import { prisma } from '@/lib/db/prisma';

export interface PremiumConversionMetrics {
  window: {
    start: string;
    end: string;
    days: number;
  };
  filter: {
    tier: PremiumTier | 'ALL';
  };
  totals: {
    ctaViews: number;
    trialStarts: number;
    upgrades: number;
    premiumCompletions: number;
    activeSubscribers: number;
  };
  uniqueUsers: {
    trialStarts: number;
    upgrades: number;
  };
  conversionRates: {
    ctaToTrial: number | null;
    trialToUpgrade: number | null;
    upgradeToCompletion: number | null;
  };
  comparison: {
    previousWindow: {
      start: string;
      end: string;
      days: number;
    };
    previousTotals: {
      ctaViews: number;
      trialStarts: number;
      upgrades: number;
      premiumCompletions: number;
      activeSubscribers: number;
    };
    previousUniqueUsers: {
      trialStarts: number;
      upgrades: number;
    };
    previousConversionRates: {
      ctaToTrial: number | null;
      trialToUpgrade: number | null;
      upgradeToCompletion: number | null;
    };
    delta: {
      totals: {
        ctaViews: number;
        trialStarts: number;
        upgrades: number;
        premiumCompletions: number;
      };
      uniqueUsers: {
        trialStarts: number;
        upgrades: number;
      };
      conversionRates: {
        ctaToTrial: number | null;
        trialToUpgrade: number | null;
        upgradeToCompletion: number | null;
      };
      activeSubscribers: number;
    };
  };
  timeseries: PremiumConversionTimeseriesPoint[];
}

export interface PremiumConversionTimeseriesPoint {
  date: string;
  totals: {
    ctaViews: number;
    trialStarts: number;
    upgrades: number;
    premiumCompletions: number;
  };
  conversionRates: {
    ctaToTrial: number | null;
    trialToUpgrade: number | null;
    upgradeToCompletion: number | null;
  };
}

interface MetricsOptions {
  windowInDays?: number;
  tier?: PremiumTier;
}

function buildTierFilter(tier?: PremiumTier): Prisma.PremiumConversionEventWhereInput | undefined {
  if (!tier) {
    return undefined;
  }

  const baseConditions: Prisma.PremiumConversionEventWhereInput[] = [
    { metadata: { path: ['tier'], equals: tier } },
  ];

  if (tier === PremiumTier.PREMIUM) {
    baseConditions.push({ metadata: null }, { metadata: { path: ['tier'], equals: null } });
  }

  return { OR: baseConditions };
}

async function countEventsWithinWindow(
  eventType: PremiumConversionEventType,
  windowStart: Date,
  windowEnd: Date,
  tier?: PremiumTier
) {
  const where: Prisma.PremiumConversionEventWhereInput = {
    eventType,
    occurredAt: {
      gte: windowStart,
      lt: windowEnd,
    },
    ...buildTierFilter(tier),
  };

  return prisma.premiumConversionEvent.count({ where });
}

async function resolveUniqueUsers(
  eventType: PremiumConversionEventType,
  windowStart: Date,
  windowEnd: Date,
  tier?: PremiumTier
) {
  const where: Prisma.PremiumConversionEventWhereInput = {
    eventType,
    occurredAt: {
      gte: windowStart,
      lt: windowEnd,
    },
    userId: { not: null },
    ...buildTierFilter(tier),
  };

  const events = await prisma.premiumConversionEvent.findMany({
    where,
    select: { userId: true },
  });

  const unique = new Set(events.map((event) => event.userId));
  return unique.size;
}

function computeRate(numerator: number, denominator: number) {
  if (denominator <= 0) {
    return null;
  }
  const rate = numerator / denominator;
  return Number(rate.toFixed(4));
}

function computeRateDelta(current: number | null, previous: number | null) {
  if (current === null || previous === null) {
    return null;
  }

  return Number((current - previous).toFixed(4));
}

interface AggregatedWindowMetrics {
  totals: {
    ctaViews: number;
    trialStarts: number;
    upgrades: number;
    premiumCompletions: number;
  };
  uniqueUsers: {
    trialStarts: number;
    upgrades: number;
  };
  conversionRates: {
    ctaToTrial: number | null;
    trialToUpgrade: number | null;
    upgradeToCompletion: number | null;
  };
}

async function aggregateConversionWindow(
  windowStart: Date,
  windowEnd: Date,
  tier?: PremiumTier
): Promise<AggregatedWindowMetrics> {
  const [ctaViews, trialStarts, upgrades, premiumCompletions, uniqueTrialUsers, uniqueUpgradeUsers] =
    await Promise.all([
      countEventsWithinWindow(PremiumConversionEventType.UPGRADE_CTA_VIEWED, windowStart, windowEnd, tier),
      countEventsWithinWindow(PremiumConversionEventType.TRIAL_STARTED, windowStart, windowEnd, tier),
      countEventsWithinWindow(PremiumConversionEventType.UPGRADE_CONFIRMED, windowStart, windowEnd, tier),
      countEventsWithinWindow(
        PremiumConversionEventType.PREMIUM_NEGOTIATION_COMPLETED,
        windowStart,
        windowEnd,
        tier
      ),
      resolveUniqueUsers(PremiumConversionEventType.TRIAL_STARTED, windowStart, windowEnd, tier),
      resolveUniqueUsers(PremiumConversionEventType.UPGRADE_CONFIRMED, windowStart, windowEnd, tier),
    ]);

  return {
    totals: {
      ctaViews,
      trialStarts,
      upgrades,
      premiumCompletions,
    },
    uniqueUsers: {
      trialStarts: uniqueTrialUsers,
      upgrades: uniqueUpgradeUsers,
    },
    conversionRates: {
      ctaToTrial: computeRate(trialStarts, ctaViews),
      trialToUpgrade: computeRate(upgrades, trialStarts),
      upgradeToCompletion: computeRate(premiumCompletions, upgrades),
    },
  };
}

async function countActiveSubscribersAt(reference: Date, tier?: PremiumTier) {
  return prisma.premiumSubscription.count({
    where: {
      status: {
        in: [PremiumSubscriptionStatus.ACTIVE, PremiumSubscriptionStatus.TRIALING],
      },
      ...(tier ? { tier } : {}),
      startedAt: {
        lte: reference,
      },
      AND: [
        {
          OR: [
            { cancellationRequestedAt: null },
            { cancellationRequestedAt: { gt: reference } },
          ],
        },
        {
          OR: [
            { currentPeriodEndsAt: null },
            { currentPeriodEndsAt: { gt: reference } },
          ],
        },
      ],
    },
  });
}

const TIMESERIES_EVENT_TYPES = [
  PremiumConversionEventType.UPGRADE_CTA_VIEWED,
  PremiumConversionEventType.TRIAL_STARTED,
  PremiumConversionEventType.UPGRADE_CONFIRMED,
  PremiumConversionEventType.PREMIUM_NEGOTIATION_COMPLETED,
];

interface TimeseriesBucket {
  ctaViews: number;
  trialStarts: number;
  upgrades: number;
  premiumCompletions: number;
}

function initialiseTimeseriesBuckets(windowStart: Date, windowEnd: Date) {
  const buckets = new Map<string, TimeseriesBucket>();
  let bucketCursor = startOfDay(windowStart);

  while (bucketCursor < windowEnd || buckets.size === 0) {
    buckets.set(bucketCursor.toISOString(), {
      ctaViews: 0,
      trialStarts: 0,
      upgrades: 0,
      premiumCompletions: 0,
    });
    bucketCursor = addDays(bucketCursor, 1);
    if (bucketCursor >= windowEnd) {
      break;
    }
  }

  return buckets;
}

async function buildTimeseries(
  windowStart: Date,
  windowEnd: Date,
  tier?: PremiumTier
): Promise<PremiumConversionTimeseriesPoint[]> {
  const buckets = initialiseTimeseriesBuckets(windowStart, windowEnd);

  const events = await prisma.premiumConversionEvent.findMany({
    where: {
      eventType: { in: TIMESERIES_EVENT_TYPES },
      occurredAt: {
        gte: windowStart,
        lt: windowEnd,
      },
      ...buildTierFilter(tier),
    },
    select: { eventType: true, occurredAt: true },
  });

  for (const event of events) {
    const bucketKey = startOfDay(event.occurredAt).toISOString();
    const bucket = buckets.get(bucketKey);
    if (!bucket) {
      continue;
    }

    switch (event.eventType) {
      case PremiumConversionEventType.UPGRADE_CTA_VIEWED:
        bucket.ctaViews += 1;
        break;
      case PremiumConversionEventType.TRIAL_STARTED:
        bucket.trialStarts += 1;
        break;
      case PremiumConversionEventType.UPGRADE_CONFIRMED:
        bucket.upgrades += 1;
        break;
      case PremiumConversionEventType.PREMIUM_NEGOTIATION_COMPLETED:
        bucket.premiumCompletions += 1;
        break;
      default:
        break;
    }
  }

  return Array.from(buckets.entries())
    .sort((a, b) => (a[0] > b[0] ? 1 : -1))
    .map(([date, totals]) => ({
      date,
      totals,
      conversionRates: {
        ctaToTrial: computeRate(totals.trialStarts, totals.ctaViews),
        trialToUpgrade: computeRate(totals.upgrades, totals.trialStarts),
        upgradeToCompletion: computeRate(totals.premiumCompletions, totals.upgrades),
      },
    }));
}

export async function getPremiumConversionMetrics(
  options: MetricsOptions = {}
): Promise<PremiumConversionMetrics> {
  const { windowInDays: rawWindow = 30, tier } = options;
  const windowInDays = Math.max(7, Math.min(rawWindow, 120));
  const currentWindowEnd = new Date();
  const currentWindowStart = subDays(currentWindowEnd, windowInDays);
  const previousWindowEnd = currentWindowStart;
  const previousWindowStart = subDays(previousWindowEnd, windowInDays);

  const selectedTier = tier ?? undefined;

  const [
    currentWindow,
    previousWindow,
    currentActiveSubscribers,
    previousActiveSubscribers,
    currentTimeseries,
  ] = await Promise.all([
    aggregateConversionWindow(currentWindowStart, currentWindowEnd, selectedTier),
    aggregateConversionWindow(previousWindowStart, previousWindowEnd, selectedTier),
    countActiveSubscribersAt(currentWindowEnd, selectedTier),
    countActiveSubscribersAt(previousWindowEnd, selectedTier),
    buildTimeseries(currentWindowStart, currentWindowEnd, selectedTier),
  ]);

  return {
    window: {
      start: currentWindowStart.toISOString(),
      end: currentWindowEnd.toISOString(),
      days: windowInDays,
    },
    filter: {
      tier: selectedTier ?? 'ALL',
    },
    totals: {
      ctaViews: currentWindow.totals.ctaViews,
      trialStarts: currentWindow.totals.trialStarts,
      upgrades: currentWindow.totals.upgrades,
      premiumCompletions: currentWindow.totals.premiumCompletions,
      activeSubscribers: currentActiveSubscribers,
    },
    uniqueUsers: {
      trialStarts: currentWindow.uniqueUsers.trialStarts,
      upgrades: currentWindow.uniqueUsers.upgrades,
    },
    conversionRates: { ...currentWindow.conversionRates },
    comparison: {
      previousWindow: {
        start: previousWindowStart.toISOString(),
        end: previousWindowEnd.toISOString(),
        days: windowInDays,
      },
      previousTotals: {
        ctaViews: previousWindow.totals.ctaViews,
        trialStarts: previousWindow.totals.trialStarts,
        upgrades: previousWindow.totals.upgrades,
        premiumCompletions: previousWindow.totals.premiumCompletions,
        activeSubscribers: previousActiveSubscribers,
      },
      previousUniqueUsers: { ...previousWindow.uniqueUsers },
      previousConversionRates: { ...previousWindow.conversionRates },
      delta: {
        totals: {
          ctaViews: currentWindow.totals.ctaViews - previousWindow.totals.ctaViews,
          trialStarts: currentWindow.totals.trialStarts - previousWindow.totals.trialStarts,
          upgrades: currentWindow.totals.upgrades - previousWindow.totals.upgrades,
          premiumCompletions:
            currentWindow.totals.premiumCompletions - previousWindow.totals.premiumCompletions,
        },
        uniqueUsers: {
          trialStarts: currentWindow.uniqueUsers.trialStarts - previousWindow.uniqueUsers.trialStarts,
          upgrades: currentWindow.uniqueUsers.upgrades - previousWindow.uniqueUsers.upgrades,
        },
        conversionRates: {
          ctaToTrial: computeRateDelta(
            currentWindow.conversionRates.ctaToTrial,
            previousWindow.conversionRates.ctaToTrial
          ),
          trialToUpgrade: computeRateDelta(
            currentWindow.conversionRates.trialToUpgrade,
            previousWindow.conversionRates.trialToUpgrade
          ),
          upgradeToCompletion: computeRateDelta(
            currentWindow.conversionRates.upgradeToCompletion,
            previousWindow.conversionRates.upgradeToCompletion
          ),
        },
        activeSubscribers: currentActiveSubscribers - previousActiveSubscribers,
      },
    },
    timeseries: currentTimeseries,
  };
}
