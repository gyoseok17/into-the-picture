# 카카오 OAuth + JWT 인증 구현

스펙은 `docs/05-auth.md`. 이 문서는 Spring 구현 방법.

## 흐름 (토큰 기반, 웹·앱 공통)

프론트가 카카오 SDK로 받은 **카카오 accessToken**을 서버에 보내면, 서버가 카카오에 사용자 정보를 물어 우리 JWT를 발급한다. 리다이렉트(인가코드) 방식보다 단순하고 웹/앱 동일.

1. `POST /api/v1/auth/kakao { kakaoAccessToken }`
2. 서버: `GET https://kapi.kakao.com/v2/user/me` (헤더 `Authorization: Bearer {kakaoAccessToken}`) → kakaoId·nickname·profileImage
3. `kakaoId`로 User upsert (없으면 가입)
4. 우리 JWT(access+refresh) 발급 → `{ accessToken, refreshToken, tokenType, expiresIn, user }`

카카오 호출은 `external`의 GeocodingProvider와 별개로 `auth` 내 KakaoOAuthClient(또는 Provider)로 격리한다. 향후 구글·애플 추가를 위해 `OAuthProvider` 추상화 뒤에 두면 기존 코드 수정 없이 확장 가능.

## JWT
- 클레임: `sub`(userId), `role`, `iat`, `exp`. 서명키는 환경변수(`.env`/시크릿).
- Access 1시간, Refresh 14일(초안).
- `JwtAuthenticationFilter`로 `Authorization: Bearer` 검증 → SecurityContext 주입.

## Refresh 관리 (MVP)
- refresh 토큰 **해시를 DB에 저장**(사용자당 1개; User 컬럼 또는 RefreshToken 테이블).
- `POST /auth/refresh`: 대조 후 새 access(+회전 refresh) 발급.
- `POST /auth/logout`: 저장된 refresh 무효화.
- (향후) 회전·재사용 감지·블랙리스트.

## Spring Security
- `SessionCreationPolicy.STATELESS`, CSRF 비활성(JWT).
- 공개: `/api/v1/auth/**`, `GET /api/v1/photos/**`, `GET /api/v1/contests/**`, `GET /api/v1/crowd/**`, `GET /api/v1/regions`
- 인증 필요: `/api/v1/users/me`, `/api/v1/me/**`
- 401/403은 GlobalExceptionHandler 포맷과 일치시킨다.
