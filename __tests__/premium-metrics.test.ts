const premiumConversionEventCount = jest.fn();
const premiumConversionEventFindMany = jest.fn();
const premiumSubscriptionCount = jest.fn();

jest.mock('@prisma/client', () => ({
  PremiumConversionEventType: {
    UPGRADE_CTA_VIEWED: 'UPGRADE_CTA_VIEWED',
    TRIAL_STARTED: 'TRIAL_STARTED',
    UPGRADE_CONFIRMED: 'UPGRADE_CONFIRMED',
    PREMIUM_NEGOTIATION_COMPLETED: 'PREMIUM_NEGOTIATION_COMPLETED',
  },
  PremiumSubscriptionStatus: {
    ACTIVE: 'ACTIVE',
    TRIALING: 'TRIALING',
  },
  PremiumTier: {
    PREMIUM: 'PREMIUM',
    CONCIERGE: 'CONCIERGE',
  },
}), { virtual: true });

jest.mock('@/lib/db/prisma', () => ({
  prisma: {
    premiumConversionEvent: {
      count: premiumConversionEventCount,
      findMany: premiumConversionEventFindMany,
    },
    premiumSubscription: {
      count: premiumSubscriptionCount,
    },
  },
}));

describe('getPremiumConversionMetrics', () => {
  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    premiumConversionEventCount.mockReset();
    premiumConversionEventFindMany.mockReset();
    premiumSubscriptionCount.mockReset();
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2025-10-30T00:00:00Z'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('aggregates totals, unique users, conversion rates, and period deltas', async () => {
    const now = new Date('2025-10-30T00:00:00Z');
    const dayMs = 24 * 60 * 60 * 1000;
    const windowMs = 45 * dayMs;
    const currentWindowStartTime = now.getTime() - windowMs;
    const previousWindowStartTime = currentWindowStartTime - windowMs;

    premiumConversionEventCount.mockImplementation(({ where }) => {
      const windowStart = where?.occurredAt?.gte as Date | undefined;
      if (!windowStart) {
        return Promise.resolve(0);
      }

      const windowStartTime = windowStart.getTime();
      const isCurrentWindow = windowStartTime === currentWindowStartTime;

      switch (where?.eventType) {
        case 'UPGRADE_CTA_VIEWED':
          return Promise.resolve(isCurrentWindow ? 40 : 32);
        case 'TRIAL_STARTED':
          return Promise.resolve(isCurrentWindow ? 16 : 12);
        case 'UPGRADE_CONFIRMED':
          return Promise.resolve(isCurrentWindow ? 8 : 6);
        case 'PREMIUM_NEGOTIATION_COMPLETED':
          return Promise.resolve(isCurrentWindow ? 6 : 4);
        default:
          return Promise.resolve(0);
      }
    });
    premiumConversionEventFindMany.mockImplementation(({ where, select }) => {
      const windowStart = where?.occurredAt?.gte as Date | undefined;
      const windowStartTime = windowStart?.getTime();
      const isCurrentWindow = windowStartTime === currentWindowStartTime;
      const isPreviousWindow = windowStartTime === previousWindowStartTime;

      if (select?.eventType && Array.isArray(where?.eventType?.in)) {
        return Promise.resolve(
          isCurrentWindow
            ? [
                { eventType: 'UPGRADE_CTA_VIEWED', occurredAt: new Date('2025-10-25T09:00:00Z') },
                { eventType: 'UPGRADE_CTA_VIEWED', occurredAt: new Date('2025-10-28T09:00:00Z') },
                { eventType: 'TRIAL_STARTED', occurredAt: new Date('2025-10-28T10:00:00Z') },
                { eventType: 'UPGRADE_CONFIRMED', occurredAt: new Date('2025-10-29T12:30:00Z') },
                { eventType: 'PREMIUM_NEGOTIATION_COMPLETED', occurredAt: new Date('2025-10-29T18:45:00Z') },
              ]
            : []
        );
      }

      if (where?.eventType === 'TRIAL_STARTED') {
        return Promise.resolve(
          isCurrentWindow
            ? [{ userId: 'user-1' }, { userId: 'user-2' }, { userId: 'user-2' }]
            : isPreviousWindow
            ? [{ userId: 'user-1' }, { userId: 'user-3' }]
            : []
        );
      }
      if (where?.eventType === 'UPGRADE_CONFIRMED') {
        return Promise.resolve(
          isCurrentWindow
            ? [{ userId: 'user-1' }, { userId: 'user-3' }]
            : isPreviousWindow
            ? [{ userId: 'user-3' }]
            : []
        );
      }
      return Promise.resolve([]);
    });
    premiumSubscriptionCount.mockResolvedValueOnce(12).mockResolvedValueOnce(9);

    const { getPremiumConversionMetrics } = await import('@/lib/premium/metrics');
    const metrics = await getPremiumConversionMetrics({ windowInDays: 45 });

    expect(premiumConversionEventCount).toHaveBeenCalledTimes(8);
    expect(premiumConversionEventFindMany).toHaveBeenCalledTimes(5);
    expect(metrics.filter.tier).toBe('ALL');
    expect(metrics.window.days).toBe(45);
    expect(metrics.totals).toMatchObject({
      ctaViews: 40,
      trialStarts: 16,
      upgrades: 8,
      premiumCompletions: 6,
      activeSubscribers: 12,
    });
    expect(metrics.uniqueUsers).toEqual({ trialStarts: 2, upgrades: 2 });
    expect(metrics.conversionRates).toEqual({
      ctaToTrial: 0.4,
      trialToUpgrade: 0.5,
      upgradeToCompletion: 0.75,
    });
    expect(metrics.comparison.previousTotals).toEqual({
      ctaViews: 32,
      trialStarts: 12,
      upgrades: 6,
      premiumCompletions: 4,
      activeSubscribers: 9,
    });
    expect(metrics.comparison.previousUniqueUsers).toEqual({ trialStarts: 2, upgrades: 1 });
    expect(metrics.comparison.previousConversionRates).toEqual({
      ctaToTrial: 0.375,
      trialToUpgrade: 0.5,
      upgradeToCompletion: 0.6667,
    });
    expect(metrics.comparison.delta.totals).toEqual({
      ctaViews: 8,
      trialStarts: 4,
      upgrades: 2,
      premiumCompletions: 2,
    });
    expect(metrics.comparison.delta.uniqueUsers).toEqual({ trialStarts: 0, upgrades: 1 });
    expect(metrics.comparison.delta.conversionRates).toEqual({
      ctaToTrial: 0.025,
      trialToUpgrade: 0,
      upgradeToCompletion: 0.0833,
    });
    expect(metrics.comparison.delta.activeSubscribers).toBe(3);
    expect(metrics.timeseries.length).toBe(45);
    const lastEntry = metrics.timeseries[metrics.timeseries.length - 1];
    expect(lastEntry.totals).toEqual({
      ctaViews: 0,
      trialStarts: 0,
      upgrades: 1,
      premiumCompletions: 1,
    });
    expect(lastEntry.conversionRates).toEqual({
      ctaToTrial: null,
      trialToUpgrade: null,
      upgradeToCompletion: 1,
    });
  });

  it('guards against division by zero and clamps window bounds', async () => {
    premiumConversionEventCount.mockResolvedValue(0);
    premiumConversionEventFindMany.mockResolvedValue([]);
    premiumSubscriptionCount.mockResolvedValue(0);

    const { getPremiumConversionMetrics } = await import('@/lib/premium/metrics');
    const metrics = await getPremiumConversionMetrics({ windowInDays: 3 });

    expect(metrics.window.days).toBe(7);
    expect(metrics.conversionRates).toEqual({
      ctaToTrial: null,
      trialToUpgrade: null,
      upgradeToCompletion: null,
    });
    expect(metrics.timeseries.length).toBeGreaterThan(0);
    expect(metrics.timeseries.every((entry) => entry.totals.ctaViews === 0)).toBe(true);
  });

  it('applies tier filters when provided', async () => {
    premiumConversionEventCount.mockResolvedValue(0);
    premiumConversionEventFindMany.mockResolvedValue([]);
    premiumSubscriptionCount.mockResolvedValue(0);

    const { getPremiumConversionMetrics } = await import('@/lib/premium/metrics');
    const metrics = await getPremiumConversionMetrics({ windowInDays: 30, tier: 'CONCIERGE' });

    const [firstCall] = premiumConversionEventCount.mock.calls;
    expect(firstCall[0]?.where?.OR).toEqual([{ metadata: { path: ['tier'], equals: 'CONCIERGE' } }]);
    expect(metrics.filter.tier).toBe('CONCIERGE');
    const timeseriesCall = premiumConversionEventFindMany.mock.calls.find(
      ([args]) => Array.isArray(args?.where?.eventType?.in)
    );
    expect(timeseriesCall?.[0]?.where?.OR).toEqual([{ metadata: { path: ['tier'], equals: 'CONCIERGE' } }]);
  });
});
