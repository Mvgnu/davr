const prismaEnums = {
  PremiumTier: { STANDARD: 'STANDARD', PREMIUM: 'PREMIUM', CONCIERGE: 'CONCIERGE' },
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
const { deriveNegotiationPremiumTier } = require('@/lib/premium/entitlements');

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
