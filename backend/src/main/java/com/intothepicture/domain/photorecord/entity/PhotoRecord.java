package com.intothepicture.domain.photorecord.entity;

import com.intothepicture.domain.contest.entity.ContestWork;
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
    @Column(name = "taken_at") private LocalDateTime takenAt;
    @Column(name = "place_name", length = 255) private String placeName;
    @Column(length = 500) private String memo;
    @Enumerated(EnumType.STRING) @Column(name = "display_mode", nullable = false, length = 20) private DisplayMode displayMode;
    @Column(name = "archived_at") private LocalDateTime archivedAt;
    @Column(name = "contest_linked_at") private LocalDateTime contestLinkedAt;

    @Builder
    private PhotoRecord(User user, UserPhoto userPhoto, LocalDateTime takenAt, String placeName, String memo) {
        this.user = user; this.userPhoto = userPhoto; this.takenAt = takenAt; this.placeName = placeName; this.memo = memo; this.displayMode = DisplayMode.PHOTO_ONLY;
    }

    public void attachContest(ContestWork value) { this.contest = value; this.displayMode = DisplayMode.WITH_CONTEST; this.contestLinkedAt = LocalDateTime.now(); }

    public void detachContest() { this.contest = null; this.displayMode = DisplayMode.PHOTO_ONLY; this.contestLinkedAt = null; }
}
