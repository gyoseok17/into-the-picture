# 05. 인증 (카카오 로그인 → JWT)

> 웹·앱(Capacitor) **공통 흐름**으로 설계. 카카오로 신원 확인 → 우리 서버가 자체 JWT 발급 → 이후 API는 JWT로 인증.

## 흐름 (토큰 기반 — 웹·앱 공통)

카카오 JavaScript SDK v2의 **인가 코드 리디렉션** 방식을 쓴다. 프론트는 카카오 access token을 보관하거나 서버에 넘기지 않으며, 서버가 REST API 키로 인가 코드를 교환한다.

```
[프론트]                         [백엔드]                    [카카오]
  │ Kakao.Auth.authorize(redirectUri,state) ───────────────────▶│
  │◀────── /login?code=...&state=... (리디렉션) ───────────────│
  │ state 검증 후 POST /auth/kakao {authorizationCode,redirectUri} ─▶│
  │                                       │ POST kauth.kakao.com/oauth/token ─▶│
  │                                       │◀──── 카카오 accessToken ───────────│
  │                                       │ GET kapi.kakao.com/v2/user/me ────▶│
  │                                       │◀──── 카카오 회원정보(kakaoId,nick) │
  │                                       │ User upsert(kakaoId 기준)
  │                                       │ 우리 JWT(access+refresh) 발급
  │◀──── {accessToken, user} + HttpOnly refresh cookie │
  │ 이후 요청: Authorization: Bearer <access>
```

- **User upsert:** `kakaoId`로 조회 → 없으면 가입(nickname·profileImageUrl 저장), 있으면 로그인. 비밀번호 없음.
- 카카오 회원정보 조회: 서버가 `POST https://kauth.kakao.com/oauth/token`으로 인가 코드를 교환한 access token으로 `GET https://kapi.kakao.com/v2/user/me`을 호출한다.
- 카카오 개발자 콘솔에는 웹 플랫폼 도메인(`http://localhost:5173`)과 Redirect URI(`http://localhost:5173/login`)를 등록해야 한다. 배포 환경은 실제 HTTPS 도메인의 `/login` URI를 별도로 등록한다.

## 토큰 정책

| 토큰 | 수명(초안) | 용도 | 저장 위치 |
|------|-----------|------|----------|
| **Access (JWT)** | 15분 | API 인증 (`Authorization: Bearer`) | 클라 메모리 |
| **Refresh** | 14일 | 액세스 재발급 | 서버가 설정하는 `HttpOnly`·`Secure`(운영)·`SameSite=Lax` 쿠키 |

- JWT 클레임: `sub`(userId), `role`, `tokenType`(`access`/`refresh`), `iat`, `exp`. 서명 키는 환경변수 `JWT_SECRET`(최소 32바이트 raw UTF-8, 운영은 시크릿 매니저).
- **재발급:** `POST /auth/refresh` 시 브라우저가 refresh 쿠키를 자동 전송 → 새 access와 회전된 refresh 쿠키를 받는다.
- **로그아웃:** 서버에 저장된 refresh 무효화(아래) + refresh 쿠키 만료 + 클라 access 폐기.

카카오 REST API 키의 Client Secret을 사용하는 운영 앱은 `KAKAO_CLIENT_SECRET`을 서버 시크릿으로 설정한다. 이 값은 카카오 토큰 교환 요청에만 포함하며 프런트에 전달하지 않는다.

## 서버측 검증/무효화

- M2: refresh 토큰의 **SHA-256 해시만 DB에 저장**(`RefreshToken` 테이블, 사용자당 1개). 재발급 시 기존 해시를 새 토큰 해시로 교체하는 **회전(rotation)**을 적용하고, 로그아웃 시 삭제한다.
- 고도화(10-future A4): refresh 재사용 감지·다기기 세션·블랙리스트.

## Spring Security 구성

- **Stateless** (세션 없음). `SessionCreationPolicy.STATELESS`.
- `JwtAuthenticationFilter`: `Authorization` 헤더의 JWT 검증 → SecurityContext에 사용자 주입.
- 경로 권한:
  - **공개:** `/api/v1/auth/kakao`, `/api/v1/auth/refresh`, `GET /api/v1/photos/**`, `GET /api/v1/contests/**`, `GET /api/v1/crowd/**`, `GET /api/v1/regions`
  - **인증 필요(🔒):** `/api/v1/auth/logout`, `/api/v1/users/me`, `/api/v1/me/**` (업로드·즐겨찾기)
- 예외: 401(미인증)·403(권한) → 공통 에러 응답(04).

## 확장성 메모

- 인증 제공자를 `OAuthProvider` 추상화 뒤에 두면, 향후 **구글·애플 로그인 추가**를 기존 코드 수정 없이 구현 추가로 가능(개방-폐쇄).
- `User`에 `provider`(KAKAO) 필드를 두어 다중 제공자 대비(현재는 KAKAO 고정값).
