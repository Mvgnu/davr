CREATE TYPE "ContractIntentEventType" AS ENUM (
  'ENVELOPE_ISSUED',
  'PARTICIPANT_SIGNED',
  'ENVELOPE_COMPLETED',
  'ENVELOPE_DECLINED'
);

CREATE TABLE "ContractIntentMetric" (
  "id" TEXT PRIMARY KEY,
  "negotiationId" TEXT NOT NULL,
  "contractId" TEXT NOT NULL,
  "eventType" "ContractIntentEventType" NOT NULL,
  "participantRole" TEXT,
  "metadata" JSONB,
  "occurredAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  CONSTRAINT "ContractIntentMetric_negotiationId_fkey" FOREIGN KEY ("negotiationId") REFERENCES "Negotiation"("id") ON DELETE CASCADE,
  CONSTRAINT "ContractIntentMetric_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "DealContract"("id") ON DELETE CASCADE
);

CREATE INDEX "ContractIntentMetric_negotiationId_idx" ON "ContractIntentMetric" ("negotiationId");
CREATE INDEX "ContractIntentMetric_contractId_idx" ON "ContractIntentMetric" ("contractId");
CREATE INDEX "ContractIntentMetric_eventType_idx" ON "ContractIntentMetric" ("eventType");
CREATE INDEX "ContractIntentMetric_occurredAt_idx" ON "ContractIntentMetric" ("occurredAt");
