# M2 인증 — 경계면 QA 체크리스트

> 계약: `_workspace/contracts/M2_lead_auth-contract.md`.
> Producer: `_workspace/api-shapes/M2_backend_auth-shapes.md`.
> Consumer: `_workspace/frontend/M2_auth_hook-api-map.md`.

## 정적 경계 검증

- [ ] `POST /auth/kakao` 요청은 `authorizationCode`, `redirectUri`를 전송하며, 서버가 Kakao 토큰 API로 코드를 교환해 검증한다.
- [ ] login 및 refresh 성공 응답은 `accessToken`, `tokenType: 'Bearer'`, `expiresIn`, `user`를 제공하고, refresh 원문은 `HttpOnly` cookie로만 전달한다.
- [ ] `user`와 `/users/me`는 `id`, `nickname`, `profileImageUrl`, `email`의 이름·타입·nullability가 일치한다.
- [ ] refresh 성공 시 이전 refresh는 DB에서 무효화/교체되고, 브라우저 refresh cookie도 새 값으로 회전한다.
- [ ] access는 `Authorization: Bearer`로만 전송되며, refresh 원문은 DB에 저장되지 않는다.
- [ ] 공개 경로와 `/users/me`, `/me/**` 보호 경로의 SecurityConfig 규칙이 계약과 일치한다.
- [ ] 401/403과 검증 실패는 공통 `{ error: { code, message } }` 형식이다.

## 백엔드 테스트

| ID | 시나리오 | 기대 결과 |
| --- | --- | --- |
| B1 | 유효 Kakao 토큰으로 첫 로그인 | Kakao client 검증 후 사용자 생성, `200 AuthResponse`, refresh hash 저장 |
| B2 | 같은 Kakao 사용자 재로그인 | 사용자 중복 생성 없이 조회/upsert, 새 토큰 발급 |
| B3 | Kakao 토큰 누락·무효·외부 API 실패 | 각각 계약한 400/401/502와 공통 에러 shape |
| B4 | 유효 refresh 호출 | `200 AuthResponse`, 기존 refresh는 더 이상 사용 불가 |
| B5 | 만료·위조·DB 불일치·기존 회전 refresh | `401` 공통 에러, 새 토큰 미발급 |
| B6 | access 없이/잘못된 access로 `/users/me` | `401` 공통 에러 |
| B7 | 유효 access로 `/users/me` | `200 UserProfile`, 로그인 응답 user와 shape 일치 |
| B8 | 유효 access 로그아웃 후 refresh 재사용 | logout `204`, refresh는 `401` |
| B9 | 공개 읽기 API와 `/me/**` | 공개 API는 토큰 없이 성공, `/me/**`는 인증 없으면 401 |

## 프론트 수동 QA

| ID | 절차 | 기대 결과 |
| --- | --- | --- |
| F1 | `/login`에서 Kakao 로그인 성공 | 토큰/사용자 상태가 저장되고 returnTo 또는 `/`로 이동 |
| F2 | Kakao SDK 로드 실패·사용자 취소·서버 로그인 실패 | 흰 화면 없이 명확한 오류와 재시도 제공 |
| F3 | refresh token이 있는 상태로 새로고침 후 보호 화면 진입 | 복구 중 로딩, 성공하면 원 화면 표시 |
| F4 | refresh token이 없거나 복구 실패 | `/login?returnTo=...`로 이동, stale 토큰 제거 |
| F5 | 보호 API가 401을 한 번 반환 | refresh 1회 후 원 요청 1회 재시도 |
| F6 | 동시 보호 API 401 여러 건 | refresh 요청은 한 번만 발생 |
| F7 | refresh 실패 | access·refresh·user 모두 정리되고 보호 화면 재진입 불가 |
| F8 | 로그아웃 | 서버 204 후 로컬 상태 정리, 보호 화면은 로그인으로 이동 |
| F9 | `returnTo=https://evil.example` 직접 접근 | 외부 이동 없이 안전한 내부 기본 경로(`/`)로 이동 |
| F10 | 비로그인/로그인 상태의 공통 네비게이션 | 비로그인 시 `마이` 탭 숨김·데스크탑 우측 로그인 버튼 표시, 로그인 시 닉네임 드롭다운의 `마이`와 별도 로그아웃 버튼 표시 |
| F11 | 모바일 마이 로그아웃 | 하단 `마이` 탭에서 닉네임·프로필과 로그아웃 버튼이 보이고, 성공 후 메인 공개 화면으로 이동 |

## 최종 정적 경계 검토 (2026-08-02)

