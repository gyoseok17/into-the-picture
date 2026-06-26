# 05. 인증 (카카오 로그인 → JWT)

> 웹·앱(Capacitor) **공통 흐름**으로 설계. 카카오로 신원 확인 → 우리 서버가 자체 JWT 발급 → 이후 API는 JWT로 인증.

## 흐름 (토큰 기반 — 웹·앱 공통)

리다이렉트(인가코드) 방식 대신, 프론트가 카카오 SDK로 받은 **액세스 토큰**을 서버에 넘기는 방식을 쓴다. 웹/앱 모두 동일 코드라 단순하고 확장성 좋음.

```
[프론트]                         [백엔드]                    [카카오]
  │ 카카오 로그인(SDK) ───────────────────────────────────────▶│
  │◀──────────── 카카오 accessToken ───────────────────────────│
  │ POST /auth/kakao {kakaoAccessToken} ─▶│
  │                                       │ GET kapi.kakao.com/v2/user/me ─▶│
  │                                       │◀──── 카카오 회원정보(kakaoId,nick) │
  │                                       │ User upsert(kakaoId 기준)
  │                                       │ 우리 JWT(access+refresh) 발급
  │◀──── {accessToken, refreshToken, user} │
  │ 이후 요청: Authorization: Bearer <access>
```

- **User upsert:** `kakaoId`로 조회 → 없으면 가입(nickname·profileImageUrl 저장), 있으면 로그인. 비밀번호 없음.
- 카카오 회원정보 조회: `GET https://kapi.kakao.com/v2/user/me` (헤더 `Authorization: Bearer {kakaoAccessToken}`).

## 토큰 정책

| 토큰 | 수명(초안) | 용도 | 저장 위치 |
|------|-----------|------|----------|
| **Access (JWT)** | 1시간 | API 인증 (`Authorization: Bearer`) | 클라 메모리 |
| **Refresh** | 14일 | 액세스 재발급 | 웹: httpOnly 쿠키 / 앱: Capacitor 보안 저장소(Preferences·SecureStorage) |

- JWT 클레임: `sub`(userId), `role`, `iat`, `exp`. 서명 키는 환경변수(`secrets.local.txt` → 운영은 시크릿 매니저).
- **재발급:** `POST /auth/refresh {refreshToken}` → 새 access(+rotate refresh).
- **로그아웃:** 서버에 저장된 refresh 무효화(아래) + 클라 토큰 폐기.

## 서버측 검증/무효화

- 초기(MVP): refresh 토큰의 **해시를 DB에 저장**(사용자당 1개; `User`에 컬럼 또는 작은 `RefreshToken` 테이블). 재발급·로그아웃 시 대조/삭제.
- 고도화(10-future A4): refresh **회전(rotation)** + 재사용 감지 + 블랙리스트.

## Spring Security 구성

- **Stateless** (세션 없음). `SessionCreationPolicy.STATELESS`.
- `JwtAuthenticationFilter`: `Authorization` 헤더의 JWT 검증 → SecurityContext에 사용자 주입.
- 경로 권한:
  - **공개:** `/api/v1/auth/**`, `GET /api/v1/photos/**`, `GET /api/v1/contests/**`, `GET /api/v1/crowd/**`, `GET /api/v1/regions`
  - **인증 필요(🔒):** `/api/v1/users/me`, `/api/v1/me/**` (업로드·즐겨찾기)
- 예외: 401(미인증)·403(권한) → 공통 에러 응답(04).

## 확장성 메모

- 인증 제공자를 `OAuthProvider` 추상화 뒤에 두면, 향후 **구글·애플 로그인 추가**를 기존 코드 수정 없이 구현 추가로 가능(개방-폐쇄).
- `User`에 `provider`(KAKAO) 필드를 두어 다중 제공자 대비(현재는 KAKAO 고정값).
