package com.intothepicture.domain.photorecord.entity;

import com.intothepicture.domain.user.entity.User;
import com.intothepicture.global.entity.BaseTimeEntity;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.ForeignKey;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

/** One user-selected photo record for a server-calculated map location. */
@Getter
@Entity
@Table(name = "photo_map_location_representative", uniqueConstraints =
    @UniqueConstraint(name = "uk_photo_map_location_representative_user_location", columnNames = {"user_id", "location_key"}))
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class PhotoMapLocationRepresentative extends BaseTimeEntity {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @jakarta.persistence.Column(name = "location_key", nullable = false, length = 128)
    private String locationKey;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "representative_photo_id", foreignKey = @ForeignKey(name = "fk_photo_map_location_representative_photo"))
    private PhotoRecord representativePhoto;

    @Builder
    private PhotoMapLocationRepresentative(User user, String locationKey, PhotoRecord representativePhoto) {
        this.user = user;
        this.locationKey = locationKey;
        this.representativePhoto = representativePhoto;
    }

    public void changeRepresentativePhoto(PhotoRecord value) { this.representativePhoto = value; }
}
