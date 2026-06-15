ALTER TABLE bookings
ADD COLUMN IF NOT EXISTS preferred_start_date DATE;
