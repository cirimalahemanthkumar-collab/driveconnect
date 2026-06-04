ALTER TABLE driving_schools
  ADD COLUMN IF NOT EXISTS owner_name TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS owner_phone TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS owner_email TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS google_maps_link TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS license_number TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS license_document_url TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS owner_id_proof_url TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS pan_number TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS gst_number TEXT,
  ADD COLUMN IF NOT EXISTS bank_account_name TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS bank_account_number TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS ifsc TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS upi_id TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS working_hours TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS pickup_drop_available BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS service_radius_km INTEGER NOT NULL DEFAULT 10,
  ADD COLUMN IF NOT EXISTS verification_status TEXT NOT NULL DEFAULT 'PENDING',
  ADD COLUMN IF NOT EXISTS rejection_reason TEXT,
  ADD COLUMN IF NOT EXISTS verification_submitted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS verification_reviewed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS verification_reviewed_by TEXT;

ALTER TABLE driving_schools
  ALTER COLUMN verification_status SET DEFAULT 'PENDING';

UPDATE driving_schools
SET verification_status = CASE
    WHEN status::text = 'VERIFIED' THEN 'APPROVED'
    WHEN status::text = 'UNDER_REVIEW' THEN 'PENDING'
    WHEN status::text IN ('APPROVED', 'PENDING', 'REJECTED', 'SUSPENDED') THEN status::text
    ELSE 'PENDING'
  END
WHERE verification_status IS NULL
   OR verification_status = ''
   OR verification_status = 'UNDER_REVIEW'
   OR verification_status = 'VERIFIED';

UPDATE driving_schools ds
SET
  owner_name = COALESCE(NULLIF(ds.owner_name, ''), u.full_name, ''),
  owner_phone = COALESCE(NULLIF(ds.owner_phone, ''), u.phone, ''),
  owner_email = COALESCE(NULLIF(ds.owner_email, ''), u.email, ''),
  verification_submitted_at = COALESCE(ds.verification_submitted_at, ds.updated_at, ds.created_at)
FROM users u
WHERE ds.owner_user_id = u.id
  AND (
    ds.owner_name = ''
    OR ds.owner_phone = ''
    OR ds.owner_email = ''
    OR ds.verification_submitted_at IS NULL
  );

CREATE INDEX IF NOT EXISTS idx_driving_schools_verification_status
  ON driving_schools (status, verification_status);

CREATE INDEX IF NOT EXISTS idx_driving_schools_verification_submitted_at
  ON driving_schools (verification_submitted_at);
