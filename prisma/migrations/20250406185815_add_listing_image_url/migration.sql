-- DropForeignKey
ALTER TABLE "MarketplaceListing" DROP CONSTRAINT "MarketplaceListing_seller_id_fkey";

-- AlterTable
ALTER TABLE "MarketplaceListing" ADD COLUMN     "image_url" TEXT;

-- CreateIndex
CREATE INDEX "MarketplaceListing_created_at_idx" ON "MarketplaceListing"("created_at");

-- AddForeignKey
ALTER TABLE "MarketplaceListing" ADD CONSTRAINT "MarketplaceListing_seller_id_fkey" FOREIGN KEY ("seller_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
