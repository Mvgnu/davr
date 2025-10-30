/**
 * meta: module=premium-stripe-adapter version=0.1 owner=platform
 */
import Stripe from 'stripe';
import { PremiumTier } from '@prisma/client';

const STRIPE_API_VERSION: Stripe.LatestApiVersion = '2023-10-16';

export class StripeConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'StripeConfigurationError';
  }
}

export class StripeWebhookSignatureError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'StripeWebhookSignatureError';
  }
}

function getStripeSecretKey(): string {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    throw new StripeConfigurationError('Stripe secret key is not configured.');
  }
  return secretKey;
}

function buildStripeClient(): Stripe {
  return new Stripe(getStripeSecretKey(), { apiVersion: STRIPE_API_VERSION });
}

let cachedStripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (!cachedStripe) {
    cachedStripe = buildStripeClient();
  }
  return cachedStripe;
}

const TIER_PRICE_ENV: Record<PremiumTier, string> = {
  PREMIUM: 'STRIPE_PRICE_ID_PREMIUM',
  CONCIERGE: 'STRIPE_PRICE_ID_CONCIERGE',
  STANDARD: 'STRIPE_PRICE_ID_STANDARD',
};

export function resolveTierPriceId(tier: PremiumTier): string {
  const envKey = TIER_PRICE_ENV[tier];
  const priceId = process.env[envKey];
  if (!priceId) {
    throw new StripeConfigurationError(`Stripe price id missing for tier ${tier}. Expected env ${envKey}.`);
  }
  return priceId;
}

function getStripeWebhookSecret(): string {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    throw new StripeConfigurationError('Stripe webhook secret is not configured.');
  }
  return secret;
}

export interface EnsureCustomerInput {
  customerId?: string | null;
  userId: string;
  email?: string | null;
  name?: string | null;
}

export interface EnsureCustomerResult {
  customerId: string;
  created: boolean;
}

export async function ensureStripeCustomer(input: EnsureCustomerInput): Promise<EnsureCustomerResult> {
  const stripe = getStripe();

  if (input.customerId) {
    return { customerId: input.customerId, created: false };
  }

  const customer = await stripe.customers.create({
    email: input.email ?? undefined,
    name: input.name ?? undefined,
    metadata: {
      userId: input.userId,
    },
  });

  return { customerId: customer.id, created: true };
}

export interface PremiumCheckoutSessionInput {
  userId: string;
  tier: PremiumTier;
  email?: string | null;
  name?: string | null;
  mode: 'START_TRIAL' | 'UPGRADE_CONFIRMED';
  successUrl: string;
  cancelUrl: string;
  existingCustomerId?: string | null;
  trialPeriodDays?: number;
  metadata?: Record<string, string | number | boolean>;
}

export interface PremiumCheckoutSession {
  sessionId: string;
  url: string;
  customerId: string;
  priceId: string;
}

export async function createPremiumCheckoutSession(
  input: PremiumCheckoutSessionInput
): Promise<PremiumCheckoutSession> {
  const stripe = getStripe();
  const priceId = resolveTierPriceId(input.tier);
  const customerResult = await ensureStripeCustomer({
    customerId: input.existingCustomerId,
    userId: input.userId,
    email: input.email,
    name: input.name,
  });

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    success_url: input.successUrl,
    cancel_url: input.cancelUrl,
    customer: customerResult.customerId,
    allow_promotion_codes: true,
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    subscription_data: {
      trial_period_days: input.trialPeriodDays,
      metadata: {
        userId: input.userId,
        tier: input.tier,
        intent: input.mode,
        ...serializeMetadata(input.metadata),
      },
    },
    metadata: {
      userId: input.userId,
      tier: input.tier,
      intent: input.mode,
      ...serializeMetadata(input.metadata),
    },
  });

  if (!session.url) {
    throw new Error('Stripe session missing hosted url.');
  }

  return {
    sessionId: session.id,
    url: session.url,
    customerId: customerResult.customerId,
    priceId,
  };
}

function serializeMetadata(
  metadata: Record<string, string | number | boolean> | undefined
): Record<string, string> {
  if (!metadata) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(metadata).map(([key, value]) => [key, String(value)])
  );
}

export function constructStripeWebhookEvent(
  payload: string | Buffer,
  signature: string | null
): Stripe.Event {
  if (!signature) {
    throw new StripeWebhookSignatureError('Stripe signature header is missing.');
  }

  const stripe = getStripe();
  const secret = getStripeWebhookSecret();

  try {
    return stripe.webhooks.constructEvent(payload, signature, secret);
  } catch (error) {
    if (error instanceof Stripe.errors.StripeSignatureVerificationError) {
      throw new StripeWebhookSignatureError(error.message);
    }
    throw error;
  }
}
