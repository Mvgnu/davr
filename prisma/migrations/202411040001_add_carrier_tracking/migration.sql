-- meta: migration=add_carrier_tracking_manifest version=1.0 owner=operations scope=logistics

-- Create enum if it does not exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'FulfilmentCarrierSyncStatus') THEN
    CREATE TYPE "FulfilmentCarrierSyncStatus" AS ENUM ('REGISTERED', 'IN_TRANSIT', 'DELIVERED', 'FAILED');
  END IF;
END $$;

-- Extend fulfilment orders with carrier sync metadata
ALTER TABLE "FulfilmentOrder"
  ADD COLUMN IF NOT EXISTS "carrierCode" TEXT,
  ADD COLUMN IF NOT EXISTS "carrierSyncStatus" "FulfilmentCarrierSyncStatus",
  ADD COLUMN IF NOT EXISTS "lastCarrierSyncAt" TIMESTAMP(3);

ALTER TABLE "FulfilmentOrder"
  ALTER COLUMN "carrierSyncStatus" TYPE "FulfilmentCarrierSyncStatus" USING COALESCE("carrierSyncStatus", 'REGISTERED')::"FulfilmentCarrierSyncStatus";

-- Create manifest + tracking tables
CREATE TABLE IF NOT EXISTS "FulfilmentCarrierManifest" (
  "id" TEXT PRIMARY KEY,
  "orderId" TEXT NOT NULL UNIQUE,
  "carrierCode" TEXT NOT NULL,
  "trackingReference" TEXT,
  "pollingStatus" "FulfilmentCarrierSyncStatus" NOT NULL DEFAULT 'REGISTERED',
  "manifestPayload" JSONB,
  "lastSyncedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT NOW(),
  CONSTRAINT "FulfilmentCarrierManifest_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "FulfilmentOrder"("id") ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS "FulfilmentTrackingEvent" (
  "id" TEXT PRIMARY KEY,
  "manifestId" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "description" TEXT,
  "eventTime" TIMESTAMP(3) NOT NULL,
  "location" TEXT,
  "rawPayload" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT NOW(),
  CONSTRAINT "FulfilmentTrackingEvent_manifestId_fkey" FOREIGN KEY ("manifestId") REFERENCES "FulfilmentCarrierManifest"("id") ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "FulfilmentOrder_carrierCode_idx" ON "FulfilmentOrder" ("carrierCode");
CREATE INDEX IF NOT EXISTS "FulfilmentCarrierManifest_carrierCode_idx" ON "FulfilmentCarrierManifest" ("carrierCode");
CREATE INDEX IF NOT EXISTS "FulfilmentCarrierManifest_pollingStatus_idx" ON "FulfilmentCarrierManifest" ("pollingStatus");
CREATE INDEX IF NOT EXISTS "FulfilmentTrackingEvent_manifestId_idx" ON "FulfilmentTrackingEvent" ("manifestId");
CREATE INDEX IF NOT EXISTS "FulfilmentTrackingEvent_eventTime_idx" ON "FulfilmentTrackingEvent" ("eventTime");
CREATE INDEX IF NOT EXISTS "FulfilmentTrackingEvent_status_idx" ON "FulfilmentTrackingEvent" ("status");
