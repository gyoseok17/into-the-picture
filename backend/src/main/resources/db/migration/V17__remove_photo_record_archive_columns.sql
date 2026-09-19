-- M9 removes the archive feature.  Drop every index whose definition depends on
-- archived_at before dropping the two obsolete columns.
DROP INDEX IF EXISTS idx_photo_record_user_active_time;
DROP INDEX IF EXISTS idx_photo_record_user_active_place;
DROP INDEX IF EXISTS idx_photo_record_user_archived_created;
DROP INDEX IF EXISTS idx_photo_record_user_active_map_city;
DROP INDEX IF EXISTS idx_photo_record_public_contest;
DROP INDEX IF EXISTS idx_photo_record_bundle_user_active_time;

ALTER TABLE photo_record DROP COLUMN IF EXISTS archived_at;
ALTER TABLE photo_record_bundle DROP COLUMN IF EXISTS archived_at;

-- Keep the useful access paths, without the removed archive state.
CREATE INDEX IF NOT EXISTS idx_photo_record_user_taken_created
    ON photo_record (user_id, taken_at DESC, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_photo_record_user_created
    ON photo_record (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_photo_record_user_place
    ON photo_record (user_id, place_name);
CREATE INDEX IF NOT EXISTS idx_photo_record_user_map_city
    ON photo_record (user_id, map_city_code);
CREATE INDEX IF NOT EXISTS idx_photo_record_public_contest
    ON photo_record (contest_id, comparison_visibility, contest_linked_at DESC)
    WHERE contest_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_photo_record_bundle_user_time
    ON photo_record_bundle (user_id, taken_at DESC, created_at DESC);
