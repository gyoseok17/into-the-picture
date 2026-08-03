# M2 인증 계약 — 카카오 로그인 + JWT

> 기준: `docs/04-api-spec.md`, `docs/05-auth.md`. 이 문서는 M2의 backend·frontend·QA가 같은 구현 경계를 공유하기 위한 확정 계약이다.

## 범위

- 카카오 인가 코드 교환·회원 조회 → 회원 upsert → 우리 JWT(access/refresh) 발급
- access JWT 검증 필터와 `/users/me`, refresh, logout
- 프런트 카카오 로그인 화면·토큰 저장·401 갱신·보호 라우트
- refresh 토큰은 DB에 **해시**로만 저장하며, 재발급·로그아웃 시 회전/무효화한다.

## 환경변수

| 이름 | 사용처 | 비고 |
|---|---|---|
| `KAKAO_REST_KEY` | 서버의 `https://kapi.kakao.com/v2/user/me` 호출 | 기존 `.env`에 있음 |
| `KAKAO_CLIENT_SECRET` | 카카오 토큰 교환 추가 검증 | 카카오 콘솔에서 Client Secret 사용 시 서버 `.env`에만 설정 |
| `JWT_SECRET` | JWT HMAC 서명 | 최소 32바이트 이상의 raw UTF-8 비밀값, 저장소에 커밋 금지 |
| `VITE_KAKAO_JS_KEY` | 프런트 Kakao JS SDK 로그인 | 기존 `frontend/.env`에 있음 |

## API 계약

### `POST /api/v1/auth/kakao`

```json
{ "authorizationCode": "...", "redirectUri": "http://localhost:5173/login" }
```

- 프런트는 Kakao JavaScript SDK v2의 `Kakao.Auth.authorize()`로 로그인 후 redirect URI에서 인가 코드를 받는다.
- 서버가 REST API 키로 카카오 토큰 API에서 인가 코드를 access token으로 교환한 뒤 `v2/user/me`으로 사용자를 검증한다. 요청의 사용자 정보는 받거나 신뢰하지 않는다.
- 카카오 `id`로 사용자를 생성/조회하고 아래 응답을 반환한다.

```ts
type AuthResponse = {
  accessToken: string
  tokenType: 'Bearer'
  expiresIn: number
  user: { id: number; nickname: string; profileImageUrl: string | null; email: string | null }
}
```

### `POST /api/v1/auth/refresh`

요청 body는 없으며 브라우저가 HttpOnly refresh 쿠키를 자동 전송한다. 유효한 refresh JWT와 DB 해시가 모두 일치해야 하며, 응답은 회전된 refresh 쿠키와 새 access를 반환한다.
- 기존 토큰을 무효화하고 새 access·refresh를 위 `AuthResponse` 형태로 반환한다.

### `POST /api/v1/auth/logout` 🔒

- 현재 인증 사용자의 refresh 토큰을 무효화한다. 성공은 `204 No Content`.

### `GET /api/v1/users/me` 🔒

```ts
type UserProfile = { id: number; nickname: string; profileImageUrl: string | null; email: string | null }
```

## 보안·저장 계약

- access JWT: `sub=userId`, `role`, `iat`, `exp`; 15분.
- refresh JWT: 별도 토큰 유형 claim, 14일. 원문은 DB에 저장하지 않고 SHA-256 해시만 저장한다.
- refresh는 `HttpOnly`·운영 HTTPS에서 `Secure`·`SameSite=Lax` 쿠키로만 전달하며, 원문을 JSON/localStorage에 저장하지 않는다.
- 공개: `/auth/kakao`, `/auth/refresh`, 읽기 전용 contest·photo·crowd·regions. 보호: `/auth/logout`, `/users/me`, `/me/**`.
- 인증 실패/권한 부족은 공통 `{ error: { code, message } }`의 401/403을 반환한다.

## DB

- Flyway `V2__auth_refresh_tokens.sql`로 `refresh_token` 테이블을 추가한다.
- 사용자당 활성 refresh 토큰 1개(`user_id UNIQUE`)를 유지한다. 토큰 회전은 기존 행 갱신으로 처리한다.

## 프런트 동작

- LoginPage가 Kakao JS SDK v2를 비동기 로드하고 `authorize()`로 등록된 redirect URI로 이동한다. callback은 code·state를 검증한 뒤 `/auth/kakao`를 호출한다.
- 성공 시 access는 메모리에 저장하고 refresh는 서버가 HttpOnly cookie로 설정한 뒤 이전 경로 또는 `/`로 이동한다.
- 앱 시작 시 `/auth/refresh`를 호출하면 브라우저가 refresh cookie를 자동 전송해 access를 복구한다.
- `RequireAuth`는 보호 화면 진입 시 복구 완료 전 로딩, 실패 시 `/login?returnTo=...`로 이동한다.
- Kakao SDK/키가 없거나 로그인 실패 시 명확한 에러 상태를 표시한다.

## 검증

- backend: 카카오 client mock으로 login/upsert, refresh 회전, logout, JWT 보호 경로를 테스트한다.
- frontend: 타입/빌드, 로그인 성공·실패, 앱 재시작 refresh, 401 재시도, 보호 라우트 흐름을 QA가 대조한다.
