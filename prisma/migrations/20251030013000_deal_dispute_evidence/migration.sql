-- CreateEnum
CREATE TYPE "DealDisputeEvidenceType" AS ENUM ('LINK', 'FILE', 'NOTE');

-- CreateTable
CREATE TABLE "DealDisputeEvidence" (
    "id" TEXT NOT NULL,
    "disputeId" TEXT NOT NULL,
    "uploadedByUserId" TEXT NOT NULL,
    "type" "DealDisputeEvidenceType" NOT NULL DEFAULT 'LINK',
    "url" TEXT NOT NULL,
    "label" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "DealDisputeEvidence_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DealDisputeEvidence_disputeId_idx" ON "DealDisputeEvidence"("disputeId");
CREATE INDEX "DealDisputeEvidence_uploadedByUserId_idx" ON "DealDisputeEvidence"("uploadedByUserId");

-- AddForeignKey
ALTER TABLE "DealDisputeEvidence" ADD CONSTRAINT "DealDisputeEvidence_disputeId_fkey" FOREIGN KEY ("disputeId") REFERENCES "DealDispute"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "DealDisputeEvidence" ADD CONSTRAINT "DealDisputeEvidence_uploadedByUserId_fkey" FOREIGN KEY ("uploadedByUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
