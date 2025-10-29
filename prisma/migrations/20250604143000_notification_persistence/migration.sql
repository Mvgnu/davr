-- Persisted negotiation notifications for durable fan-out
CREATE TYPE "NotificationDeliveryStatus" AS ENUM ('PENDING', 'DELIVERED', 'FAILED');

CREATE TABLE "NegotiationNotification" (
  "id" TEXT NOT NULL,
  "negotiationId" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "audience" "NegotiationActivityAudience" NOT NULL DEFAULT 'PARTICIPANTS',
  "status" "NegotiationStatus",
  "triggeredById" TEXT,
  "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "payload" JSONB,
  "channels" TEXT[] NOT NULL,
  "deliveryStatus" "NotificationDeliveryStatus" NOT NULL DEFAULT 'PENDING',
  "deliveryAttempts" INTEGER NOT NULL DEFAULT 0,
  "lastAttemptAt" TIMESTAMP(3),
  "deliveredAt" TIMESTAMP(3),
  "deliveryError" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "NegotiationNotification_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "NegotiationNotification"
  ADD CONSTRAINT "NegotiationNotification_negotiationId_fkey"
  FOREIGN KEY ("negotiationId") REFERENCES "Negotiation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "NegotiationNotification"
  ADD CONSTRAINT "NegotiationNotification_triggeredById_fkey"
  FOREIGN KEY ("triggeredById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "NegotiationNotification_negotiationId_idx" ON "NegotiationNotification"("negotiationId");
CREATE INDEX "NegotiationNotification_occurredAt_idx" ON "NegotiationNotification"("occurredAt");
CREATE INDEX "NegotiationNotification_deliveryStatus_idx" ON "NegotiationNotification"("deliveryStatus");
