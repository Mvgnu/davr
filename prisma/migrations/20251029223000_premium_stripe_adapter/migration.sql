-- meta: migration=premium_stripe_adapter version=0.1 owner=platform
ALTER TABLE "PremiumSubscription"
  ADD COLUMN "stripeCustomerId" TEXT,
  ADD COLUMN "stripeSubscriptionId" TEXT,
  ADD COLUMN "stripePriceId" TEXT,
  ADD COLUMN "checkoutSessionId" TEXT,
  ADD COLUMN "latestInvoiceId" TEXT;

CREATE TABLE IF NOT EXISTS "PremiumSubscriptionWebhookEvent" (
  "id" TEXT PRIMARY KEY,
  "subscriptionId" TEXT NULL,
  "stripeEventId" TEXT NOT NULL UNIQUE,
  "stripeType" TEXT NOT NULL,
  "payload" JSONB NOT NULL,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT "PremiumSubscriptionWebhookEvent_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "PremiumSubscription"("id") ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS "PremiumSubscriptionWebhookEvent_subscriptionId_idx" ON "PremiumSubscriptionWebhookEvent"("subscriptionId");
CREATE INDEX IF NOT EXISTS "PremiumSubscriptionWebhookEvent_type_createdAt_idx" ON "PremiumSubscriptionWebhookEvent"("stripeType", "createdAt");
