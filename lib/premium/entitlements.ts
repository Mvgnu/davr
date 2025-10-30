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
import type Stripe from 'stripe';

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

const DEFAULT_UPGRADE_PROMPT = {
  headline: 'Premium-Analytics freischalten',
  description: 'Sichern Sie sich SLA-Overrides und Dispute-Fast-Track, um kritische Deals schneller abzuschließen.',
  cta: 'Jetzt Premium testen',
} as const;

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

function buildUpgradePrompt(status: PremiumSubscriptionStatus): PremiumProfile['upgradePrompt'] {
  switch (status) {
    case PremiumSubscriptionStatus.CANCELED:
      return {
        headline: 'Premium-Zugang beendet',
        description: 'Reaktivieren Sie Premium, um Analytics und Concierge-SLAs wieder freizuschalten.',
        cta: 'Premium reaktivieren',
      };
    case PremiumSubscriptionStatus.EXPIRED:
      return {
        headline: 'Premium-Zahlung erforderlich',
        description: 'Aktualisieren Sie die Zahlungsdaten, um Premium-Entitlements weiter zu nutzen.',
        cta: 'Zahlungsdaten aktualisieren',
      };
    case PremiumSubscriptionStatus.TRIALING:
      return {
        headline: 'Testphase aktiv – Upgrade empfohlen',
        description: 'Bestätigen Sie das Upgrade, um Concierge-SLA und Fast-Track nach der Testphase zu behalten.',
        cta: 'Upgrade bestätigen',
      };
    default:
      return { ...DEFAULT_UPGRADE_PROMPT };
  }
}

function mapStripeSubscriptionStatus(status: Stripe.Subscription.Status | null | undefined) {
  switch (status) {
    case 'trialing':
      return PremiumSubscriptionStatus.TRIALING;
    case 'active':
      return PremiumSubscriptionStatus.ACTIVE;
    case 'past_due':
    case 'unpaid':
    case 'incomplete':
    case 'incomplete_expired':
    case 'paused':
      return PremiumSubscriptionStatus.EXPIRED;
    case 'canceled':
      return PremiumSubscriptionStatus.CANCELED;
    default:
      return PremiumSubscriptionStatus.EXPIRED;
  }
}

function resolveStripeTimestamp(value: number | null | undefined): Date | null {
  if (!value) {
    return null;
  }

  const date = new Date(value * 1000);
  return Number.isNaN(date.getTime()) ? null : date;
}

function resolveTierFromMetadata(
  metadata: Stripe.Metadata | undefined | null,
  fallback: PremiumTier | null
): PremiumTier | null {
  const tierValue = metadata?.tier;
  if (typeof tierValue === 'string') {
    const upper = tierValue.toUpperCase();
    if (upper === 'PREMIUM' || upper === 'CONCIERGE' || upper === 'STANDARD') {
      return upper as PremiumTier;
    }
  }

  return fallback ?? null;
}

function mergeMetadata(
  existing: Prisma.JsonValue | null | undefined,
  patch: Record<string, unknown>
): Prisma.JsonValue {
  if (existing && typeof existing === 'object' && !Array.isArray(existing)) {
    return { ...(existing as Record<string, unknown>), ...patch };
  }

  return { ...patch };
}

interface SubscriptionLookupHints {
  userId?: string | null;
  stripeSubscriptionId?: string | null;
  stripeCustomerId?: string | null;
  checkoutSessionId?: string | null;
}

async function locateSubscription(
  client: Prisma.TransactionClient | typeof prisma,
  hints: SubscriptionLookupHints
): Promise<PremiumSubscriptionModel | null> {
  const searchOrder: (keyof SubscriptionLookupHints)[] = [
    'stripeSubscriptionId',
    'checkoutSessionId',
    'stripeCustomerId',
    'userId',
  ];

  for (const key of searchOrder) {
    const value = hints[key];
    if (!value) {
      continue;
    }

    const where: Prisma.PremiumSubscriptionWhereInput = {};
    (where as Record<string, unknown>)[key === 'userId' ? 'userId' : key] = value;

    const record = await client.premiumSubscription.findFirst({
      where,
      orderBy: { startedAt: 'desc' },
    });

    if (record) {
      return record;
    }
  }

  return null;
}

