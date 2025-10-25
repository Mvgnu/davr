-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('USER', 'CENTER_OWNER', 'ADMIN');

-- DropIndex
DROP INDEX "public"."MarketplaceListing_seller_id_status_idx";

-- DropIndex
DROP INDEX "public"."MarketplaceListing_status_created_at_idx";

-- DropIndex
DROP INDEX "public"."MarketplaceListing_status_type_material_id_idx";

-- DropIndex
DROP INDEX "public"."Material_name_idx";

-- DropIndex
DROP INDEX "public"."Material_parent_id_idx";

-- DropIndex
DROP INDEX "public"."RecyclingCenter_city_verification_status_idx";

-- DropIndex
DROP INDEX "public"."RecyclingCenter_created_at_idx";

-- DropIndex
DROP INDEX "public"."RecyclingCenter_verification_status_latitude_longitude_idx";

-- DropIndex
DROP INDEX "public"."Review_centerId_rating_idx";

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "role" "UserRole" NOT NULL DEFAULT 'USER';

-- CreateTable
CREATE TABLE "Message" (
    "id" TEXT NOT NULL,
    "senderUserId" TEXT,
    "senderName" TEXT,
    "senderEmail" TEXT,
    "senderPhone" TEXT,
    "recipientUserId" TEXT,
    "centerId" TEXT,
    "subject" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'new',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "User_role_idx" ON "User"("role");
