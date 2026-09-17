ALTER TABLE photo_record ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION;
ALTER TABLE photo_record ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION;
ALTER TABLE photo_record ADD COLUMN IF NOT EXISTS geocode_checked_at TIMESTAMP;

CREATE INDEX IF NOT EXISTS idx_photo_record_user_active_place
    ON photo_record (user_id, archived_at, place_name);
