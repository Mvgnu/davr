-- Create Enums
CREATE TYPE "ContractRevisionStatus" AS ENUM ('DRAFT', 'IN_REVIEW', 'ACCEPTED', 'REJECTED');
CREATE TYPE "ContractRevisionCommentStatus" AS ENUM ('OPEN', 'RESOLVED');

-- Extend DealContract with pointer to current revision
ALTER TABLE "DealContract" ADD COLUMN "currentRevisionId" TEXT;

-- Create revision table
CREATE TABLE "DealContractRevision" (
  "id" TEXT PRIMARY KEY,
  "negotiationId" TEXT NOT NULL,
  "contractId" TEXT NOT NULL,
  "version" INTEGER NOT NULL,
  "summary" TEXT,
  "body" TEXT NOT NULL,
  "status" "ContractRevisionStatus" NOT NULL DEFAULT 'DRAFT',
  "isCurrent" BOOLEAN NOT NULL DEFAULT false,
  "attachments" JSONB,
  "createdById" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create revision comments table
CREATE TABLE "DealContractRevisionComment" (
  "id" TEXT PRIMARY KEY,
  "revisionId" TEXT NOT NULL,
  "authorId" TEXT NOT NULL,
  "body" TEXT NOT NULL,
  "anchor" JSONB,
  "status" "ContractRevisionCommentStatus" NOT NULL DEFAULT 'OPEN',
  "resolvedAt" TIMESTAMP(3),
  "resolvedById" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE UNIQUE INDEX "DealContractRevision_contractId_version_key" ON "DealContractRevision"("contractId", "version");
CREATE INDEX "DealContractRevision_negotiationId_createdAt_idx" ON "DealContractRevision"("negotiationId", "createdAt");
CREATE INDEX "DealContractRevision_status_createdAt_idx" ON "DealContractRevision"("status", "createdAt");
CREATE INDEX "DealContractRevisionComment_revisionId_idx" ON "DealContractRevisionComment"("revisionId");
CREATE INDEX "DealContractRevisionComment_status_createdAt_idx" ON "DealContractRevisionComment"("status", "createdAt");

-- Foreign keys
ALTER TABLE "DealContractRevision"
  ADD CONSTRAINT "DealContractRevision_negotiationId_fkey" FOREIGN KEY ("negotiationId") REFERENCES "Negotiation"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "DealContractRevision_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "DealContract"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "DealContractRevision_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "DealContractRevisionComment"
  ADD CONSTRAINT "DealContractRevisionComment_revisionId_fkey" FOREIGN KEY ("revisionId") REFERENCES "DealContractRevision"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "DealContractRevisionComment_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "DealContractRevisionComment_resolvedById_fkey" FOREIGN KEY ("resolvedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "DealContract"
  ADD CONSTRAINT "DealContract_currentRevisionId_fkey" FOREIGN KEY ("currentRevisionId") REFERENCES "DealContractRevision"("id") ON DELETE SET NULL ON UPDATE CASCADE;
