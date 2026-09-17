-- V5 already moved each existing upload and comparison into photo_record.
-- Keep that data unchanged; this index supports the active/archive album views
-- ordered by the record's own timestamp fallback.
CREATE INDEX IF NOT EXISTS idx_photo_record_user_archived_created
    ON photo_record (user_id, archived_at, created_at DESC);
