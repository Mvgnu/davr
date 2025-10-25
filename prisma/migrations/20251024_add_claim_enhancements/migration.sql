-- Add new fields to RecyclingCenterClaim for document uploads and admin workflow
ALTER TABLE "RecyclingCenterClaim" ADD COLUMN "documents_json" JSONB;
ALTER TABLE "RecyclingCenterClaim" ADD COLUMN "admin_response" TEXT;
ALTER TABLE "RecyclingCenterClaim" ADD COLUMN "reviewed_by_id" TEXT;
ALTER TABLE "RecyclingCenterClaim" ADD COLUMN "reviewed_at" TIMESTAMP(3);
ALTER TABLE "RecyclingCenterClaim" ADD COLUMN "account_created" BOOLEAN DEFAULT false;

-- Add foreign key for reviewed_by (admin user)
ALTER TABLE "RecyclingCenterClaim" ADD CONSTRAINT "RecyclingCenterClaim_reviewed_by_id_fkey"
  FOREIGN KEY ("reviewed_by_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Add index for reviewed_by
CREATE INDEX "RecyclingCenterClaim_reviewed_by_id_idx" ON "RecyclingCenterClaim"("reviewed_by_id");

-- Convert status to enum for better type safety
DO $$ BEGIN
  CREATE TYPE "ClaimStatus" AS ENUM ('pending', 'approved', 'rejected', 'more_info_requested');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Note: We can't directly alter the column type if there's data, so we'll keep status as String for now
-- In production, you'd want to migrate the data first
