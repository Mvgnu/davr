/*
  Warnings:

  - You are about to drop the column `is_active` on the `MarketplaceListing` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "ListingType" AS ENUM ('BUY', 'SELL');

-- CreateEnum
CREATE TYPE "ListingStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'PENDING', 'REJECTED', 'FLAGGED');

-- AlterTable
ALTER TABLE "MarketplaceListing" DROP COLUMN "is_active",
ADD COLUMN     "status" "ListingStatus" NOT NULL DEFAULT 'PENDING',
ADD COLUMN     "type" "ListingType" NOT NULL DEFAULT 'SELL';

-- CreateTable
CREATE TABLE "RecyclingCenterClaim" (
    "id" TEXT NOT NULL,
    "recycling_center_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "companyName" TEXT,
    "businessRole" TEXT,
    "message" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "rejection_reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RecyclingCenterClaim_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BlogPost" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "excerpt" TEXT,
    "content" TEXT NOT NULL,
    "author_name" TEXT,
    "category" TEXT,
    "published_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "image_url" TEXT,

    CONSTRAINT "BlogPost_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "RecyclingCenterClaim_recycling_center_id_idx" ON "RecyclingCenterClaim"("recycling_center_id");

-- CreateIndex
CREATE INDEX "RecyclingCenterClaim_user_id_idx" ON "RecyclingCenterClaim"("user_id");

-- CreateIndex
CREATE INDEX "RecyclingCenterClaim_status_idx" ON "RecyclingCenterClaim"("status");

-- CreateIndex
CREATE UNIQUE INDEX "BlogPost_slug_key" ON "BlogPost"("slug");

-- CreateIndex
CREATE INDEX "BlogPost_status_idx" ON "BlogPost"("status");

-- CreateIndex
CREATE INDEX "BlogPost_category_idx" ON "BlogPost"("category");

-- CreateIndex
CREATE INDEX "BlogPost_published_at_idx" ON "BlogPost"("published_at");

-- CreateIndex
CREATE INDEX "BlogPost_author_name_idx" ON "BlogPost"("author_name");

-- CreateIndex
CREATE INDEX "MarketplaceListing_type_idx" ON "MarketplaceListing"("type");

-- CreateIndex
CREATE INDEX "MarketplaceListing_status_idx" ON "MarketplaceListing"("status");

-- AddForeignKey
ALTER TABLE "RecyclingCenterClaim" ADD CONSTRAINT "RecyclingCenterClaim_recycling_center_id_fkey" FOREIGN KEY ("recycling_center_id") REFERENCES "RecyclingCenter"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecyclingCenterClaim" ADD CONSTRAINT "RecyclingCenterClaim_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
