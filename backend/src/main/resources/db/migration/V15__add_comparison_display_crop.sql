ALTER TABLE photo_record
    ADD COLUMN comparison_target_aspect_ratio DOUBLE PRECISION NOT NULL DEFAULT 1.3333333333333333,
    ADD COLUMN comparison_crop_zoom DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    ADD COLUMN comparison_crop_position_x DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    ADD COLUMN comparison_crop_position_y DOUBLE PRECISION NOT NULL DEFAULT 0.0;

ALTER TABLE photo_record
    ADD CONSTRAINT ck_photo_record_comparison_target_aspect_ratio
    CHECK (comparison_target_aspect_ratio >= 0.25 AND comparison_target_aspect_ratio <= 4.0),
    ADD CONSTRAINT ck_photo_record_comparison_crop_zoom
    CHECK (comparison_crop_zoom >= 1.0 AND comparison_crop_zoom <= 4.0),
    ADD CONSTRAINT ck_photo_record_comparison_crop_position_x
    CHECK (comparison_crop_position_x >= -1.0 AND comparison_crop_position_x <= 1.0),
    ADD CONSTRAINT ck_photo_record_comparison_crop_position_y
    CHECK (comparison_crop_position_y >= -1.0 AND comparison_crop_position_y <= 1.0);