function toJson(value: unknown): Prisma.JsonValue {
  if (value === undefined) {
    return null;
  }

  const serialised = JSON.stringify(value);
  if (!serialised) {
    return null;
  }

  return JSON.parse(serialised) as Prisma.JsonValue;
}

const STRIPE_SUBSCRIPTION_EVENTS = new Set<Stripe.Event.Type>([
  'customer.subscription.created',
  'customer.subscription.updated',
  'customer.subscription.deleted',
  'customer.subscription.trial_will_end',
]);

const STRIPE_INVOICE_EVENTS = new Set<Stripe.Event.Type>(['invoice.paid', 'invoice.payment_failed']);

const STRIPE_CHECKOUT_EVENTS = new Set<Stripe.Event.Type>(['checkout.session.completed']);

export async function getPremiumProfileForUser(
  userId: string,
  client: Prisma.TransactionClient | typeof prisma = prisma
): Promise<PremiumProfile> {
  const subscription = await client.premiumSubscription.findFirst({
    where: {
      userId,
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
      upgradePrompt: { ...DEFAULT_UPGRADE_PROMPT },
    };
  }

  const activeStatuses = [PremiumSubscriptionStatus.ACTIVE, PremiumSubscriptionStatus.TRIALING];
  const isActive = activeStatuses.includes(subscription.status);
  const entitlements = isActive ? normaliseEntitlements(subscription.tier, subscription.entitlements) : [];
  const prompt = isActive ? null : buildUpgradePrompt(subscription.status);
  const profile: PremiumProfile = {
    tier: subscription.tier,
    status: subscription.status,
    entitlements,
    currentPeriodEndsAt: subscription.currentPeriodEndsAt?.toISOString() ?? null,
    isTrialing: subscription.status === PremiumSubscriptionStatus.TRIALING,
    hasAdvancedAnalytics: isActive && entitlements.includes(PremiumFeature.ADVANCED_ANALYTICS),
    hasConciergeSla: isActive && entitlements.includes(PremiumFeature.CONCIERGE_SLA),
    hasDisputeFastTrack: isActive && entitlements.includes(PremiumFeature.DISPUTE_FAST_TRACK),
    upgradePrompt: prompt,
  };

  return profile;
}

async function ensureDefaultEntitlements(
  subscription: PremiumSubscriptionModel,
  entitlements: PremiumEntitlementModel[] | null,
  client: Prisma.TransactionClient | typeof prisma
) {
  const expected = new Set(DEFAULT_ENTITLEMENTS[subscription.tier]);
  if (expected.size === 0) {
    return;
  }

  const currentEntitlements =
    entitlements ??
    (await client.premiumEntitlement.findMany({ where: { subscriptionId: subscription.id } }));

  const existing = new Set(currentEntitlements.map((item) => item.feature));
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
  billing?: {
    stripeCustomerId?: string | null;
    stripeSubscriptionId?: string | null;
    stripePriceId?: string | null;
    checkoutSessionId?: string | null;
    latestInvoiceId?: string | null;
  };
}

function buildBillingAssignments(
  billing: SubscriptionUpsertInput['billing']
): Partial<Record<'stripeCustomerId' | 'stripeSubscriptionId' | 'stripePriceId' | 'checkoutSessionId' | 'latestInvoiceId', string | null>> {
  if (!billing) {
    return {};
  }

  const result: Partial<Record<'stripeCustomerId' | 'stripeSubscriptionId' | 'stripePriceId' | 'checkoutSessionId' | 'latestInvoiceId', string | null>> = {};

  if (billing.stripeCustomerId !== undefined) {
    result.stripeCustomerId = billing.stripeCustomerId ?? null;
  }
  if (billing.stripeSubscriptionId !== undefined) {
    result.stripeSubscriptionId = billing.stripeSubscriptionId ?? null;
  }
  if (billing.stripePriceId !== undefined) {
    result.stripePriceId = billing.stripePriceId ?? null;
  }
  if (billing.checkoutSessionId !== undefined) {
    result.checkoutSessionId = billing.checkoutSessionId ?? null;
  }
  if (billing.latestInvoiceId !== undefined) {
    result.latestInvoiceId = billing.latestInvoiceId ?? null;
  }

  return result;
}

export async function upsertPremiumSubscription({
  userId,
  tier,
  status = PremiumSubscriptionStatus.ACTIVE,
  source,
  billing,
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
          ...buildBillingAssignments(billing),
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
          ...buildBillingAssignments(billing),
        },
        include: { entitlements: true },
      });
    }

    if (
      subscription.status === PremiumSubscriptionStatus.ACTIVE ||
      subscription.status === PremiumSubscriptionStatus.TRIALING
    ) {
      await ensureDefaultEntitlements(subscription, subscription.entitlements, tx);
    }

    const profile = await getPremiumProfileForUser(userId, tx);
    return profile;
  });

  return result;
}

