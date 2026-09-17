ALTER TABLE photo_record ADD COLUMN IF NOT EXISTS map_region_code VARCHAR(32);
ALTER TABLE photo_record ADD COLUMN IF NOT EXISTS map_city_code VARCHAR(48);

CREATE INDEX IF NOT EXISTS idx_photo_record_user_active_map_city
    ON photo_record (user_id, archived_at, map_city_code);