| 항목 | 결과 | 근거 |
| --- | --- | --- |
| login/refresh 요청 body | PASS | login은 `authorizationCode`·`redirectUri`, refresh는 body 없이 HttpOnly cookie를 사용하도록 프런트·백엔드가 일치 |
| login/refresh 성공 response | PASS | 프런트 `lib/apiClient.ts`의 `AuthResponse`와 백엔드 record의 필드·타입·`tokenType='Bearer'`·초 단위 expiresIn 일치 |
| user profile response | PASS | 프런트 `AuthUser`/`UserProfile`과 백엔드 `AuthDtos.UserProfile`의 4필드 일치 |
| Kakao 서버 검증·upsert | PASS | `KakaoAccountClient.exchangeCodeAndVerify`가 인가 코드를 서버 측에서 교환한 후 `findByKakaoId` 기반 생성/프로필 갱신; 클라이언트 프로필 필드 미신뢰 |
| refresh 회전·DB hash | PASS | `AuthService.refresh/issue`, `RefreshToken` 및 V2 migration: tokenType 검증, SHA-256 hash 비교, 사용자당 한 행 교체 |
| JWT 및 보호 경로 | PASS | `JwtService`, `JwtAuthenticationFilter`, `SecurityConfig`: access/refresh type 분리, Bearer 인증, `/users/me`·`/me/**` 보호 |
| 공통 error shape | PASS (정적) | `SecurityConfig.writeError` 및 `GlobalExceptionHandler`; 400=`INVALID_REQUEST`, 401=`UNAUTHORIZED`, 502=`EXTERNAL_ERROR` |
| StrictMode bootstrap 회전 경쟁 (F-1) | PASS | `AuthProvider` module-level `bootstrapRequest` single-flight + inactive/token-change guard 적용 확인 |
| 401 후 refresh 실패의 인증 상태 정리 (F-2) | PASS | `apiClient.refreshAccessToken`이 실패 시 access를 정리하고 `notifyAuthExpired()`를 호출하며, `AuthProvider`가 구독해 `user=null`으로 만든다. 이후 `RequireAuth`가 로그인으로 이동한다. |
| returnTo/로그아웃 | PASS (정적) | `safeReturnTo`가 외부 URL을 거부하며, logout은 finally에서 서버 실패에도 로컬 access·user를 정리하고 서버가 refresh cookie를 만료 |

### Kakao SDK·리디렉션 실패 진단

- SDK v2는 `Kakao.Auth.authorize()`로 카카오 로그인 페이지로 이동한다. `/login` 복귀 시 `state`를 검증한 뒤에만 우리 API를 호출하며, SDK·state·카카오 오류를 LoginPage에 표시한다.
- `/auth/kakao` 요청이 없으면 카카오 앱의 JavaScript 키·웹 플랫폼 도메인·Redirect URI·카카오 로그인 활성화 설정을 먼저 확인한다.

### F-2 수정 확인

`lib/authSessionEvents.ts`의 작은 이벤트 seam으로 HTTP 계층이 React에 직접 의존하지 않으면서, refresh 실패를 `AuthProvider`에 전달한다. 수정 후 보호 API 401 → refresh 401 → tokenStore·user 제거 → `RequireAuth`의 `/login?returnTo=...` 이동은 정적으로 확인됐다. 브라우저 F7 실행 증빙은 여전히 필요하다.

### 자동/수동 검증 현황

- **정적 producer ↔ consumer 대조:** 위 표 기준 PASS. `JWT_SECRET`은 실제 구현과 동일하게 raw UTF-8 최소 32바이트로 계약을 정정했다.
- **자동 테스트:** `JwtServiceTest`, `AuthControllerTest`, `SecurityConfigTest`가 토큰 타입, auth 응답·에러·logout shape, 공개/보호 경로를 검증한다. `./gradlew.bat test` 90개 통과.
- **수동 브라우저 QA:** Kakao 앱 키·실계정이 필요한 F1–F9는 아직 실행 증빙 없음.

## 완료 기록

| 항목 | 결과 | 근거/날짜 |
| --- | --- | --- |
| Producer ↔ consumer shape 대조 | PASS | 정적 교차 대조 완료, 2026-08-02 |
| Backend 테스트 | PASS | `./gradlew.bat test` 90개 통과, 2026-08-02 |
| Frontend build | PASS | `npm.cmd run build` 통과, 2026-08-02 |
| B1–B9 | 부분 PASS | controller/security/JWT 자동 테스트 + 정적 대조. 실제 Kakao·DB 통합은 후속 실행 환경 검증 필요 |
| F1–F9 | 대기 | 구현 완료 후 기입 |
