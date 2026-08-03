package com.intothepicture.domain.user.entity;

import com.intothepicture.global.entity.BaseTimeEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

/** 회원(카카오 로그인 전용, 비밀번호 없음). docs/03. */
@Getter
@Entity
@Table(name = "users", uniqueConstraints = @UniqueConstraint(name = "uk_users_kakao_id", columnNames = "kakao_id"))
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class User extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "kakao_id", nullable = false)
    private Long kakaoId;

    @Column(nullable = false, length = 50)
    private String nickname;

    @Column(name = "profile_image_url", length = 500)
    private String profileImageUrl;

    @Column(length = 255)
    private String email;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Role role;

    @Builder
    private User(Long kakaoId, String nickname, String profileImageUrl, String email, Role role) {
        this.kakaoId = kakaoId;
        this.nickname = nickname;
        this.profileImageUrl = profileImageUrl;
        this.email = email;
        this.role = role != null ? role : Role.USER;
    }

    public void updateKakaoProfile(String nickname, String profileImageUrl, String email) {
        this.nickname = nickname;
        this.profileImageUrl = profileImageUrl;
        this.email = email;
    }
}
