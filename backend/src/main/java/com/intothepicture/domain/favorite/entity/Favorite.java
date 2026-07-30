package com.intothepicture.domain.favorite.entity;

import com.intothepicture.domain.user.entity.User;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EntityListeners;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.ForeignKey;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import java.time.LocalDateTime;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

/**
 * 즐겨찾기(외부 항목 참조). targetType+source+externalId 로 수상작·관광사진·관광지를 참조(docs/03).
 * 생성 시각만 가지므로 BaseTimeEntity 대신 createdAt 만 둔다.
 */
@Getter
@Entity
@Table(
    name = "favorite",
    uniqueConstraints = @UniqueConstraint(
        name = "uk_favorite_user_target_external",
        columnNames = {"user_id", "target_type", "external_id"}
    )
)
@EntityListeners(AuditingEntityListener.class)
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Favorite {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false, foreignKey = @ForeignKey(name = "fk_favorite_user"))
    private User user;

    @Enumerated(EnumType.STRING)
    @Column(name = "target_type", nullable = false, length = 20)
    private FavoriteTargetType targetType;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private FavoriteSource source;

    @Column(name = "external_id", nullable = false, length = 255)
    private String externalId;

    @Column(name = "snapshot_title", length = 255)
    private String snapshotTitle;

    @Column(name = "snapshot_image_url", length = 500)
    private String snapshotImageUrl;

    @CreatedDate
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Builder
    private Favorite(User user, FavoriteTargetType targetType, FavoriteSource source, String externalId,
                     String snapshotTitle, String snapshotImageUrl) {
        this.user = user;
        this.targetType = targetType;
        this.source = source;
        this.externalId = externalId;
        this.snapshotTitle = snapshotTitle;
        this.snapshotImageUrl = snapshotImageUrl;
    }
}
