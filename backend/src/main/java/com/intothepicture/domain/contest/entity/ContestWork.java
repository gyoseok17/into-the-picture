package com.intothepicture.domain.contest.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import java.time.LocalDateTime;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * 공모전 수상작 캐시(docs/03). 외부 PhokoAwrdService 응답을 동기화 저장.
 * 원문 + 파싱값을 함께 저장(파싱 로직이 바뀌어도 원문 보존 → 재파싱 가능).
 * lat/lng/crowdAttractionName 은 나중에 채우는 보강 필드(null 허용)다. 지도 권역 코드는
 * 수상작별로 검증해 고정한 참조 데이터라 sync 시에도 함께 저장한다.
 *
 * <p>채우는 주체: 원문·파싱값은 external 의 sync(빌더로 생성),
 * 보강값은 geocode/crowd-match 배치 또는 상세 on-demand(assignXxx 메서드).
 */
@Getter
@Entity
@Table(
    name = "contest_work",
    uniqueConstraints = @UniqueConstraint(name = "uk_contest_work_content_id", columnNames = "content_id"),
    indexes = {
        @Index(name = "idx_contest_work_season", columnList = "season"),
        @Index(name = "idx_contest_work_award_grade", columnList = "award_grade"),
        @Index(name = "idx_contest_work_sigungu", columnList = "sigungu")
    }
)
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class ContestWork {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "content_id", nullable = false, unique = true, length = 50)
    private String contentId;

    // --- 원문(sync) ---
    @Column(length = 255)
    private String title;

    @Column(name = "title_en", length = 255)
    private String titleEn;

    @Column(length = 255)
    private String location;

    @Column(name = "location_en", length = 255)
    private String locationEn;

    @Column(name = "sido_code", length = 10)
    private String sidoCode;

    @Column(length = 100)
    private String photographer;

    @Column(name = "photographer_en", length = 100)
    private String photographerEn;

    @Column(name = "film_month", length = 6)
    private String filmMonth;

    @Column(name = "award_raw", length = 100)
    private String awardRaw;

    @Column(name = "keywords_raw", columnDefinition = "TEXT")
    private String keywordsRaw;

    @Column(name = "org_image_url", length = 500)
    private String orgImageUrl;

    @Column(name = "thumb_image_url", length = 500)
    private String thumbImageUrl;

    @Column(name = "copyright_code", length = 20)
    private String copyrightCode;

    @Column(name = "external_reg_dt")
    private LocalDateTime externalRegDt;

    @Column(name = "external_mdfcn_dt")
    private LocalDateTime externalMdfcnDt;

    // --- 파싱값(sync, 파서는 external) ---
    @Column(length = 50)
    private String sido;

    @Column(length = 50)
    private String sigungu;

    @Column(name = "award_division", length = 50)
    private String awardDivision;

    @Column(name = "award_grade", length = 50)
    private String awardGrade;

    @Column(length = 20)
    private String season;

    // --- 검증된 지도 위치(sync, 명시 데이터) ---
    @Column(name = "map_region_code", length = 20)
    private String mapRegionCode;

    @Column(name = "map_city_code", length = 50)
    private String mapCityCode;

    @Column(name = "kakao_place_id", length = 32)
    private String kakaoPlaceId;

    // --- 보강값(geocode/crowd-match 배치, null 허용) ---
    private Double lat;

    private Double lng;

    @Column(name = "crowd_attraction_name", length = 100)
    private String crowdAttractionName;

    // --- 메타 ---
    @Column(name = "synced_at")
    private LocalDateTime syncedAt;

    @Builder
    private ContestWork(String contentId, String title, String titleEn, String location, String locationEn,
                        String sidoCode, String sido, String sigungu, String photographer, String photographerEn,
                        String filmMonth, String awardRaw, String awardDivision, String awardGrade, String keywordsRaw,
                        String season, String mapRegionCode, String mapCityCode,
                        String orgImageUrl, String thumbImageUrl, String copyrightCode,
                        Double lat, Double lng, String crowdAttractionName,
                        LocalDateTime externalRegDt, LocalDateTime externalMdfcnDt, LocalDateTime syncedAt) {
        this.contentId = contentId;
        this.title = title;
        this.titleEn = titleEn;
        this.location = location;
        this.locationEn = locationEn;
        this.sidoCode = sidoCode;
        this.sido = sido;
        this.sigungu = sigungu;
        this.photographer = photographer;
        this.photographerEn = photographerEn;
        this.filmMonth = filmMonth;
        this.awardRaw = awardRaw;
        this.awardDivision = awardDivision;
        this.awardGrade = awardGrade;
        this.keywordsRaw = keywordsRaw;
        this.season = season;
        this.mapRegionCode = mapRegionCode;
        this.mapCityCode = mapCityCode;
        this.orgImageUrl = orgImageUrl;
        this.thumbImageUrl = thumbImageUrl;
        this.copyrightCode = copyrightCode;
        this.lat = lat;
        this.lng = lng;
        this.crowdAttractionName = crowdAttractionName;
        this.externalRegDt = externalRegDt;
        this.externalMdfcnDt = externalMdfcnDt;
        this.syncedAt = syncedAt;
    }

    /** 지오코딩 결과 캐시(보강). 좌표가 없을 때 on-demand/배치로 채운다. */
    public void assignCoordinates(double lat, double lng) {
        this.lat = lat;
        this.lng = lng;
    }

    /** Stores only a provider-returned Kakao place ID; blank values are ignored. */
    public void assignKakaoPlaceId(String value) {
        if (value != null && !value.isBlank()) this.kakaoPlaceId = value;
    }

    /** 집중률 관광지명 매칭 결과 저장(보강). */
    public void assignCrowdAttraction(String attractionName) {
        this.crowdAttractionName = attractionName;
    }

    public boolean hasCoordinates() {
        return lat != null && lng != null;
    }

    /** 집중률 매칭이 되어 있는지(= /crowd 호출 가능). docs/04: crowdAvailable. */
    public boolean isCrowdAvailable() {
        return crowdAttractionName != null;
    }
}
