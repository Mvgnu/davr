/**
 * meta: module=premium-entitlements version=0.1 owner=platform
 */
import {
  PremiumConversionEventType,
  PremiumFeature,
  PremiumSubscriptionStatus,
  PremiumTier,
  type PremiumEntitlement as PremiumEntitlementModel,
  type PremiumSubscription as PremiumSubscriptionModel,
  type Prisma,
} from '@prisma/client';

import { prisma } from '@/lib/db/prisma';

const DEFAULT_ENTITLEMENTS: Record<PremiumTier, PremiumFeature[]> = {
  [PremiumTier.STANDARD]: [],
  [PremiumTier.PREMIUM]: [PremiumFeature.ADVANCED_ANALYTICS, PremiumFeature.DISPUTE_FAST_TRACK],
  [PremiumTier.CONCIERGE]: [
    PremiumFeature.ADVANCED_ANALYTICS,
    PremiumFeature.DISPUTE_FAST_TRACK,
    PremiumFeature.CONCIERGE_SLA,
  ],
};

export interface PremiumProfile {
  tier: PremiumTier | 'STANDARD';
  status: PremiumSubscriptionStatus | 'NONE';
  entitlements: PremiumFeature[];
  currentPeriodEndsAt?: string | null;
  isTrialing: boolean;
  hasAdvancedAnalytics: boolean;
  hasConciergeSla: boolean;
  hasDisputeFastTrack: boolean;
  upgradePrompt?: {
    headline: string;
    description: string;
    cta: string;
  } | null;
}

function normaliseEntitlements(
  tier: PremiumTier | 'STANDARD',
  entitlements: PremiumEntitlementModel[]
): PremiumFeature[] {
  const defaults = tier === 'STANDARD' ? DEFAULT_ENTITLEMENTS[PremiumTier.STANDARD] : DEFAULT_ENTITLEMENTS[tier];
  const merged = new Set<PremiumFeature>(defaults);
  for (const entitlement of entitlements) {
    merged.add(entitlement.feature);
  }
  return Array.from(merged);
}

export async function getPremiumProfileForUser(
  userId: string,
  client: Prisma.TransactionClient | typeof prisma = prisma
): Promise<PremiumProfile> {
  const subscription = await client.premiumSubscription.findFirst({
    where: {
      userId,
      status: { in: [PremiumSubscriptionStatus.ACTIVE, PremiumSubscriptionStatus.TRIALING] },
    },
    include: { entitlements: true },
    orderBy: { startedAt: 'desc' },
  });

  if (!subscription) {
    return {
      tier: 'STANDARD',
      status: 'NONE',
      entitlements: [],
      currentPeriodEndsAt: null,
      isTrialing: false,
      hasAdvancedAnalytics: false,
      hasConciergeSla: false,
      hasDisputeFastTrack: false,
      upgradePrompt: {
        headline: 'Premium-Analytics freischalten',
        description:
          'Sichern Sie sich SLA-Overrides und Dispute-Fast-Track, um kritische Deals schneller abzuschließen.',
        cta: 'Jetzt Premium testen',
      },
    };
  }

  const entitlements = normaliseEntitlements(subscription.tier, subscription.entitlements);
  const profile: PremiumProfile = {
    tier: subscription.tier,
    status: subscription.status,
    entitlements,
    currentPeriodEndsAt: subscription.currentPeriodEndsAt?.toISOString() ?? null,
    isTrialing: subscription.status === PremiumSubscriptionStatus.TRIALING,
    hasAdvancedAnalytics: entitlements.includes(PremiumFeature.ADVANCED_ANALYTICS),
    hasConciergeSla: entitlements.includes(PremiumFeature.CONCIERGE_SLA),
    hasDisputeFastTrack: entitlements.includes(PremiumFeature.DISPUTE_FAST_TRACK),
    upgradePrompt: null,
  };

  return profile;
}

async function ensureDefaultEntitlements(
  subscription: PremiumSubscriptionModel,
  entitlements: PremiumEntitlementModel[],
  client: Prisma.TransactionClient | typeof prisma
) {
  const expected = new Set(DEFAULT_ENTITLEMENTS[subscription.tier]);
  if (expected.size === 0) {
    return;
  }

  const existing = new Set(entitlements.map((item) => item.feature));
  const missing = Array.from(expected).filter((feature) => !existing.has(feature));
  if (missing.length === 0) {
    return;
  }

  await client.premiumEntitlement.createMany({
    data: missing.map((feature) => ({ subscriptionId: subscription.id, feature })),
    skipDuplicates: true,
  });
}

export interface SubscriptionUpsertInput {
  userId: string;
  tier: PremiumTier;
  status?: PremiumSubscriptionStatus;
  source?: string;
}

export async function upsertPremiumSubscription({
  userId,
  tier,
  status = PremiumSubscriptionStatus.ACTIVE,
  source,
}: SubscriptionUpsertInput): Promise<PremiumProfile> {
  const result = await prisma.$transaction(async (tx) => {
    const existing = await tx.premiumSubscription.findFirst({
      where: { userId },
      orderBy: { startedAt: 'desc' },
    });

    let subscription: PremiumSubscriptionModel;
    const defaultPeriodEnd = existing?.currentPeriodEndsAt ?? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    if (existing) {
      subscription = await tx.premiumSubscription.update({
        where: { id: existing.id },
        data: {
          tier,
          status,
          currentPeriodEndsAt:
            status === PremiumSubscriptionStatus.CANCELED ? existing.currentPeriodEndsAt ?? defaultPeriodEnd : defaultPeriodEnd,
          cancellationRequestedAt: status === PremiumSubscriptionStatus.CANCELED ? new Date() : existing.cancellationRequestedAt,
          metadata: source ? { ...(existing.metadata as Record<string, unknown> | null ?? {}), source } : existing.metadata,
        },
        include: { entitlements: true },
      });
    } else {
      subscription = await tx.premiumSubscription.create({
        data: {
          userId,
          tier,
          status,
          currentPeriodEndsAt: defaultPeriodEnd,
          metadata: source ? { source } : undefined,
        },
        include: { entitlements: true },
      });
    }

    await ensureDefaultEntitlements(subscription, subscription.entitlements, tx);

    const profile = await getPremiumProfileForUser(userId, tx);
    return profile;
  });

  return result;
}

export interface ConversionEventInput {
  userId?: string;
  negotiationId?: string;
  eventType: PremiumConversionEventType;
  tier?: PremiumTier;
  metadata?: Record<string, unknown>;
}

export async function recordPremiumConversionEvent(input: ConversionEventInput) {
  const metadata = {
    ...(input.metadata ?? {}),
    ...(input.tier ? { tier: input.tier } : {}),
  };

  await prisma.premiumConversionEvent.create({
    data: {
      userId: input.userId,
      negotiationId: input.negotiationId,
      eventType: input.eventType,
      metadata: Object.keys(metadata).length > 0 ? metadata : null,
    },
  });
}

export function deriveNegotiationPremiumTier(options: {
  listingIsPremium: boolean;
  buyerTier: PremiumTier | 'STANDARD';
  sellerTier?: PremiumTier | 'STANDARD' | null;
}): PremiumTier | null {
  if (options.listingIsPremium) {
    return PremiumTier.PREMIUM;
  }

  if (options.buyerTier !== 'STANDARD') {
    return options.buyerTier;
  }

  if (options.sellerTier && options.sellerTier !== 'STANDARD') {
    return options.sellerTier;
  }

  return null;
}
