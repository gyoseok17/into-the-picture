# M2 백엔드 — 인증 API 실제 응답 shape 기록

> 기준 계약: `_workspace/contracts/M2_lead_auth-contract.md`.
> 실제 구현 대조: 2026-08-02. `domain/auth/dto/AuthDtos`, `AuthController`, `AuthService`, `JwtService`, `SecurityConfig` 기준.

## 공통

- Base URL: `/api/v1`
- Content-Type: `application/json` (로그아웃 성공 응답은 본문 없음)
- 보호 요청 헤더: `Authorization: Bearer <access JWT>`
- 인증·권한·검증 실패 응답은 공통 형식 `{ "error": { "code": string, "message": string } }` 및 적절한 HTTP 상태를 사용한다.
- access JWT: `sub=userId`, `role`, `iat`, `exp`, 만료 15분.
- refresh JWT: 별도 token-type claim, 만료 14일. 원문이 아닌 SHA-256 해시를 사용자당 한 건만 DB에 보관한다.

## POST /api/v1/auth/kakao

### 요청

```ts
type KakaoLoginRequest = { authorizationCode: string; redirectUri: string }
```

서버는 인가 코드와 등록된 redirect URI를 Kakao 토큰 API로 교환한 뒤 `v2/user/me`를 조회·검증한다. 클라이언트가 보낸 사용자 ID·닉네임·이메일 등은 받거나 신뢰하지 않는다.

### 성공 응답 — 200

```ts
type AuthUser = {
  id: number
  nickname: string
  profileImageUrl: string | null
  email: string | null
}

type AuthResponse = {
  accessToken: string
  tokenType: 'Bearer'
  expiresIn: number
  user: AuthUser
}
```

성공 시 Kakao ID를 기준으로 사용자 생성 또는 기존 사용자 조회 후 access·refresh 토큰을 발급한다.

### 실패 응답

| 상태 | 코드(구현 확정 필요) | 의미 |
| --- | --- | --- |
| 400 | `INVALID_REQUEST` | `authorizationCode`·`redirectUri` 누락, 등록되지 않은 redirect URI 등 요청 오류 |
| 401 | `UNAUTHORIZED` | Kakao 인가 코드 교환 실패 또는 잘못된 Kakao 회원정보 |
| 502 | `EXTERNAL_ERROR` | Kakao 회원정보 API 장애/비정상 응답 |

## POST /api/v1/auth/refresh

### 요청

```ts
// 요청 body 없음. HttpOnly refresh cookie가 자동 전송된다.
```

### 성공 응답 — 200

`POST /auth/kakao`와 동일한 완전한 `AuthResponse`를 반환한다. 이전 refresh 토큰은 무효화하고 새 refresh 토큰 해시로 교체한다.

### 실패 응답

| 상태 | 코드(구현 확정 필요) | 의미 |
| --- | --- | --- |
| 401 | `UNAUTHORIZED` | refresh cookie 누락, 서명·만료·token type·DB 해시 대조 실패 |

## POST /api/v1/auth/logout

### 요청

`Authorization: Bearer <access JWT>` 필수. 요청 본문 없음.

### 성공 응답 — 204 No Content

현재 인증 사용자의 DB refresh-token hash를 제거/무효화한다. 응답 본문은 없다.

### 실패 응답

| 상태 | 코드(구현 확정 필요) | 의미 |
| --- | --- | --- |
| 401 | `UNAUTHORIZED` | access JWT 누락·만료·위조 |

## GET /api/v1/users/me

### 요청

`Authorization: Bearer <access JWT>` 필수.

### 성공 응답 — 200

```ts
type UserProfile = {
  id: number
  nickname: string
  profileImageUrl: string | null
  email: string | null
}
```

`AuthResponse.user`와 같은 4개 필드·타입을 사용한다.

### 실패 응답

| 상태 | 코드(구현 확정 필요) | 의미 |
| --- | --- | --- |
| 401 | `UNAUTHORIZED` | access JWT 누락·만료·위조 |

## 구현 대조 결과 (2026-08-02)

- **PASS:** DTO JSON 필드는 `accessToken`, `tokenType`, `expiresIn`, `user`와 `UserProfile` 4개 필드에 일치한다. refresh 원문은 JSON이 아닌 HttpOnly cookie로만 전달되며 `expiresIn`은 900초다.
- **PASS:** `JwtService`는 access/refresh를 `tokenType` claim으로 분리하고 `sub`, `role`, `iat`, `exp`를 발급·검증한다. `RefreshToken` 테이블은 user_id UNIQUE, SHA-256 hex hash, 만료 시각을 저장하며, login/refresh가 기존 행을 교체해 회전한다.
- **PASS:** `SecurityConfig`는 `/api/v1/auth/kakao`, `/api/v1/auth/refresh`만 공개하고 `/api/v1/auth/logout`, `/api/v1/users/me`, `/api/v1/me/**`를 인증 필수로 둔다. 보안 entry point와 전역 예외 처리는 모두 공통 error body를 반환한다.
- **환경변수 규약:** `JWT_SECRET`은 `JwtService` 구현과 동일하게 최소 32바이트 이상의 raw UTF-8 비밀값을 사용한다. Base64 decode는 하지 않는다.
- **테스트 범위:** `JwtServiceTest`가 access claim과 refresh→access 거부를, `AuthControllerTest`가 login/refresh response·검증 오류·logout 204을, `SecurityConfigTest`가 공개 auth와 `/users/me`·`/me/**`의 401 error shape를 검증한다. 실제 Kakao 계정·DB를 사용하는 end-to-end 검증은 실행 환경에서 수행한다.
