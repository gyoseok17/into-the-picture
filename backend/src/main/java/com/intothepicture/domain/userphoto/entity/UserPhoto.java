package com.intothepicture.domain.userphoto.entity;

import com.intothepicture.domain.user.entity.User;
import com.intothepicture.global.entity.BaseTimeEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.ForeignKey;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.time.LocalDateTime;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

/** 업로드 사진(포토 비교용). 실제 파일은 스토리지, DB 엔 위치·메타만(docs/03·07). */
@Getter
@Entity
@Table(name = "user_photo")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class UserPhoto extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false, foreignKey = @ForeignKey(name = "fk_user_photo_user"))
    private User user;

    @Column(name = "storage_key", nullable = false, length = 500)
    private String storageKey;

    @Column(nullable = false, length = 500)
    private String url;

    @Column(name = "original_filename", length = 255)
    private String originalFilename;

    @Column(name = "content_type", length = 100)
    private String contentType;

    @Column(name = "file_size")
    private Long fileSize;

    @Column(name = "taken_at")
    private LocalDateTime takenAt;

    @Column(length = 500)
    private String memo;

    @Builder
    private UserPhoto(User user, String storageKey, String url, String originalFilename,
                      String contentType, Long fileSize, LocalDateTime takenAt, String memo) {
        this.user = user;
        this.storageKey = storageKey;
        this.url = url;
        this.originalFilename = originalFilename;
        this.contentType = contentType;
        this.fileSize = fileSize;
        this.takenAt = takenAt;
        this.memo = memo;
    }
}
