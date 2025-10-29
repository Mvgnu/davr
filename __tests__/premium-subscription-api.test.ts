import { NextRequest } from 'next/server';

describe('premium subscription route', () => {
  const getServerSessionMock = jest.fn();
  const getPremiumProfileForUserMock = jest.fn();
  const recordPremiumConversionEventMock = jest.fn();
  const upsertPremiumSubscriptionMock = jest.fn();

  function setupMocks() {
    jest.doMock('@prisma/client', () => ({
      __esModule: true,
      PremiumConversionEventType: {
        UPGRADE_CTA_VIEWED: 'UPGRADE_CTA_VIEWED',
        TRIAL_STARTED: 'TRIAL_STARTED',
        UPGRADE_CONFIRMED: 'UPGRADE_CONFIRMED',
      },
      PremiumSubscriptionStatus: {
        ACTIVE: 'ACTIVE',
        TRIALING: 'TRIALING',
      },
      PremiumTier: {
        STANDARD: 'STANDARD',
        PREMIUM: 'PREMIUM',
        CONCIERGE: 'CONCIERGE',
      },
    }));
    jest.doMock('next-auth/next', () => ({ getServerSession: getServerSessionMock }));
    jest.doMock('@/lib/premium/entitlements', () => ({
      getPremiumProfileForUser: getPremiumProfileForUserMock,
      recordPremiumConversionEvent: recordPremiumConversionEventMock,
      upsertPremiumSubscription: upsertPremiumSubscriptionMock,
    }));
  }

  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    getServerSessionMock.mockReset();
    getPremiumProfileForUserMock.mockReset();
    recordPremiumConversionEventMock.mockReset();
    upsertPremiumSubscriptionMock.mockReset();
    setupMocks();
  });

  it('rejects unauthenticated GET', async () => {
    getServerSessionMock.mockResolvedValue(null);
    const { GET } = await import('@/app/api/marketplace/premium/subscription/route');
    const response = await GET();

    expect(response.status).toBe(401);
  });

  it('returns premium profile for authenticated GET', async () => {
    getServerSessionMock.mockResolvedValue({ user: { id: 'user-1' } });
    getPremiumProfileForUserMock.mockResolvedValue({ tier: 'PREMIUM' });

    const { GET } = await import('@/app/api/marketplace/premium/subscription/route');
    const response = await GET();
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload).toEqual({ profile: { tier: 'PREMIUM' } });
  });

  it('validates POST payload', async () => {
    getServerSessionMock.mockResolvedValue({ user: { id: 'user-1' } });

    const { POST } = await import('@/app/api/marketplace/premium/subscription/route');
    const request = new NextRequest('http://localhost', {
      method: 'POST',
      body: JSON.stringify({ action: 'INVALID' }),
      headers: { 'Content-Type': 'application/json' },
    });

    const response = await POST(request);
    expect(response.status).toBe(400);
  });

  it('starts trial and records conversion events', async () => {
    getServerSessionMock.mockResolvedValue({ user: { id: 'user-2' } });
    upsertPremiumSubscriptionMock.mockResolvedValue({ tier: 'PREMIUM' });

    const { POST } = await import('@/app/api/marketplace/premium/subscription/route');
    const request = new NextRequest('http://localhost', {
      method: 'POST',
      body: JSON.stringify({ action: 'START_TRIAL', tier: 'PREMIUM', negotiationId: 'neg-1' }),
      headers: { 'Content-Type': 'application/json' },
    });

    const response = await POST(request);
    const payload = await response.json();

    expect(upsertPremiumSubscriptionMock).toHaveBeenCalledWith({
      userId: 'user-2',
      tier: 'PREMIUM',
      status: 'TRIALING',
      source: 'workspace-trial',
    });
    expect(recordPremiumConversionEventMock).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'user-2',
        negotiationId: 'neg-1',
        eventType: 'TRIAL_STARTED',
        tier: 'PREMIUM',
      })
    );
    expect(response.status).toBe(200);
    expect(payload).toEqual({ profile: { tier: 'PREMIUM' } });
  });
});
