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
import { createPremiumCheckoutSession, StripeConfigurationError } from '@/lib/premium/payments/stripe';
import { prisma } from '@/lib/db/prisma';

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

  try {
    let profile;
    let checkoutSession: { url: string; id: string } | null = null;

    switch (action) {
      case 'UPGRADE_CTA_VIEWED': {
        await recordPremiumConversionEvent({
          userId: session.user.id,
          negotiationId,
          eventType: PremiumConversionEventType.UPGRADE_CTA_VIEWED,
          tier: tier ?? PremiumTier.PREMIUM,
        });
        profile = await getPremiumProfileForUser(session.user.id);
        break;
      }
      case 'START_TRIAL': {
        const resolvedTier = tier ?? PremiumTier.PREMIUM;
        const [userRecord, existingSubscription] = await Promise.all([
          prisma.user.findUnique({ where: { id: session.user.id }, select: { email: true, name: true } }),
          prisma.premiumSubscription.findFirst({
            where: { userId: session.user.id },
            orderBy: { startedAt: 'desc' },
          }),
        ]);
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
        const trialDays = Number.parseInt(process.env.PREMIUM_STRIPE_TRIAL_DAYS ?? '14', 10);
        const checkout = await createPremiumCheckoutSession({
          userId: session.user.id,
          tier: resolvedTier,
          email: userRecord?.email,
          name: userRecord?.name,
          mode: 'START_TRIAL',
          successUrl: `${baseUrl}/admin/deals/operations?upgrade=success&session_id={CHECKOUT_SESSION_ID}`,
          cancelUrl: `${baseUrl}/admin/deals/operations?upgrade=cancelled`,
          existingCustomerId: existingSubscription?.stripeCustomerId,
          trialPeriodDays: Number.isNaN(trialDays) ? undefined : trialDays,
          metadata: negotiationId ? { negotiationId } : undefined,
        });
        profile = await upsertPremiumSubscription({
          userId: session.user.id,
          tier: resolvedTier,
          status: PremiumSubscriptionStatus.TRIALING,
          source: 'workspace-trial',
          billing: {
            stripeCustomerId: checkout.customerId,
            stripePriceId: checkout.priceId,
            checkoutSessionId: checkout.sessionId,
          },
        });
        checkoutSession = { url: checkout.url, id: checkout.sessionId };
        await recordPremiumConversionEvent({
          userId: session.user.id,
          negotiationId,
          eventType: PremiumConversionEventType.TRIAL_STARTED,
          tier: resolvedTier,
        });
        break;
      }
      case 'UPGRADE_CONFIRMED': {
        const resolvedTier = tier ?? PremiumTier.PREMIUM;
        const [userRecord, existingSubscription] = await Promise.all([
          prisma.user.findUnique({ where: { id: session.user.id }, select: { email: true, name: true } }),
          prisma.premiumSubscription.findFirst({
            where: { userId: session.user.id },
            orderBy: { startedAt: 'desc' },
          }),
        ]);
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
        const checkout = await createPremiumCheckoutSession({
          userId: session.user.id,
          tier: resolvedTier,
          email: userRecord?.email,
          name: userRecord?.name,
          mode: 'UPGRADE_CONFIRMED',
          successUrl: `${baseUrl}/admin/deals/operations?upgrade=success&session_id={CHECKOUT_SESSION_ID}`,
          cancelUrl: `${baseUrl}/admin/deals/operations?upgrade=cancelled`,
          existingCustomerId: existingSubscription?.stripeCustomerId,
          metadata: negotiationId ? { negotiationId } : undefined,
        });
        profile = await upsertPremiumSubscription({
          userId: session.user.id,
          tier: resolvedTier,
          status: PremiumSubscriptionStatus.ACTIVE,
          source: 'workspace-upgrade',
          billing: {
            stripeCustomerId: checkout.customerId,
            stripePriceId: checkout.priceId,
            checkoutSessionId: checkout.sessionId,
          },
        });
        checkoutSession = { url: checkout.url, id: checkout.sessionId };
        await recordPremiumConversionEvent({
          userId: session.user.id,
          negotiationId,
          eventType: PremiumConversionEventType.UPGRADE_CONFIRMED,
          tier: resolvedTier,
        });
        break;
      }
      default: {
        profile = await getPremiumProfileForUser(session.user.id);
      }
    }
    return NextResponse.json({ profile, checkoutSession });
  } catch (error) {
    if (error instanceof StripeConfigurationError) {
      return NextResponse.json({ error: 'PAYMENT_PROVIDER_UNAVAILABLE', message: error.message }, { status: 503 });
    }
    console.error('[premium-subscription]', error);
    return NextResponse.json({ error: 'UPGRADE_PROCESSING_FAILED' }, { status: 500 });
  }
}

