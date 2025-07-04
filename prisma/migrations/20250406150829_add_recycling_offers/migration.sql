-- CreateTable
CREATE TABLE "RecyclingCenterOffer" (
    "id" TEXT NOT NULL,
    "recycling_center_id" TEXT NOT NULL,
    "material_id" TEXT NOT NULL,
    "price_per_unit" DOUBLE PRECISION,
    "unit" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RecyclingCenterOffer_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "RecyclingCenterOffer_recycling_center_id_material_id_key" ON "RecyclingCenterOffer"("recycling_center_id", "material_id");

-- AddForeignKey
ALTER TABLE "RecyclingCenterOffer" ADD CONSTRAINT "RecyclingCenterOffer_recycling_center_id_fkey" FOREIGN KEY ("recycling_center_id") REFERENCES "RecyclingCenter"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecyclingCenterOffer" ADD CONSTRAINT "RecyclingCenterOffer_material_id_fkey" FOREIGN KEY ("material_id") REFERENCES "Material"("id") ON DELETE CASCADE ON UPDATE CASCADE;
