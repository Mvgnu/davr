-- CreateEnum for RecyclingDifficulty
CREATE TYPE "RecyclingDifficulty" AS ENUM ('EASY', 'MEDIUM', 'HARD');

-- AlterTable Material - Add new columns for enhanced UX
ALTER TABLE "Material" ADD COLUMN "recyclability_percentage" INTEGER,
ADD COLUMN "recycling_difficulty" "RecyclingDifficulty",
ADD COLUMN "category_icon" TEXT,
ADD COLUMN "environmental_impact" JSONB,
ADD COLUMN "preparation_tips" JSONB,
ADD COLUMN "acceptance_rate" INTEGER,
ADD COLUMN "average_price_per_unit" DOUBLE PRECISION,
ADD COLUMN "price_unit" TEXT,
ADD COLUMN "fun_fact" TEXT,
ADD COLUMN "annual_recycling_volume" DOUBLE PRECISION;

-- CreateIndex for performance optimization
CREATE INDEX "Material_recyclability_percentage_idx" ON "Material"("recyclability_percentage");
CREATE INDEX "Material_recycling_difficulty_idx" ON "Material"("recycling_difficulty");
CREATE INDEX "Material_category_icon_idx" ON "Material"("category_icon");
