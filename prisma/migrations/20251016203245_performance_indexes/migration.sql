-- Drop indexes if they exist (using IF EXISTS to prevent errors)
DROP INDEX IF EXISTS "public"."MarketplaceListing_seller_id_status_idx";
DROP INDEX IF EXISTS "public"."MarketplaceListing_status_created_at_idx";
DROP INDEX IF EXISTS "public"."MarketplaceListing_status_type_material_id_idx";
DROP INDEX IF EXISTS "public"."Material_name_idx";
DROP INDEX IF EXISTS "public"."Material_parent_id_idx";
DROP INDEX IF EXISTS "public"."RecyclingCenter_city_verification_status_idx";
DROP INDEX IF EXISTS "public"."RecyclingCenter_created_at_idx";
DROP INDEX IF EXISTS "public"."RecyclingCenter_verification_status_latitude_longitude_idx";
DROP INDEX IF EXISTS "public"."Review_centerId_rating_idx";

-- Create optimized performance indexes
CREATE INDEX IF NOT EXISTS "RecyclingCenter_city_verification_status_idx" ON "RecyclingCenter"("city", "verification_status");
CREATE INDEX IF NOT EXISTS "RecyclingCenter_verification_status_latitude_longitude_idx" ON "RecyclingCenter"("verification_status", "latitude", "longitude");
CREATE INDEX IF NOT EXISTS "RecyclingCenter_created_at_idx" ON "RecyclingCenter"("created_at" DESC);

CREATE INDEX IF NOT EXISTS "MarketplaceListing_status_type_material_id_idx" ON "MarketplaceListing"("status", "type", "material_id");
CREATE INDEX IF NOT EXISTS "MarketplaceListing_seller_id_status_idx" ON "MarketplaceListing"("seller_id", "status");
CREATE INDEX IF NOT EXISTS "MarketplaceListing_status_created_at_idx" ON "MarketplaceListing"("status", "created_at" DESC);

CREATE INDEX IF NOT EXISTS "Material_name_idx" ON "Material"("name");
CREATE INDEX IF NOT EXISTS "Material_parent_id_idx" ON "Material"("parent_id");

CREATE INDEX IF NOT EXISTS "Review_centerId_rating_idx" ON "Review"("centerId", "rating");
