-- Kakao Local keyword-search document IDs provide a stable Kakao Map directions target.
-- They are nullable because some synchronized shooting locations are not Kakao places.
ALTER TABLE contest_work
    ADD COLUMN kakao_place_id VARCHAR(32) NULL;

CREATE INDEX idx_contest_work_kakao_place_id_missing
    ON contest_work (id)
    WHERE kakao_place_id IS NULL;
