ALTER TABLE driving_schools
  ADD COLUMN IF NOT EXISTS license_document_path TEXT,
  ADD COLUMN IF NOT EXISTS owner_id_proof_path TEXT,
  ADD COLUMN IF NOT EXISTS license_document_mime_type TEXT,
  ADD COLUMN IF NOT EXISTS owner_id_proof_mime_type TEXT,
  ADD COLUMN IF NOT EXISTS license_document_uploaded_at TIMESTAMP,
  ADD COLUMN IF NOT EXISTS owner_id_proof_uploaded_at TIMESTAMP;

ALTER TABLE IF EXISTS school_documents
  ADD COLUMN IF NOT EXISTS document_path TEXT,
  ADD COLUMN IF NOT EXISTS mime_type TEXT;