async function persistWebhookEvent(
  client: Prisma.TransactionClient | typeof prisma,
  event: Stripe.Event,
  subscriptionId: string | null
) {
  await client.premiumSubscriptionWebhookEvent.upsert({
    where: { stripeEventId: event.id },
    update: {
      stripeType: event.type,
      subscriptionId,
      payload: toJson(event.data.object),
    },
    create: {
      stripeEventId: event.id,
      stripeType: event.type,
      subscriptionId,
      payload: toJson(event.data.object),
    },
  });
}

function resolveStripeCustomerId(
  customer: string | Stripe.Customer | Stripe.DeletedCustomer | null | undefined
): string | null {
  if (!customer) {
    return null;
  }

  if (typeof customer === 'string') {
    return customer;
  }

  return 'id' in customer ? customer.id : null;
}

function resolveStripeSubscriptionId(
  subscription: string | Stripe.Subscription | null | undefined
): string | null {
  if (!subscription) {
    return null;
  }

  if (typeof subscription === 'string') {
    return subscription;
  }

  return subscription.id;
}

async function handleStripeSubscriptionEvent(event: Stripe.Event, subscription: Stripe.Subscription) {
  const customerId = resolveStripeCustomerId(subscription.customer);
  const userId = typeof subscription.metadata?.userId === 'string' ? subscription.metadata.userId : null;
  const tier = resolveTierFromMetadata(subscription.metadata, null);
  const status = mapStripeSubscriptionStatus(subscription.status);
  const periodEnd = resolveStripeTimestamp(subscription.current_period_end) ?? resolveStripeTimestamp(subscription.trial_end);
  const cancellationTimestamp =
    resolveStripeTimestamp(subscription.canceled_at) ?? resolveStripeTimestamp(subscription.cancel_at);
  const priceId = subscription.items?.data?.[0]?.price?.id ?? null;
  const latestInvoice = subscription.latest_invoice as Stripe.Invoice | string | null | undefined;
  const invoiceId =
    typeof latestInvoice === 'string'
      ? latestInvoice
      : latestInvoice?.id ?? null;

  await prisma.$transaction(async (tx) => {
    const located = await locateSubscription(tx, {
      stripeSubscriptionId: subscription.id,
      stripeCustomerId: customerId,
      userId,
    });

    const metadataPatch = mergeMetadata(located?.metadata, {
      stripeStatus: subscription.status,
      stripeCollectionMethod: subscription.collection_method ?? null,
      stripeCancelAtPeriodEnd: subscription.cancel_at_period_end ?? false,
    });

    let record:
      | (PremiumSubscriptionModel & { entitlements: PremiumEntitlementModel[] })
      | null = null;

    if (located) {
      const updateData: Prisma.PremiumSubscriptionUpdateInput = {
        status,
        currentPeriodEndsAt: periodEnd ?? located.currentPeriodEndsAt ?? null,
        cancellationRequestedAt:
          status === PremiumSubscriptionStatus.CANCELED || subscription.cancel_at_period_end
            ? cancellationTimestamp ?? located.cancellationRequestedAt ?? new Date()
            : located.cancellationRequestedAt ?? null,
        metadata: metadataPatch,
        latestInvoiceId: invoiceId ?? located.latestInvoiceId ?? null,
      };

      if (customerId) {
        updateData.stripeCustomerId = customerId;
      }

      if (priceId) {
        updateData.stripePriceId = priceId;
      }

      if (tier && tier !== located.tier) {
        updateData.tier = tier;
      }

      updateData.stripeSubscriptionId = subscription.id;

      record = await tx.premiumSubscription.update({
        where: { id: located.id },
        data: updateData,
        include: { entitlements: true },
      });
    } else if (userId && tier) {
      const metadata = mergeMetadata(null, {
        stripeStatus: subscription.status,
        stripeCollectionMethod: subscription.collection_method ?? null,
        stripeCancelAtPeriodEnd: subscription.cancel_at_period_end ?? false,
        createdFrom: 'stripe-webhook',
      });

      record = await tx.premiumSubscription.create({
        data: {
          userId,
          tier,
          status,
          startedAt: resolveStripeTimestamp(subscription.start_date) ?? new Date(),
          currentPeriodEndsAt: periodEnd ?? undefined,
          cancellationRequestedAt:
            status === PremiumSubscriptionStatus.CANCELED || subscription.cancel_at_period_end
              ? cancellationTimestamp ?? undefined
              : undefined,
          stripeCustomerId: customerId ?? undefined,
          stripeSubscriptionId: subscription.id,
          stripePriceId: priceId ?? undefined,
          latestInvoiceId: invoiceId ?? undefined,
          metadata,
        },
        include: { entitlements: true },
      });
    }

    await persistWebhookEvent(tx, event, record?.id ?? located?.id ?? null);

    if (
      record &&
      (record.status === PremiumSubscriptionStatus.ACTIVE || record.status === PremiumSubscriptionStatus.TRIALING)
    ) {
      await ensureDefaultEntitlements(record, record.entitlements, tx);
    }
  });
}

