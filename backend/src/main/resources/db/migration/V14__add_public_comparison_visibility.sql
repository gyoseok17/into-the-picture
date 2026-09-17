ALTER TABLE photo_record
    ADD COLUMN comparison_visibility VARCHAR(16) NOT NULL DEFAULT 'PUBLIC';

ALTER TABLE photo_record
    ADD CONSTRAINT ck_photo_record_comparison_visibility
    CHECK (comparison_visibility IN ('PUBLIC', 'PRIVATE'));

CREATE INDEX idx_photo_record_public_contest
    ON photo_record (contest_id, comparison_visibility, contest_linked_at DESC)
    WHERE contest_id IS NOT NULL AND archived_at IS NULL;
