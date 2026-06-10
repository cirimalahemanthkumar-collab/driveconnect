CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NULL REFERENCES users(id) ON DELETE CASCADE,
  recipient_role TEXT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL,
  entity_type TEXT NULL,
  entity_id UUID NULL,
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  read_at TIMESTAMP NULL
);

ALTER TABLE notifications
  ADD COLUMN IF NOT EXISTS recipient_role TEXT,
  ADD COLUMN IF NOT EXISTS entity_type TEXT,
  ADD COLUMN IF NOT EXISTS entity_id UUID,
  ADD COLUMN IF NOT EXISTS data JSONB NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS is_read BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS read_at TIMESTAMP;

ALTER TABLE notifications
  ALTER COLUMN data SET DEFAULT '{}'::jsonb,
  ALTER COLUMN is_read SET DEFAULT false;

UPDATE notifications
SET is_read = COALESCE(is_read, false),
    data = COALESCE(data, '{}'::jsonb);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id_created_at
  ON notifications (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_notifications_recipient_role_created_at
  ON notifications (recipient_role, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_notifications_is_read
  ON notifications (is_read);
