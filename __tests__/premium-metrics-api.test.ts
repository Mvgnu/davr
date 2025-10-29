jest.mock('@prisma/client', () => ({
  PremiumTier: {
    PREMIUM: 'PREMIUM',
    CONCIERGE: 'CONCIERGE',
  },
}));

import { NextRequest } from 'next/server';

describe('premium metrics route', () => {
  const getServerSessionMock = jest.fn();
  const getPremiumConversionMetricsMock = jest.fn();

  function setup() {
    jest.doMock('next-auth/next', () => ({ getServerSession: getServerSessionMock }));
    jest.doMock('@/lib/premium/metrics', () => ({
      getPremiumConversionMetrics: getPremiumConversionMetricsMock,
    }));
  }

  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    getServerSessionMock.mockReset();
    getPremiumConversionMetricsMock.mockReset();
    setup();
  });

  it('rejects non-admin requests', async () => {
    getServerSessionMock.mockResolvedValue({ user: { id: 'user-1', role: 'USER', isAdmin: false } });
    const { GET } = await import('@/app/api/marketplace/premium/metrics/route');
    const request = new NextRequest('http://localhost/api/marketplace/premium/metrics');

    const response = await GET(request);
    expect(response.status).toBe(403);
    expect(getPremiumConversionMetricsMock).not.toHaveBeenCalled();
  });

  it('validates query parameters', async () => {
    getServerSessionMock.mockResolvedValue({ user: { id: 'admin-1', role: 'ADMIN', isAdmin: true } });
    const { GET } = await import('@/app/api/marketplace/premium/metrics/route');
    const request = new NextRequest('http://localhost/api/marketplace/premium/metrics?windowDays=abc');

    const response = await GET(request);
    expect(response.status).toBe(400);
  });

  it('returns metrics for valid admin requests', async () => {
    getServerSessionMock.mockResolvedValue({ user: { id: 'admin-1', role: 'ADMIN', isAdmin: true } });
    getPremiumConversionMetricsMock.mockResolvedValue({
      window: { days: 30 },
      filter: { tier: 'ALL' },
      totals: { ctaViews: 10, trialStarts: 5, upgrades: 2, premiumCompletions: 1, activeSubscribers: 4 },
      uniqueUsers: { trialStarts: 3, upgrades: 2 },
      conversionRates: { ctaToTrial: 0.5, trialToUpgrade: 0.4, upgradeToCompletion: 0.5 },
      comparison: {
        previousWindow: { days: 30, start: '2025-09-01T00:00:00.000Z', end: '2025-10-01T00:00:00.000Z' },
        previousTotals: {
          ctaViews: 8,
          trialStarts: 4,
          upgrades: 2,
          premiumCompletions: 1,
          activeSubscribers: 3,
        },
        previousUniqueUsers: { trialStarts: 2, upgrades: 1 },
        previousConversionRates: { ctaToTrial: 0.5, trialToUpgrade: 0.5, upgradeToCompletion: 0.5 },
        delta: {
          totals: { ctaViews: 2, trialStarts: 1, upgrades: 0, premiumCompletions: 0 },
          uniqueUsers: { trialStarts: 1, upgrades: 1 },
          conversionRates: { ctaToTrial: 0, trialToUpgrade: -0.1, upgradeToCompletion: 0 },
          activeSubscribers: 1,
        },
      },
      timeseries: [
        {
          date: '2025-09-30T00:00:00.000Z',
          totals: { ctaViews: 2, trialStarts: 1, upgrades: 0, premiumCompletions: 0 },
          conversionRates: { ctaToTrial: 0.5, trialToUpgrade: null, upgradeToCompletion: null },
        },
      ],
    });

    const { GET } = await import('@/app/api/marketplace/premium/metrics/route');
    const request = new NextRequest('http://localhost/api/marketplace/premium/metrics?windowDays=45');

    const response = await GET(request);
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(getPremiumConversionMetricsMock).toHaveBeenCalledWith({ windowInDays: 45, tier: undefined });
    expect(payload).toEqual({
      metrics: {
        window: { days: 30 },
        filter: { tier: 'ALL' },
        totals: { ctaViews: 10, trialStarts: 5, upgrades: 2, premiumCompletions: 1, activeSubscribers: 4 },
        uniqueUsers: { trialStarts: 3, upgrades: 2 },
        conversionRates: { ctaToTrial: 0.5, trialToUpgrade: 0.4, upgradeToCompletion: 0.5 },
        comparison: {
          previousWindow: { days: 30, start: '2025-09-01T00:00:00.000Z', end: '2025-10-01T00:00:00.000Z' },
          previousTotals: {
            ctaViews: 8,
            trialStarts: 4,
            upgrades: 2,
            premiumCompletions: 1,
            activeSubscribers: 3,
          },
          previousUniqueUsers: { trialStarts: 2, upgrades: 1 },
          previousConversionRates: { ctaToTrial: 0.5, trialToUpgrade: 0.5, upgradeToCompletion: 0.5 },
          delta: {
            totals: { ctaViews: 2, trialStarts: 1, upgrades: 0, premiumCompletions: 0 },
            uniqueUsers: { trialStarts: 1, upgrades: 1 },
            conversionRates: { ctaToTrial: 0, trialToUpgrade: -0.1, upgradeToCompletion: 0 },
            activeSubscribers: 1,
          },
        },
        timeseries: [
          {
            date: '2025-09-30T00:00:00.000Z',
            totals: { ctaViews: 2, trialStarts: 1, upgrades: 0, premiumCompletions: 0 },
            conversionRates: { ctaToTrial: 0.5, trialToUpgrade: null, upgradeToCompletion: null },
          },
        ],
      },
    });
  });

  it('passes tier filter when provided', async () => {
    getServerSessionMock.mockResolvedValue({ user: { id: 'admin-1', role: 'ADMIN', isAdmin: true } });
    getPremiumConversionMetricsMock.mockResolvedValue({
      window: { days: 30 },
      filter: { tier: 'PREMIUM' },
      totals: { ctaViews: 0, trialStarts: 0, upgrades: 0, premiumCompletions: 0, activeSubscribers: 0 },
      uniqueUsers: { trialStarts: 0, upgrades: 0 },
      conversionRates: { ctaToTrial: null, trialToUpgrade: null, upgradeToCompletion: null },
      comparison: {
        previousWindow: { days: 30, start: '2025-09-01T00:00:00.000Z', end: '2025-10-01T00:00:00.000Z' },
        previousTotals: {
          ctaViews: 0,
          trialStarts: 0,
          upgrades: 0,
          premiumCompletions: 0,
          activeSubscribers: 0,
        },
        previousUniqueUsers: { trialStarts: 0, upgrades: 0 },
        previousConversionRates: { ctaToTrial: null, trialToUpgrade: null, upgradeToCompletion: null },
        delta: {
          totals: { ctaViews: 0, trialStarts: 0, upgrades: 0, premiumCompletions: 0 },
          uniqueUsers: { trialStarts: 0, upgrades: 0 },
          conversionRates: { ctaToTrial: null, trialToUpgrade: null, upgradeToCompletion: null },
          activeSubscribers: 0,
        },
      },
      timeseries: [],
    });

    const { GET } = await import('@/app/api/marketplace/premium/metrics/route');
    const request = new NextRequest('http://localhost/api/marketplace/premium/metrics?tier=PREMIUM');

    const response = await GET(request);
    expect(response.status).toBe(200);
    expect(getPremiumConversionMetricsMock).toHaveBeenCalledWith({ windowInDays: undefined, tier: 'PREMIUM' });
  });
});
