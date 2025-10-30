-- meta: migration=fulfilment_orders version=0.1 owner=operations
-- Create fulfilment enums
CREATE TYPE "FulfilmentOrderStatus" AS ENUM ('DRAFT', 'SCHEDULING', 'SCHEDULED', 'IN_TRANSIT', 'DELIVERED', 'CANCELLED');
CREATE TYPE "FulfilmentMilestoneType" AS ENUM ('CREATED', 'PICKUP_CONFIRMED', 'PICKED_UP', 'IN_TRANSIT', 'ARRIVED_AT_HUB', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED');
CREATE TYPE "FulfilmentReminderType" AS ENUM ('PICKUP_WINDOW', 'DELIVERY_WINDOW', 'SLA_BREACH');

-- Extend negotiation activity types for fulfilment
ALTER TYPE "NegotiationActivityType" ADD VALUE IF NOT EXISTS 'FULFILMENT_ORDER_CREATED';
ALTER TYPE "NegotiationActivityType" ADD VALUE IF NOT EXISTS 'FULFILMENT_ORDER_SCHEDULED';
ALTER TYPE "NegotiationActivityType" ADD VALUE IF NOT EXISTS 'FULFILMENT_ORDER_UPDATED';
ALTER TYPE "NegotiationActivityType" ADD VALUE IF NOT EXISTS 'FULFILMENT_MILESTONE_RECORDED';
ALTER TYPE "NegotiationActivityType" ADD VALUE IF NOT EXISTS 'FULFILMENT_REMINDER_SCHEDULED';
ALTER TYPE "NegotiationActivityType" ADD VALUE IF NOT EXISTS 'FULFILMENT_REMINDER_SENT';

-- Fulfilment orders table
CREATE TABLE "FulfilmentOrder" (
  "id" TEXT PRIMARY KEY,
  "negotiationId" TEXT NOT NULL,
  "reference" TEXT UNIQUE,
  "status" "FulfilmentOrderStatus" NOT NULL DEFAULT 'DRAFT',
  "pickupWindowStart" TIMESTAMP(3),
  "pickupWindowEnd" TIMESTAMP(3),
  "pickupLocation" TEXT,
  "deliveryLocation" TEXT,
  "carrierName" TEXT,
  "carrierContact" TEXT,
  "carrierServiceLevel" TEXT,
  "trackingNumber" TEXT,
  "externalId" TEXT,
  "specialInstructions" TEXT,
  "createdById" TEXT,
  "updatedById" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Fulfilment milestones table
CREATE TABLE "FulfilmentMilestone" (
  "id" TEXT PRIMARY KEY,
  "orderId" TEXT NOT NULL,
  "type" "FulfilmentMilestoneType" NOT NULL,
  "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "recordedById" TEXT,
  "notes" TEXT,
  "payload" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Fulfilment reminders table
CREATE TABLE "FulfilmentReminder" (
  "id" TEXT PRIMARY KEY,
  "orderId" TEXT NOT NULL,
  "type" "FulfilmentReminderType" NOT NULL,
  "scheduledFor" TIMESTAMP(3) NOT NULL,
  "sentAt" TIMESTAMP(3),
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX "FulfilmentOrder_negotiationId_idx" ON "FulfilmentOrder"("negotiationId");
CREATE INDEX "FulfilmentOrder_status_idx" ON "FulfilmentOrder"("status");
CREATE INDEX "FulfilmentOrder_pickup_window_idx" ON "FulfilmentOrder"("pickupWindowStart", "pickupWindowEnd");
CREATE INDEX "FulfilmentOrder_carrierName_idx" ON "FulfilmentOrder"("carrierName");

CREATE INDEX "FulfilmentMilestone_orderId_idx" ON "FulfilmentMilestone"("orderId");
CREATE INDEX "FulfilmentMilestone_type_idx" ON "FulfilmentMilestone"("type");
CREATE INDEX "FulfilmentMilestone_occurredAt_idx" ON "FulfilmentMilestone"("occurredAt");

CREATE INDEX "FulfilmentReminder_orderId_idx" ON "FulfilmentReminder"("orderId");
CREATE INDEX "FulfilmentReminder_type_scheduledFor_idx" ON "FulfilmentReminder"("type", "scheduledFor");
CREATE INDEX "FulfilmentReminder_sentAt_idx" ON "FulfilmentReminder"("sentAt");

-- Foreign keys
ALTER TABLE "FulfilmentOrder"
  ADD CONSTRAINT "FulfilmentOrder_negotiationId_fkey" FOREIGN KEY ("negotiationId") REFERENCES "Negotiation"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "FulfilmentOrder_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT "FulfilmentOrder_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "FulfilmentMilestone"
  ADD CONSTRAINT "FulfilmentMilestone_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "FulfilmentOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "FulfilmentMilestone_recordedById_fkey" FOREIGN KEY ("recordedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "FulfilmentReminder"
  ADD CONSTRAINT "FulfilmentReminder_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "FulfilmentOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;
