-- Add composite indexes for improved query performance

-- RecyclingCenter indexes for common query patterns
CREATE INDEX IF NOT EXISTS "RecyclingCenter_city_verification_status_idx" ON "RecyclingCenter"("city", "verification_status");
CREATE INDEX IF NOT EXISTS "RecyclingCenter_verification_status_latitude_longitude_idx" ON "RecyclingCenter"("verification_status", "latitude", "longitude");
CREATE INDEX IF NOT EXISTS "RecyclingCenter_created_at_idx" ON "RecyclingCenter"("created_at");

-- MarketplaceListing indexes for filtering combinations
CREATE INDEX IF NOT EXISTS "MarketplaceListing_status_type_material_id_idx" ON "MarketplaceListing"("status", "type", "material_id");
CREATE INDEX IF NOT EXISTS "MarketplaceListing_status_created_at_idx" ON "MarketplaceListing"("status", "created_at");
CREATE INDEX IF NOT EXISTS "MarketplaceListing_seller_id_status_idx" ON "MarketplaceListing"("seller_id", "status");

-- Material index for search autocomplete
CREATE INDEX IF NOT EXISTS "Material_name_idx" ON "Material"("name");
CREATE INDEX IF NOT EXISTS "Material_parent_id_idx" ON "Material"("parent_id");

-- Review index for rating calculations
CREATE INDEX IF NOT EXISTS "Review_centerId_rating_idx" ON "Review"("centerId", "rating");
