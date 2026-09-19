package com.intothepicture.domain.photorecord.entity;

import com.intothepicture.domain.contest.entity.ContestWork;
import com.intothepicture.domain.comparison.entity.ComparisonVisibility;
import com.intothepicture.domain.comparison.entity.ComparisonCrop;
import com.intothepicture.domain.user.entity.User;
import com.intothepicture.domain.userphoto.entity.UserPhoto;
import com.intothepicture.global.entity.BaseTimeEntity;
import jakarta.persistence.*;
import java.time.LocalDateTime;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Entity
@Table(name = "photo_record")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class PhotoRecord extends BaseTimeEntity {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "user_id", nullable = false) private User user;
    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "user_photo_id", nullable = false) private UserPhoto userPhoto;
    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "contest_id") private ContestWork contest;
    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "bundle_id") private PhotoRecordBundle bundle;
    @Column(name = "taken_at") private LocalDateTime takenAt;
    @Enumerated(EnumType.STRING) @Column(name = "taken_at_source", length = 32) private TakenAtSource takenAtSource;
    @Column(name = "place_name", length = 255) private String placeName;
    @Column(name = "map_region_code", length = 32) private String mapRegionCode;
    @Column(name = "map_city_code", length = 48) private String mapCityCode;
    @Column(name = "latitude") private Double latitude;
    @Column(name = "longitude") private Double longitude;
    @Column(name = "geocode_checked_at") private LocalDateTime geocodeCheckedAt;
    @Column(length = 500) private String memo;
    @Enumerated(EnumType.STRING) @Column(name = "display_mode", nullable = false, length = 20) private DisplayMode displayMode;
    @Column(name = "contest_linked_at") private LocalDateTime contestLinkedAt;
    @Enumerated(EnumType.STRING) @Column(name = "comparison_visibility", nullable = false, length = 16)
    private ComparisonVisibility comparisonVisibility = ComparisonVisibility.PUBLIC;
    @Embedded
    private ComparisonCrop comparisonCrop = new ComparisonCrop();

    @Builder
    private PhotoRecord(User user, UserPhoto userPhoto, LocalDateTime takenAt, TakenAtSource takenAtSource,
                        String placeName, String mapRegionCode, String mapCityCode, String memo) {
        this.user = user; this.userPhoto = userPhoto; this.takenAt = takenAt; this.takenAtSource = takenAtSource;
        this.placeName = placeName; this.mapRegionCode = mapRegionCode; this.mapCityCode = mapCityCode;
        this.memo = memo; this.displayMode = DisplayMode.PHOTO_ONLY;
    }

    public void attachContest(ContestWork value) {
        this.contest = value;
        this.displayMode = DisplayMode.WITH_CONTEST;
        this.contestLinkedAt = LocalDateTime.now();
        this.comparisonVisibility = ComparisonVisibility.PUBLIC;
    }

    public void attachBundle(PhotoRecordBundle value) { this.bundle = value; }

    public void detachContest() {
        this.contest = null;
        this.displayMode = DisplayMode.PHOTO_ONLY;
        this.contestLinkedAt = null;
        this.comparisonVisibility = ComparisonVisibility.PUBLIC;
    }

    public void changeComparisonVisibility(ComparisonVisibility value) { this.comparisonVisibility = value; }

    public void changeComparisonCrop(double targetAspectRatio, double zoom, double positionX, double positionY) {
        if (comparisonCrop == null) comparisonCrop = new ComparisonCrop();
        comparisonCrop.change(targetAspectRatio, zoom, positionX, positionY);
    }

    public void resetComparisonCropForReplacement() {
        if (comparisonCrop == null) comparisonCrop = new ComparisonCrop();
        comparisonCrop.resetForReplacement();
    }

    public void changeTakenAt(LocalDateTime value) { this.takenAt = value; this.takenAtSource = TakenAtSource.MANUAL; }

    public void changePlaceName(String value) {
        this.placeName = value;
        this.latitude = null;
        this.longitude = null;
        this.geocodeCheckedAt = null;
    }

    /** A deliberate map-location change prefers the selected city anchor over a stale place geocode. */
    public void changeMapLocation(String regionCode, String cityCode) {
        if (java.util.Objects.equals(mapRegionCode, regionCode) && java.util.Objects.equals(mapCityCode, cityCode)) return;
        this.mapRegionCode = regionCode;
        this.mapCityCode = cityCode;
        this.latitude = null;
        this.longitude = null;
        this.geocodeCheckedAt = null;
    }

    public boolean needsGeocoding(LocalDateTime retryBefore) {
        return mapCityCode == null && placeName != null && !placeName.isBlank() && latitude == null
            && (geocodeCheckedAt == null || geocodeCheckedAt.isBefore(retryBefore));
    }

    public void recordGeocoding(Double latitude, Double longitude) {
        this.latitude = latitude;
        this.longitude = longitude;
        this.geocodeCheckedAt = LocalDateTime.now();
    }

    public void changeMemo(String value) { this.memo = value; }

    public void changeDisplayMode(DisplayMode value) { this.displayMode = value; }

}
