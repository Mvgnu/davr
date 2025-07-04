/*
  Warnings:

  - You are about to drop the column `owner_id` on the `RecyclingCenter` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[email]` on the table `RecyclingCenter` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "DayOfWeek" AS ENUM ('MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY');

-- CreateEnum
CREATE TYPE "VerificationStatus" AS ENUM ('PENDING', 'VERIFIED', 'REJECTED');

-- DropForeignKey
ALTER TABLE "RecyclingCenter" DROP CONSTRAINT "RecyclingCenter_owner_id_fkey";

-- DropIndex
DROP INDEX "RecyclingCenter_owner_id_idx";

-- AlterTable
ALTER TABLE "RecyclingCenter" DROP COLUMN "owner_id",
ADD COLUMN     "address_details" TEXT,
ADD COLUMN     "country" TEXT DEFAULT 'Germany',
ADD COLUMN     "description" TEXT,
ADD COLUMN     "email" TEXT,
ADD COLUMN     "managedById" TEXT,
ADD COLUMN     "verification_status" "VerificationStatus" NOT NULL DEFAULT 'PENDING';

-- CreateTable
CREATE TABLE "WorkingHours" (
    "id" TEXT NOT NULL,
    "recycling_center_id" TEXT NOT NULL,
    "day_of_week" "DayOfWeek" NOT NULL,
    "open_time" TEXT NOT NULL,
    "close_time" TEXT NOT NULL,
    "is_closed" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "WorkingHours_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Review" (
    "id" TEXT NOT NULL,
    "recycling_center_id" TEXT NOT NULL,
    "user_id" TEXT,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Review_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "WorkingHours_recycling_center_id_day_of_week_key" ON "WorkingHours"("recycling_center_id", "day_of_week");

-- CreateIndex
CREATE INDEX "Review_recycling_center_id_idx" ON "Review"("recycling_center_id");

-- CreateIndex
CREATE INDEX "Review_user_id_idx" ON "Review"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "RecyclingCenter_email_key" ON "RecyclingCenter"("email");

-- CreateIndex
CREATE INDEX "RecyclingCenter_managedById_idx" ON "RecyclingCenter"("managedById");

-- AddForeignKey
ALTER TABLE "RecyclingCenter" ADD CONSTRAINT "RecyclingCenter_managedById_fkey" FOREIGN KEY ("managedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkingHours" ADD CONSTRAINT "WorkingHours_recycling_center_id_fkey" FOREIGN KEY ("recycling_center_id") REFERENCES "RecyclingCenter"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_recycling_center_id_fkey" FOREIGN KEY ("recycling_center_id") REFERENCES "RecyclingCenter"("id") ON DELETE CASCADE ON UPDATE CASCADE;
