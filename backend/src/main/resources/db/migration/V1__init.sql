-- V1: 초기 스키마 (User, UserPhoto, Favorite, ContestWork) — docs/03 기준.
-- enum 은 VARCHAR + 애플리케이션 enum(@Enumerated STRING)으로 매핑 → 새 enum 값 추가 시 스키마 불변(확장원칙).
-- contest_work 의 lat/lng/crowd_attraction_name 은 나중에 채우는 보강 컬럼(nullable, 배치로 갱신).

CREATE TABLE users (
    id                BIGINT       NOT NULL AUTO_INCREMENT,
    kakao_id          BIGINT       NOT NULL,
    nickname          VARCHAR(50)  NOT NULL,
    profile_image_url VARCHAR(500) NULL,
    email             VARCHAR(255) NULL,
    role              VARCHAR(20)  NOT NULL DEFAULT 'USER',
    created_at        DATETIME     NULL,
    updated_at        DATETIME     NULL,
    PRIMARY KEY (id),
    CONSTRAINT uk_users_kakao_id UNIQUE (kakao_id)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

CREATE TABLE user_photo (
    id                BIGINT       NOT NULL AUTO_INCREMENT,
    user_id           BIGINT       NOT NULL,
    storage_key       VARCHAR(500) NOT NULL,
    url               VARCHAR(500) NOT NULL,
    original_filename VARCHAR(255) NULL,
    content_type      VARCHAR(100) NULL,
    file_size         BIGINT       NULL,
    taken_at          DATETIME     NULL,
    memo              VARCHAR(500) NULL,
    created_at        DATETIME     NULL,
    updated_at        DATETIME     NULL,
    PRIMARY KEY (id),
    CONSTRAINT fk_user_photo_user FOREIGN KEY (user_id) REFERENCES users (id)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

CREATE TABLE favorite (
    id                 BIGINT       NOT NULL AUTO_INCREMENT,
    user_id            BIGINT       NOT NULL,
    target_type        VARCHAR(20)  NOT NULL,
    source             VARCHAR(20)  NOT NULL,
    external_id        VARCHAR(255) NOT NULL,
    snapshot_title     VARCHAR(255) NULL,
    snapshot_image_url VARCHAR(500) NULL,
    created_at         DATETIME     NULL,
    PRIMARY KEY (id),
    CONSTRAINT uk_favorite_user_target_external UNIQUE (user_id, target_type, external_id),
    CONSTRAINT fk_favorite_user FOREIGN KEY (user_id) REFERENCES users (id)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

CREATE TABLE contest_work (
    id                    BIGINT       NOT NULL AUTO_INCREMENT,
    content_id            VARCHAR(50)  NOT NULL,
    -- 원문(sync)
    title                 VARCHAR(255) NULL,
    title_en              VARCHAR(255) NULL,
    location              VARCHAR(255) NULL,
    location_en           VARCHAR(255) NULL,
    sido_code             VARCHAR(10)  NULL,
    photographer          VARCHAR(100) NULL,
    photographer_en       VARCHAR(100) NULL,
    film_month            VARCHAR(6)   NULL,
    award_raw             VARCHAR(100) NULL,
    keywords_raw          TEXT         NULL,
    org_image_url         VARCHAR(500) NULL,
    thumb_image_url       VARCHAR(500) NULL,
    copyright_code        VARCHAR(20)  NULL,
    external_reg_dt       DATETIME     NULL,
    external_mdfcn_dt     DATETIME     NULL,
    -- 파싱값(sync, 파서는 external)
    sido                  VARCHAR(50)  NULL,
    sigungu               VARCHAR(50)  NULL,
    award_division        VARCHAR(50)  NULL,
    award_grade           VARCHAR(50)  NULL,
    season                VARCHAR(20)  NULL,
    -- 보강값(geocode/crowd-match 배치, null 허용)
    lat                   DOUBLE       NULL,
    lng                   DOUBLE       NULL,
    crowd_attraction_name VARCHAR(100) NULL,
    -- 메타
    synced_at             DATETIME     NULL,
    PRIMARY KEY (id),
    CONSTRAINT uk_contest_work_content_id UNIQUE (content_id)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

CREATE INDEX idx_contest_work_season ON contest_work (season);
CREATE INDEX idx_contest_work_award_grade ON contest_work (award_grade);
CREATE INDEX idx_contest_work_sigungu ON contest_work (sigungu);
