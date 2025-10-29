/**
 * meta: module=premium-params version=0.2 owner=platform
 * Helpers for parsing monetisation-related query parameters.
 */
import { PremiumTier } from '@prisma/client';
export function parsePremiumWindowParam(value: string | null): number {
  if (!value) {
    return 30;
  }

  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed)) {
    return 30;
  }

  return Math.min(120, Math.max(7, parsed));
}

export function parsePremiumTierParam(value: string | null): PremiumTier | 'ALL' {
  if (!value) {
    return 'ALL';
  }

  const normalised = value.toUpperCase();
  if (normalised === 'ALL') {
    return 'ALL';
  }

  if (normalised === PremiumTier.PREMIUM || normalised === PremiumTier.CONCIERGE) {
    return normalised as PremiumTier;
  }

  return 'ALL';
}
