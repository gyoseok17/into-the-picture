package com.intothepicture.domain.userphoto.dto;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonSetter;
import com.intothepicture.domain.photorecord.entity.DisplayMode;
import java.time.LocalDateTime;

/**
 * PATCH 요청에서 필드 누락과 명시적인 null(메타데이터 비우기)을 구분한다.
 */
public final class UpdatePhotoRecordRequest {
    private boolean takenAtProvided;
    private LocalDateTime takenAt;
    private boolean placeNameProvided;
    private String placeName;
    private boolean mapRegionCodeProvided;
    private String mapRegionCode;
    private boolean mapCityCodeProvided;
    private String mapCityCode;
    private boolean memoProvided;
    private String memo;
    private Boolean archived;
    private DisplayMode displayMode;

    @JsonSetter("takenAt")
    public void setTakenAt(LocalDateTime value) { this.takenAtProvided = true; this.takenAt = value; }

    @JsonSetter("placeName")
    public void setPlaceName(String value) { this.placeNameProvided = true; this.placeName = value; }

    @JsonSetter("mapRegionCode")
    public void setMapRegionCode(String value) { this.mapRegionCodeProvided = true; this.mapRegionCode = value; }

    @JsonSetter("mapCityCode")
    public void setMapCityCode(String value) { this.mapCityCodeProvided = true; this.mapCityCode = value; }

    @JsonSetter("memo")
    public void setMemo(String value) { this.memoProvided = true; this.memo = value; }

    @JsonSetter("archived")
    public void setArchived(Boolean value) { this.archived = value; }

    @JsonSetter("displayMode")
    public void setDisplayMode(DisplayMode value) { this.displayMode = value; }

    @JsonIgnore public boolean hasTakenAt() { return takenAtProvided; }
    @JsonIgnore public LocalDateTime takenAt() { return takenAt; }
    @JsonIgnore public boolean hasPlaceName() { return placeNameProvided; }
    @JsonIgnore public String placeName() { return placeName; }
    @JsonIgnore public boolean hasMapRegionCode() { return mapRegionCodeProvided; }
    @JsonIgnore public String mapRegionCode() { return mapRegionCode; }
    @JsonIgnore public boolean hasMapCityCode() { return mapCityCodeProvided; }
    @JsonIgnore public String mapCityCode() { return mapCityCode; }
    @JsonIgnore public boolean hasMemo() { return memoProvided; }
    @JsonIgnore public String memo() { return memo; }
    @JsonIgnore public Boolean archived() { return archived; }
    @JsonIgnore public DisplayMode displayMode() { return displayMode; }
}