async function handleStripeInvoiceEvent(event: Stripe.Event, invoice: Stripe.Invoice) {
  const customerId = resolveStripeCustomerId(invoice.customer);
  const subscriptionId = resolveStripeSubscriptionId(invoice.subscription);
  const userId = typeof invoice.metadata?.userId === 'string' ? invoice.metadata.userId : null;
  const statusFromInvoice =
    invoice.status === 'paid'
      ? PremiumSubscriptionStatus.ACTIVE
      : invoice.status === 'uncollectible' || invoice.status === 'void'
      ? PremiumSubscriptionStatus.EXPIRED
      : null;

  await prisma.$transaction(async (tx) => {
    const located = await locateSubscription(tx, {
      stripeSubscriptionId: subscriptionId,
      stripeCustomerId: customerId,
      userId,
    });

    let record:
      | (PremiumSubscriptionModel & { entitlements: PremiumEntitlementModel[] })
      | null = null;

    if (located) {
      const metadataPatch = mergeMetadata(located.metadata, {
        stripeInvoiceStatus: invoice.status,
      });

      const updateData: Prisma.PremiumSubscriptionUpdateInput = {
        latestInvoiceId: invoice.id,
        metadata: metadataPatch,
      };

      if (statusFromInvoice) {
        updateData.status = statusFromInvoice;
      }

      record = await tx.premiumSubscription.update({
        where: { id: located.id },
        data: updateData,
        include: { entitlements: true },
      });
    }

    await persistWebhookEvent(tx, event, record?.id ?? located?.id ?? null);

    if (
      record &&
      (record.status === PremiumSubscriptionStatus.ACTIVE || record.status === PremiumSubscriptionStatus.TRIALING)
    ) {
      await ensureDefaultEntitlements(record, record.entitlements, tx);
    }
  });
}

