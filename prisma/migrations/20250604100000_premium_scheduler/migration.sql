-- Premium monetization and scheduler tables
CREATE TYPE "PremiumTier" AS ENUM ('STANDARD', 'PREMIUM', 'CONCIERGE');
CREATE TYPE "PremiumSubscriptionStatus" AS ENUM ('TRIALING', 'ACTIVE', 'CANCELED', 'EXPIRED');
CREATE TYPE "PremiumFeature" AS ENUM ('ADVANCED_ANALYTICS', 'CONCIERGE_SLA', 'DISPUTE_FAST_TRACK');
CREATE TYPE "PremiumConversionEventType" AS ENUM (
  'UPGRADE_CTA_VIEWED',
  'TRIAL_STARTED',
  'UPGRADE_CONFIRMED',
  'PREMIUM_NEGOTIATION_COMPLETED'
);
CREATE TYPE "JobExecutionStatus" AS ENUM ('SUCCEEDED', 'FAILED', 'RETRYING');

ALTER TABLE "Negotiation" ADD COLUMN "premiumTier" "PremiumTier";

CREATE TABLE "PremiumSubscription" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "tier" "PremiumTier" NOT NULL DEFAULT 'PREMIUM',
  "status" "PremiumSubscriptionStatus" NOT NULL DEFAULT 'TRIALING',
  "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "currentPeriodEndsAt" TIMESTAMP(3),
  "cancellationRequestedAt" TIMESTAMP(3),
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PremiumSubscription_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PremiumEntitlement" (
  "id" TEXT NOT NULL,
  "subscriptionId" TEXT NOT NULL,
  "feature" "PremiumFeature" NOT NULL,
  "grantedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "expiresAt" TIMESTAMP(3),
  "source" TEXT,
  "metadata" JSONB,
  CONSTRAINT "PremiumEntitlement_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PremiumConversionEvent" (
  "id" TEXT NOT NULL,
  "userId" TEXT,
  "negotiationId" TEXT,
  "eventType" "PremiumConversionEventType" NOT NULL,
  "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "metadata" JSONB,
  CONSTRAINT "PremiumConversionEvent_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "RecurringJob" (
  "name" TEXT NOT NULL,
  "handlerKey" TEXT NOT NULL,
  "intervalMs" INTEGER NOT NULL,
  "lastRunAt" TIMESTAMP(3),
  "nextRunAt" TIMESTAMP(3),
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "metadata" JSONB,
  CONSTRAINT "RecurringJob_pkey" PRIMARY KEY ("name")
);

CREATE TABLE "JobExecutionLog" (
  "id" TEXT NOT NULL,
  "jobName" TEXT NOT NULL,
  "status" "JobExecutionStatus" NOT NULL DEFAULT 'SUCCEEDED',
  "attempt" INTEGER NOT NULL DEFAULT 1,
  "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "finishedAt" TIMESTAMP(3),
  "error" TEXT,
  "metadata" JSONB,
  CONSTRAINT "JobExecutionLog_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "PremiumSubscription"
  ADD CONSTRAINT "PremiumSubscription_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "PremiumEntitlement"
  ADD CONSTRAINT "PremiumEntitlement_subscriptionId_fkey"
  FOREIGN KEY ("subscriptionId") REFERENCES "PremiumSubscription"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "PremiumConversionEvent"
  ADD CONSTRAINT "PremiumConversionEvent_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "PremiumConversionEvent"
  ADD CONSTRAINT "PremiumConversionEvent_negotiationId_fkey"
  FOREIGN KEY ("negotiationId") REFERENCES "Negotiation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "PremiumSubscription_userId_idx" ON "PremiumSubscription"("userId");
CREATE INDEX "PremiumSubscription_status_idx" ON "PremiumSubscription"("status");
CREATE INDEX "PremiumEntitlement_subscriptionId_idx" ON "PremiumEntitlement"("subscriptionId");
CREATE INDEX "PremiumEntitlement_feature_idx" ON "PremiumEntitlement"("feature");
CREATE INDEX "PremiumConversionEvent_userId_idx" ON "PremiumConversionEvent"("userId");
CREATE INDEX "PremiumConversionEvent_negotiationId_idx" ON "PremiumConversionEvent"("negotiationId");
CREATE INDEX "PremiumConversionEvent_eventType_occurredAt_idx" ON "PremiumConversionEvent"("eventType", "occurredAt");
CREATE INDEX "JobExecutionLog_jobName_idx" ON "JobExecutionLog"("jobName");
CREATE INDEX "JobExecutionLog_status_idx" ON "JobExecutionLog"("status");
CREATE INDEX "JobExecutionLog_startedAt_idx" ON "JobExecutionLog"("startedAt");
