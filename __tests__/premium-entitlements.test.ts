const prismaEnums = {
  PremiumTier: { STANDARD: 'STANDARD', PREMIUM: 'PREMIUM', CONCIERGE: 'CONCIERGE' },
  PremiumSubscriptionStatus: { TRIALING: 'TRIALING', ACTIVE: 'ACTIVE', CANCELED: 'CANCELED', EXPIRED: 'EXPIRED' },
  PremiumFeature: {
    ADVANCED_ANALYTICS: 'ADVANCED_ANALYTICS',
    DISPUTE_FAST_TRACK: 'DISPUTE_FAST_TRACK',
    CONCIERGE_SLA: 'CONCIERGE_SLA',
  },
};

jest.mock('@prisma/client', () => prismaEnums, { virtual: true });
jest.mock('@/lib/db/prisma', () => ({ prisma: {} }), { virtual: true });

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { PremiumTier } = require('@prisma/client');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { deriveNegotiationPremiumTier, resolvePremiumLifecycleState, applyPremiumLifecyclePatch } = require(
  '@/lib/premium/entitlements'
);

describe('deriveNegotiationPremiumTier', () => {
  it('prefers listing premium flag', () => {
    const tier = deriveNegotiationPremiumTier({
      listingIsPremium: true,
      buyerTier: 'STANDARD',
      sellerTier: 'STANDARD',
    });

    expect(tier).toBe(PremiumTier.PREMIUM);
  });

  it('falls back to buyer tier when listing is standard', () => {
    const tier = deriveNegotiationPremiumTier({
      listingIsPremium: false,
      buyerTier: PremiumTier.CONCIERGE,
      sellerTier: 'STANDARD',
    });

    expect(tier).toBe(PremiumTier.CONCIERGE);
  });

  it('uses seller tier if buyer is standard and listing is standard', () => {
    const tier = deriveNegotiationPremiumTier({
      listingIsPremium: false,
      buyerTier: 'STANDARD',
      sellerTier: PremiumTier.PREMIUM,
    });

    expect(tier).toBe(PremiumTier.PREMIUM);
  });

  it('returns null when neither listing nor participants are premium', () => {
    const tier = deriveNegotiationPremiumTier({
      listingIsPremium: false,
      buyerTier: 'STANDARD',
      sellerTier: 'STANDARD',
    });

    expect(tier).toBeNull();
  });
});

describe('resolvePremiumLifecycleState', () => {
  const now = new Date('2025-01-10T10:00:00.000Z');

  it('computes seat usage and grace period flags', () => {
    const metadata = {
      premiumLifecycle: {
        seatCapacity: 5,
        seatsInUse: 6,
        gracePeriodEndsAt: '2025-01-12T10:00:00.000Z',
        dunningState: 'PAYMENT_FAILED',
        lastReminderSentAt: '2025-01-09T10:00:00.000Z',
      },
    };

    const snapshot = resolvePremiumLifecycleState({ metadata }, now);

    expect(snapshot.seatCapacity).toBe(5);
    expect(snapshot.seatsInUse).toBe(6);
    expect(snapshot.isSeatCapacityExceeded).toBe(true);
    expect(snapshot.isInGracePeriod).toBe(true);
    expect(snapshot.dunningState).toBe('PAYMENT_FAILED');
    expect(snapshot.lastReminderSentAt).toBeInstanceOf(Date);
  });

  it('derives seats available and downgrade metadata', () => {
    const metadata = {
      premiumLifecycle: {
        seatCapacity: 10,
        seatsInUse: 7,
        downgradeAt: '2025-02-01T00:00:00.000Z',
        downgradeTargetTier: 'STANDARD',
        dunningState: 'NONE',
      },
    };

    const snapshot = resolvePremiumLifecycleState({ metadata }, now);

    expect(snapshot.seatsAvailable).toBe(3);
    expect(snapshot.isSeatCapacityExceeded).toBe(false);
    expect(snapshot.isDowngradeScheduled).toBe(true);
    expect(snapshot.downgradeTargetTier).toBe('STANDARD');
  });

  it('handles missing metadata gracefully', () => {
    const snapshot = resolvePremiumLifecycleState({ metadata: null }, now);

    expect(snapshot.seatCapacity).toBeNull();
    expect(snapshot.isSeatCapacityExceeded).toBe(false);
    expect(snapshot.isInGracePeriod).toBe(false);
    expect(snapshot.dunningState).toBe('NONE');
  });
});

describe('applyPremiumLifecyclePatch', () => {
  it('merges lifecycle patch with existing metadata', () => {
    const metadata = {
      premiumLifecycle: {
        seatCapacity: 3,
        seatsInUse: 3,
      },
    };

    const patched = applyPremiumLifecyclePatch(metadata, {
      seatsInUse: 2,
      dunningState: 'PAYMENT_FAILED',
    });

    expect(patched).toMatchObject({
      premiumLifecycle: {
        seatCapacity: 3,
        seatsInUse: 2,
        dunningState: 'PAYMENT_FAILED',
      },
    });
  });
});
