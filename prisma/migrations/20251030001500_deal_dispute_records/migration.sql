-- meta: migration=deal_dispute_records version=0.1 owner=platform
CREATE TYPE "DealDisputeStatus" AS ENUM ('OPEN', 'UNDER_REVIEW', 'AWAITING_PARTIES', 'ESCALATED', 'RESOLVED', 'CLOSED');
CREATE TYPE "DealDisputeSeverity" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');
CREATE TYPE "DealDisputeCategory" AS ENUM ('ESCROW', 'DELIVERY', 'QUALITY', 'OTHER');
CREATE TYPE "DealDisputeEventType" AS ENUM (
  'CREATED',
  'STATUS_CHANGED',
  'NOTE_ADDED',
  'ASSIGNMENT_UPDATED',
  'ESCALATION_TRIGGERED',
  'SLA_BREACH_RECORDED',
  'RESOLUTION_RECORDED',
  'EVIDENCE_ATTACHED'
);

CREATE TABLE IF NOT EXISTS "DealDispute" (
  "id" TEXT PRIMARY KEY,
  "negotiationId" TEXT NOT NULL,
  "raisedByUserId" TEXT NOT NULL,
  "assignedToUserId" TEXT NULL,
  "status" "DealDisputeStatus" NOT NULL DEFAULT 'OPEN',
  "severity" "DealDisputeSeverity" NOT NULL DEFAULT 'MEDIUM',
  "category" "DealDisputeCategory" NOT NULL DEFAULT 'ESCROW',
  "summary" TEXT NOT NULL,
  "description" TEXT NULL,
  "requestedOutcome" TEXT NULL,
  "slaDueAt" TIMESTAMPTZ NULL,
  "raisedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "acknowledgedAt" TIMESTAMPTZ NULL,
  "escalatedAt" TIMESTAMPTZ NULL,
  "resolvedAt" TIMESTAMPTZ NULL,
  "closedAt" TIMESTAMPTZ NULL,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT "DealDispute_negotiationId_fkey" FOREIGN KEY ("negotiationId") REFERENCES "Negotiation"("id") ON DELETE CASCADE,
  CONSTRAINT "DealDispute_raisedByUserId_fkey" FOREIGN KEY ("raisedByUserId") REFERENCES "User"("id") ON DELETE CASCADE,
  CONSTRAINT "DealDispute_assignedToUserId_fkey" FOREIGN KEY ("assignedToUserId") REFERENCES "User"("id") ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS "DealDisputeEvent" (
  "id" TEXT PRIMARY KEY,
  "disputeId" TEXT NOT NULL,
  "actorUserId" TEXT NULL,
  "type" "DealDisputeEventType" NOT NULL,
  "status" "DealDisputeStatus" NULL,
  "message" TEXT NULL,
  "metadata" JSONB NULL,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT "DealDisputeEvent_disputeId_fkey" FOREIGN KEY ("disputeId") REFERENCES "DealDispute"("id") ON DELETE CASCADE,
  CONSTRAINT "DealDisputeEvent_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "User"("id") ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS "DealDispute_negotiation_idx" ON "DealDispute"("negotiationId");
CREATE INDEX IF NOT EXISTS "DealDispute_raisedBy_idx" ON "DealDispute"("raisedByUserId");
CREATE INDEX IF NOT EXISTS "DealDispute_assignedTo_idx" ON "DealDispute"("assignedToUserId");
CREATE INDEX IF NOT EXISTS "DealDispute_status_idx" ON "DealDispute"("status");
CREATE INDEX IF NOT EXISTS "DealDispute_slaDue_idx" ON "DealDispute"("slaDueAt");

CREATE INDEX IF NOT EXISTS "DealDisputeEvent_dispute_idx" ON "DealDisputeEvent"("disputeId");
CREATE INDEX IF NOT EXISTS "DealDisputeEvent_actor_idx" ON "DealDisputeEvent"("actorUserId");
CREATE INDEX IF NOT EXISTS "DealDisputeEvent_type_idx" ON "DealDisputeEvent"("type");
CREATE INDEX IF NOT EXISTS "DealDisputeEvent_createdAt_idx" ON "DealDisputeEvent"("createdAt");
