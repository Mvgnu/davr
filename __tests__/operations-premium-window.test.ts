jest.mock('@prisma/client', () => ({
  PremiumTier: {
    PREMIUM: 'PREMIUM',
    CONCIERGE: 'CONCIERGE',
  },
}));

import { parsePremiumTierParam, parsePremiumWindowParam } from '@/lib/premium/params';

describe('parsePremiumWindowParam', () => {
  it('returns default window when value is null', () => {
    expect(parsePremiumWindowParam(null)).toBe(30);
  });

  it('clamps values to minimum threshold', () => {
    expect(parsePremiumWindowParam('3')).toBe(7);
  });

  it('clamps values to maximum threshold', () => {
    expect(parsePremiumWindowParam('180')).toBe(120);
  });

  it('parses valid integers', () => {
    expect(parsePremiumWindowParam('45')).toBe(45);
  });

  it('ignores invalid numbers', () => {
    expect(parsePremiumWindowParam('abc')).toBe(30);
  });
});

describe('parsePremiumTierParam', () => {
  it('defaults to ALL when value missing', () => {
    expect(parsePremiumTierParam(null)).toBe('ALL');
  });

  it('accepts ALL keyword regardless of casing', () => {
    expect(parsePremiumTierParam('all')).toBe('ALL');
  });

  it('accepts supported premium tiers', () => {
    expect(parsePremiumTierParam('PREMIUM')).toBe('PREMIUM');
    expect(parsePremiumTierParam('concierge')).toBe('CONCIERGE');
  });

  it('falls back to ALL for unsupported values', () => {
    expect(parsePremiumTierParam('STANDARD')).toBe('ALL');
    expect(parsePremiumTierParam('invalid')).toBe('ALL');
  });
});
