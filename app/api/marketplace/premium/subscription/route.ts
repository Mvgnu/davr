import { NextResponse, type NextRequest } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { PremiumConversionEventType, PremiumSubscriptionStatus, PremiumTier } from '@prisma/client';
import { z } from 'zod';

import { authOptions } from '@/lib/auth/options';
import {
  getPremiumProfileForUser,
  recordPremiumConversionEvent,
  upsertPremiumSubscription,
} from '@/lib/premium/entitlements';

/**
 * meta: route=premium-subscription version=0.1 owner=platform
 */
const ACTION_SCHEMA = z.object({
  action: z.enum(['UPGRADE_CTA_VIEWED', 'START_TRIAL', 'UPGRADE_CONFIRMED']),
  tier: z.nativeEnum(PremiumTier).optional(),
  negotiationId: z.string().optional(),
});

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'UNAUTHENTICATED' }, { status: 401 });
  }

  const profile = await getPremiumProfileForUser(session.user.id);
  return NextResponse.json({ profile });
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'UNAUTHENTICATED' }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const parsed = ACTION_SCHEMA.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'VALIDATION_ERROR', details: parsed.error.flatten() }, { status: 400 });
  }

  const { action, tier, negotiationId } = parsed.data;
  let profile;

  switch (action) {
    case 'UPGRADE_CTA_VIEWED':
      await recordPremiumConversionEvent({
        userId: session.user.id,
        negotiationId,
        eventType: PremiumConversionEventType.UPGRADE_CTA_VIEWED,
        tier: tier ?? PremiumTier.PREMIUM,
      });
      profile = await getPremiumProfileForUser(session.user.id);
      break;
    case 'START_TRIAL':
      profile = await upsertPremiumSubscription({
        userId: session.user.id,
        tier: tier ?? PremiumTier.PREMIUM,
        status: PremiumSubscriptionStatus.TRIALING,
        source: 'workspace-trial',
      });
      await recordPremiumConversionEvent({
        userId: session.user.id,
        negotiationId,
        eventType: PremiumConversionEventType.TRIAL_STARTED,
        tier: tier ?? PremiumTier.PREMIUM,
      });
      break;
    case 'UPGRADE_CONFIRMED':
      profile = await upsertPremiumSubscription({
        userId: session.user.id,
        tier: tier ?? PremiumTier.PREMIUM,
        status: PremiumSubscriptionStatus.ACTIVE,
        source: 'workspace-upgrade',
      });
      await recordPremiumConversionEvent({
        userId: session.user.id,
        negotiationId,
        eventType: PremiumConversionEventType.UPGRADE_CONFIRMED,
        tier: tier ?? PremiumTier.PREMIUM,
      });
      break;
    default:
      profile = await getPremiumProfileForUser(session.user.id);
  }

  return NextResponse.json({ profile });
}
