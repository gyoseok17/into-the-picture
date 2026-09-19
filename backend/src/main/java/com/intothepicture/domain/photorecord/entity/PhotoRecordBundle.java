package com.intothepicture.domain.photorecord.entity;

import com.intothepicture.domain.user.entity.User;
import com.intothepicture.global.entity.BaseTimeEntity;
import jakarta.persistence.*;
import java.time.LocalDateTime;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Entity
@Table(name = "photo_record_bundle")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class PhotoRecordBundle extends BaseTimeEntity {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "user_id", nullable = false) private User user;
    @Column(name = "taken_at") private LocalDateTime takenAt;
    @Column(name = "ended_at") private LocalDateTime endedAt;
    @Column(name = "place_name", length = 255) private String placeName;
    @Column(name = "map_region_code", length = 32) private String mapRegionCode;
    @Column(name = "map_city_code", length = 48) private String mapCityCode;
    @Column(length = 500) private String memo;
    @Builder
    private PhotoRecordBundle(User user, LocalDateTime takenAt, LocalDateTime endedAt, String placeName, String mapRegionCode,
                              String mapCityCode, String memo) {
        this.user = user;
        this.takenAt = takenAt;
        this.endedAt = endedAt;
        this.placeName = placeName;
        this.mapRegionCode = mapRegionCode;
        this.mapCityCode = mapCityCode;
        this.memo = memo;
    }
}
