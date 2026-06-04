ALTER TABLE "DrivingSchool" ADD COLUMN IF NOT EXISTS "status" "SchoolVerificationStatus" NOT NULL DEFAULT 'PENDING';
ALTER TABLE "DrivingSchool" ADD COLUMN IF NOT EXISTS "state" TEXT NOT NULL DEFAULT '';
ALTER TABLE "DrivingSchool" ADD COLUMN IF NOT EXISTS "pincode" TEXT NOT NULL DEFAULT '';
ALTER TABLE "DrivingSchool" ADD COLUMN IF NOT EXISTS "owner_name" TEXT NOT NULL DEFAULT '';
ALTER TABLE "DrivingSchool" ADD COLUMN IF NOT EXISTS "owner_phone" TEXT NOT NULL DEFAULT '';
ALTER TABLE "DrivingSchool" ADD COLUMN IF NOT EXISTS "owner_email" TEXT NOT NULL DEFAULT '';
ALTER TABLE "DrivingSchool" ADD COLUMN IF NOT EXISTS "google_maps_link" TEXT NOT NULL DEFAULT '';
ALTER TABLE "DrivingSchool" ADD COLUMN IF NOT EXISTS "license_number" TEXT NOT NULL DEFAULT '';
ALTER TABLE "DrivingSchool" ADD COLUMN IF NOT EXISTS "license_document_url" TEXT NOT NULL DEFAULT '';
ALTER TABLE "DrivingSchool" ADD COLUMN IF NOT EXISTS "owner_id_proof_url" TEXT NOT NULL DEFAULT '';
ALTER TABLE "DrivingSchool" ADD COLUMN IF NOT EXISTS "pan_number" TEXT NOT NULL DEFAULT '';
ALTER TABLE "DrivingSchool" ADD COLUMN IF NOT EXISTS "gst_number" TEXT;
ALTER TABLE "DrivingSchool" ADD COLUMN IF NOT EXISTS "bank_account_name" TEXT NOT NULL DEFAULT '';
ALTER TABLE "DrivingSchool" ADD COLUMN IF NOT EXISTS "bank_account_number" TEXT NOT NULL DEFAULT '';
ALTER TABLE "DrivingSchool" ADD COLUMN IF NOT EXISTS "ifsc" TEXT NOT NULL DEFAULT '';
ALTER TABLE "DrivingSchool" ADD COLUMN IF NOT EXISTS "upi_id" TEXT NOT NULL DEFAULT '';
ALTER TABLE "DrivingSchool" ADD COLUMN IF NOT EXISTS "working_hours" TEXT NOT NULL DEFAULT '';
ALTER TABLE "DrivingSchool" ADD COLUMN IF NOT EXISTS "pickup_drop_available" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "DrivingSchool" ADD COLUMN IF NOT EXISTS "service_radius_km" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "DrivingSchool" ADD COLUMN IF NOT EXISTS "verification_status" "SchoolVerificationStatus" NOT NULL DEFAULT 'PENDING';
ALTER TABLE "DrivingSchool" ADD COLUMN IF NOT EXISTS "rejection_reason" TEXT;
ALTER TABLE "DrivingSchool" ADD COLUMN IF NOT EXISTS "verification_submitted_at" TIMESTAMP(3);
ALTER TABLE "DrivingSchool" ADD COLUMN IF NOT EXISTS "verification_reviewed_at" TIMESTAMP(3);
ALTER TABLE "DrivingSchool" ADD COLUMN IF NOT EXISTS "verification_reviewed_by" TEXT;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'DrivingSchool'
      AND column_name = 'verificationStatus'
  ) THEN
    UPDATE "DrivingSchool"
    SET "verification_status" = CASE "verificationStatus"
      WHEN 'VERIFIED' THEN 'APPROVED'::"SchoolVerificationStatus"
      WHEN 'UNDER_REVIEW' THEN 'PENDING'::"SchoolVerificationStatus"
      ELSE "verificationStatus"
    END;
  END IF;
END $$;

UPDATE "DrivingSchool"
SET "status" = CASE "verification_status"
  WHEN 'VERIFIED' THEN 'APPROVED'::"SchoolVerificationStatus"
  WHEN 'UNDER_REVIEW' THEN 'PENDING'::"SchoolVerificationStatus"
  ELSE "verification_status"
END;

UPDATE "DrivingSchool"
SET
  "owner_name" = COALESCE(NULLIF("owner_name", ''), "name"),
  "owner_phone" = COALESCE(NULLIF("owner_phone", ''), "phone"),
  "owner_email" = COALESCE(NULLIF("owner_email", ''), COALESCE("email", '')),
  "pickup_drop_available" = "pickupAvailable"
WHERE "owner_name" = ''
   OR "owner_phone" = ''
   OR "owner_email" = ''
   OR "pickup_drop_available" = false;
