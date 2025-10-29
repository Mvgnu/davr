-- CreateEnum
CREATE TYPE "ContractEnvelopeStatus" AS ENUM ('DRAFT', 'ISSUED', 'PARTIALLY_SIGNED', 'COMPLETED', 'VOID', 'FAILED');

-- AlterTable
ALTER TABLE "DealContract"
  ADD COLUMN "templateKey" TEXT,
  ADD COLUMN "provider" TEXT,
  ADD COLUMN "providerEnvelopeId" TEXT,
  ADD COLUMN "providerDocumentId" TEXT,
  ADD COLUMN "envelopeStatus" "ContractEnvelopeStatus" NOT NULL DEFAULT 'DRAFT',
  ADD COLUMN "participantStates" JSONB,
  ADD COLUMN "lastProviderSyncAt" TIMESTAMP(3),
  ADD COLUMN "lastError" TEXT;

-- CreateTable
CREATE TABLE "ContractTemplate" (
  "id" TEXT NOT NULL,
  "key" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "provider" TEXT NOT NULL,
  "version" INTEGER NOT NULL DEFAULT 1,
  "fields" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ContractTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ContractTemplate_key_key" ON "ContractTemplate"("key");
CREATE INDEX "ContractTemplate_provider_idx" ON "ContractTemplate"("provider");

-- CreateTable
CREATE TABLE "DealContractDocument" (
  "id" TEXT NOT NULL,
  "contractId" TEXT NOT NULL,
  "templateId" TEXT,
  "provider" TEXT,
  "providerDocumentId" TEXT,
  "providerEnvelopeId" TEXT,
  "status" "ContractEnvelopeStatus" NOT NULL DEFAULT 'DRAFT',
  "url" TEXT,
  "metadata" JSONB,
  "issuedAt" TIMESTAMP(3),
  "completedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "DealContractDocument_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DealContractDocument_contractId_idx" ON "DealContractDocument"("contractId");
CREATE INDEX "DealContractDocument_status_idx" ON "DealContractDocument"("status");

-- AddForeignKey
ALTER TABLE "DealContractDocument"
  ADD CONSTRAINT "DealContractDocument_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "DealContract"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "DealContractDocument"
  ADD CONSTRAINT "DealContractDocument_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "ContractTemplate"("id") ON DELETE SET NULL ON UPDATE CASCADE;
