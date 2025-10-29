-- CreateEnum
CREATE TYPE "NegotiationStatus" AS ENUM ('INITIATED', 'COUNTERING', 'AGREED', 'CONTRACT_DRAFTING', 'CONTRACT_SIGNED', 'ESCROW_FUNDED', 'COMPLETED', 'CANCELLED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "OfferType" AS ENUM ('INITIAL', 'COUNTER', 'FINAL', 'SYSTEM');

-- CreateEnum
CREATE TYPE "ContractStatus" AS ENUM ('DRAFT', 'PENDING_SIGNATURES', 'SIGNED', 'REJECTED', 'VOID');

-- CreateEnum
CREATE TYPE "EscrowStatus" AS ENUM ('PENDING_SETUP', 'AWAITING_FUNDS', 'FUNDED', 'RELEASED', 'REFUNDED', 'DISPUTED', 'CLOSED');

-- CreateEnum
CREATE TYPE "EscrowTransactionType" AS ENUM ('FUND', 'RELEASE', 'REFUND', 'ADJUSTMENT');

-- AlterTable
ALTER TABLE "MarketplaceListing" ADD COLUMN     "isPremiumWorkflow" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "Negotiation" (
    "id" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "buyerId" TEXT NOT NULL,
    "sellerId" TEXT NOT NULL,
    "status" "NegotiationStatus" NOT NULL DEFAULT 'INITIATED',
    "initiatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "expiresAt" TIMESTAMP(3),
    "agreedPrice" DOUBLE PRECISION,
    "agreedQuantity" DOUBLE PRECISION,
    "currency" TEXT NOT NULL DEFAULT 'EUR',
    "notes" TEXT,

    CONSTRAINT "Negotiation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OfferCounter" (
    "id" TEXT NOT NULL,
    "negotiationId" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "price" DOUBLE PRECISION,
    "quantity" DOUBLE PRECISION,
    "message" TEXT,
    "type" "OfferType" NOT NULL DEFAULT 'COUNTER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OfferCounter_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NegotiationStatusHistory" (
    "id" TEXT NOT NULL,
    "negotiationId" TEXT NOT NULL,
    "status" "NegotiationStatus" NOT NULL,
    "note" TEXT,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NegotiationStatusHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DealContract" (
    "id" TEXT NOT NULL,
    "negotiationId" TEXT NOT NULL,
    "status" "ContractStatus" NOT NULL DEFAULT 'DRAFT',
    "draftTerms" TEXT,
    "documentUrl" TEXT,
    "buyerSignedAt" TIMESTAMP(3),
    "sellerSignedAt" TIMESTAMP(3),
    "finalizedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DealContract_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EscrowAccount" (
    "id" TEXT NOT NULL,
    "negotiationId" TEXT NOT NULL,
    "providerReference" TEXT,
    "status" "EscrowStatus" NOT NULL DEFAULT 'PENDING_SETUP',
    "currency" TEXT NOT NULL DEFAULT 'EUR',
    "expectedAmount" DOUBLE PRECISION,
    "fundedAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "releasedAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "refundedAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EscrowAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EscrowTransaction" (
    "id" TEXT NOT NULL,
    "escrowAccountId" TEXT NOT NULL,
    "type" "EscrowTransactionType" NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reference" TEXT,
    "metadata" JSONB,

    CONSTRAINT "EscrowTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Negotiation_listingId_idx" ON "Negotiation"("listingId");

-- CreateIndex
CREATE INDEX "Negotiation_buyerId_idx" ON "Negotiation"("buyerId");

-- CreateIndex
CREATE INDEX "Negotiation_sellerId_idx" ON "Negotiation"("sellerId");

-- CreateIndex
CREATE INDEX "Negotiation_status_idx" ON "Negotiation"("status");

-- CreateIndex
CREATE INDEX "OfferCounter_negotiationId_idx" ON "OfferCounter"("negotiationId");

-- CreateIndex
CREATE INDEX "OfferCounter_senderId_idx" ON "OfferCounter"("senderId");

-- CreateIndex
CREATE INDEX "OfferCounter_type_idx" ON "OfferCounter"("type");

-- CreateIndex
CREATE INDEX "NegotiationStatusHistory_negotiationId_idx" ON "NegotiationStatusHistory"("negotiationId");

-- CreateIndex
CREATE INDEX "NegotiationStatusHistory_status_idx" ON "NegotiationStatusHistory"("status");

-- CreateIndex
CREATE INDEX "NegotiationStatusHistory_createdById_idx" ON "NegotiationStatusHistory"("createdById");

-- CreateIndex
CREATE UNIQUE INDEX "DealContract_negotiationId_key" ON "DealContract"("negotiationId");

-- CreateIndex
CREATE INDEX "DealContract_status_idx" ON "DealContract"("status");

-- CreateIndex
CREATE UNIQUE INDEX "EscrowAccount_negotiationId_key" ON "EscrowAccount"("negotiationId");

-- CreateIndex
CREATE INDEX "EscrowAccount_status_idx" ON "EscrowAccount"("status");

-- CreateIndex
CREATE INDEX "EscrowTransaction_escrowAccountId_idx" ON "EscrowTransaction"("escrowAccountId");

-- CreateIndex
CREATE INDEX "EscrowTransaction_type_idx" ON "EscrowTransaction"("type");

-- CreateIndex
CREATE INDEX "EscrowTransaction_occurredAt_idx" ON "EscrowTransaction"("occurredAt");

-- AddForeignKey
ALTER TABLE "Negotiation" ADD CONSTRAINT "Negotiation_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "MarketplaceListing"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Negotiation" ADD CONSTRAINT "Negotiation_buyerId_fkey" FOREIGN KEY ("buyerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Negotiation" ADD CONSTRAINT "Negotiation_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OfferCounter" ADD CONSTRAINT "OfferCounter_negotiationId_fkey" FOREIGN KEY ("negotiationId") REFERENCES "Negotiation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OfferCounter" ADD CONSTRAINT "OfferCounter_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NegotiationStatusHistory" ADD CONSTRAINT "NegotiationStatusHistory_negotiationId_fkey" FOREIGN KEY ("negotiationId") REFERENCES "Negotiation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NegotiationStatusHistory" ADD CONSTRAINT "NegotiationStatusHistory_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DealContract" ADD CONSTRAINT "DealContract_negotiationId_fkey" FOREIGN KEY ("negotiationId") REFERENCES "Negotiation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EscrowAccount" ADD CONSTRAINT "EscrowAccount_negotiationId_fkey" FOREIGN KEY ("negotiationId") REFERENCES "Negotiation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EscrowTransaction" ADD CONSTRAINT "EscrowTransaction_escrowAccountId_fkey" FOREIGN KEY ("escrowAccountId") REFERENCES "EscrowAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