async function handleStripeCheckoutEvent(event: Stripe.Event, session: Stripe.Checkout.Session) {
  const subscriptionId = resolveStripeSubscriptionId(session.subscription);
  const customerId = resolveStripeCustomerId(session.customer);
  const userId = typeof session.metadata?.userId === 'string' ? session.metadata.userId : null;
  const intent = session.metadata?.intent;
  const tier = resolveTierFromMetadata(session.metadata, null);
  const inferredStatus = intent === 'START_TRIAL' ? PremiumSubscriptionStatus.TRIALING : PremiumSubscriptionStatus.ACTIVE;

  await prisma.$transaction(async (tx) => {
    const located = await locateSubscription(tx, {
      checkoutSessionId: session.id,
      stripeSubscriptionId: subscriptionId,
      stripeCustomerId: customerId,
      userId,
    });

    let record:
      | (PremiumSubscriptionModel & { entitlements: PremiumEntitlementModel[] })
      | null = null;

    if (located) {
      const metadataPatch = mergeMetadata(located.metadata, {
        stripeCheckoutStatus: session.status ?? 'unknown',
      });

      const updateData: Prisma.PremiumSubscriptionUpdateInput = {
        metadata: metadataPatch,
        checkoutSessionId: session.id,
      };

      if (customerId) {
        updateData.stripeCustomerId = customerId;
      }

      if (subscriptionId) {
        updateData.stripeSubscriptionId = subscriptionId;
      }

      if (tier && tier !== located.tier) {
        updateData.tier = tier;
      }

      record = await tx.premiumSubscription.update({
        where: { id: located.id },
        data: updateData,
        include: { entitlements: true },
      });
    } else if (userId && tier) {
      const metadata = mergeMetadata(null, {
        stripeCheckoutStatus: session.status ?? 'unknown',
        createdFrom: 'stripe-webhook',
      });

      record = await tx.premiumSubscription.create({
        data: {
          userId,
          tier,
          status: inferredStatus,
          startedAt: new Date(),
          stripeCustomerId: customerId ?? undefined,
          stripeSubscriptionId: subscriptionId ?? undefined,
          checkoutSessionId: session.id,
          metadata,
        },
        include: { entitlements: true },
      });
    }

    await persistWebhookEvent(tx, event, record?.id ?? located?.id ?? null);

    if (
      record &&
      (record.status === PremiumSubscriptionStatus.ACTIVE || record.status === PremiumSubscriptionStatus.TRIALING)
    ) {
      await ensureDefaultEntitlements(record, record.entitlements, tx);
    }
  });
}

export async function handleStripeWebhookEvent(event: Stripe.Event): Promise<void> {
  if (STRIPE_SUBSCRIPTION_EVENTS.has(event.type)) {
    await handleStripeSubscriptionEvent(event, event.data.object as Stripe.Subscription);
    return;
  }

  if (STRIPE_INVOICE_EVENTS.has(event.type)) {
    await handleStripeInvoiceEvent(event, event.data.object as Stripe.Invoice);
    return;
  }

  if (STRIPE_CHECKOUT_EVENTS.has(event.type)) {
    await handleStripeCheckoutEvent(event, event.data.object as Stripe.Checkout.Session);
    return;
  }

  await prisma.premiumSubscriptionWebhookEvent.upsert({
    where: { stripeEventId: event.id },
    update: {
      stripeType: event.type,
      payload: toJson(event.data.object),
    },
    create: {
      stripeEventId: event.id,
      stripeType: event.type,
      payload: toJson(event.data.object),
    },
  });
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
