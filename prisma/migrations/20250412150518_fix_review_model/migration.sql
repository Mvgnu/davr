/*
  Warnings:

  - You are about to drop the column `recycling_center_id` on the `Review` table. All the data in the column will be lost.
  - You are about to drop the column `user_id` on the `Review` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[userId,centerId]` on the table `Review` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `centerId` to the `Review` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userId` to the `Review` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Review" DROP CONSTRAINT "Review_recycling_center_id_fkey";

-- DropIndex
DROP INDEX "Review_recycling_center_id_idx";

-- DropIndex
DROP INDEX "Review_user_id_idx";

-- AlterTable
ALTER TABLE "Review" DROP COLUMN "recycling_center_id",
DROP COLUMN "user_id",
ADD COLUMN     "centerId" TEXT NOT NULL,
ADD COLUMN     "userId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL;

-- CreateIndex
CREATE INDEX "Review_userId_idx" ON "Review"("userId");

-- CreateIndex
CREATE INDEX "Review_centerId_idx" ON "Review"("centerId");

-- CreateIndex
CREATE UNIQUE INDEX "Review_userId_centerId_key" ON "Review"("userId", "centerId");

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_centerId_fkey" FOREIGN KEY ("centerId") REFERENCES "RecyclingCenter"("id") ON DELETE CASCADE ON UPDATE CASCADE;
