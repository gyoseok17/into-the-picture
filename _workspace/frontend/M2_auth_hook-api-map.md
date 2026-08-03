# M2 프론트엔드 — 인증 훅·API 매핑

> 기준 계약: `_workspace/contracts/M2_lead_auth-contract.md`.
> 백엔드 producer 기록: `_workspace/api-shapes/M2_backend_auth-shapes.md`.
> 구현 전 매핑표이며, 구현 후 실제 파일·함수명과 결과를 갱신한다.

## 기존 seam

| 구분 | 현 파일 | 현재 역할 | M2 연결 방향 |
| --- | --- | --- | --- |
| HTTP | `src/lib/apiClient.ts` | Bearer 첨부, 401 단일 refresh 후 1회 재시도 | `AuthResponse`의 완전한 shape를 사용하도록 refresh 응답 타입을 확정한다. |
| 저장소 | `src/lib/tokenStore.ts` | access 메모리, refresh는 HttpOnly cookie | 프런트는 access만 저장·삭제하고, refresh cookie는 서버/브라우저가 회전·삭제한다. |
| 로그인 화면 | `src/pages/LoginPage.tsx` | placeholder | Kakao JS SDK 로드, Kakao 로그인, `/auth/kakao` 호출, 오류 UI를 구현한다. |
| 라우팅 | `src/routes/router.tsx` | 모든 라우트 공개 | 보호 요소 `RequireAuth` 및 `/login?returnTo=` 복귀를 연결한다. |

## 엔드포인트 매핑

| 엔드포인트 | API 함수(권장) | 호출 주체/훅(권장) | 요청·응답 | 성공 후 동작 |
| --- | --- | --- | --- | --- |
| `POST /auth/kakao` | `loginWithKakao(authorizationCode, redirectUri)` | LoginPage의 Kakao redirect callback | `KakaoLoginRequest` → `AuthResponse` | state 검증 후 access 메모리 저장, refresh 저장, user 상태 설정, `returnTo` 또는 `/` 이동 |
| `POST /auth/refresh` | `refreshSession()` | 앱 시작 복구, `apiClient` 401 interceptor | `RefreshRequest` → `AuthResponse` | access·회전된 refresh·user 상태 갱신 |
| `POST /auth/logout` | `logout()` | 사용자 메뉴/마이 페이지 | Bearer → `204` | 서버 성공/실패와 관계없이 로컬 access·refresh·user 정리, 공개 화면으로 이동 |
| `GET /users/me` | `fetchMyProfile()` | 로그인 직후·앱 시작 복구·마이 화면 | Bearer → `UserProfile` | 인증 사용자 상태 갱신 |

## 상태 및 라우팅 계약

- 인증 상태는 최소 `initializing | authenticated | anonymous`를 구분한다. 앱 시작 시 refresh token이 있으면 `initializing`으로 두고 재발급 완료 전 보호 화면을 판단하지 않는다.
- `RequireAuth`는 복구 중 로딩 UI, 인증 성공 시 자식 화면, 실패/토큰 없음 시 `/login?returnTo=<현재 pathname+search>`로 이동한다.
- LoginPage는 성공 시 `returnTo`가 내부 상대 경로일 때만 사용하고, 없거나 외부 URL이면 `/`로 이동한다.
- Kakao SDK 부재, 로그인 취소, `/auth/kakao` 실패를 서로 구분해 사용자가 재시도할 수 있는 오류 UI를 제공한다.
- `AuthResponse.user`와 `/users/me`의 필드는 하나의 `AuthUser`/`UserProfile` 타입으로 재사용하며 `any` 또는 필드 추측을 쓰지 않는다.

## 401 재시도 경계

- refresh 요청 자체는 `apiClient`가 아닌 별도 axios 호출을 유지해 interceptor 재귀를 막는다.
- 동시에 발생한 401은 기존 `refreshing` Promise로 refresh 1회만 실행한다.
- refresh 성공 시 원 요청의 `Authorization`을 새 access token으로 바꾸어 1회만 재시도한다.
- refresh 실패 시 access·refresh를 모두 삭제하고, 보호 라우트는 로그인으로 보낸다.
- 로그인·refresh 엔드포인트의 응답 타입은 `accessToken`만 축소하지 않고 `AuthResponse` 전체를 계약대로 모델링한다.

## 구현 대조 기록 (2026-08-02, 백엔드 producer 대조 완료)

| 계약 항목 | 실제 consumer | 결과 |
| --- | --- | --- |
| Kakao 로그인 | `features/auth/api.ts`의 `loginWithKakao` → `AuthProvider.loginWithKakaoToken` → `LoginPage` | 조건부 PASS — 요청 body와 `AuthResponse` 타입이 계약과 일치 |
| 앱 시작 refresh | `AuthProvider` effect가 raw axios로 `/auth/refresh` 호출 | PASS — module-level single-flight와 lifecycle/token guard로 StrictMode 중복 회전 방지 |
| 401 단일 재시도 | `lib/apiClient.ts`의 module-level `refreshing` Promise | PASS (정적) — auth 경로를 제외하고 refresh 1회 후 원 요청 1회 재시도 |
| 보호 라우트 | `RequireAuth` + `/compare`, `/me`, `/me/favorites`, `/me/photos` | PASS (정적) — 복구 중 로딩, 실패/부재 시 returnTo와 함께 로그인 이동 |
| returnTo 안전성 | `LoginPage.safeReturnTo` | PASS (정적) — `/`로 시작하면서 `//`가 아닌 내부 경로만 허용 |
| 로그아웃 로컬 정리 | `AuthProvider.logout`의 `finally` | PASS (정적) — 서버 실패에도 access·refresh·user를 제거 |

### 발견 사항 — 수정 필요

**F-1 (해결): StrictMode refresh 회전 경쟁.** `AuthProvider`가 module-level `bootstrapRequest`로 bootstrap refresh를 single-flight 처리하고, cleanup된 effect 또는 로그인/로그아웃 세대가 변경된 bootstrap 결과가 React state를 바꾸지 않게 guard한다. 동일 refresh cookie의 중복 회전 경쟁은 정적으로 해소됐다.

**F-2 (해결): 401 refresh 실패 후 stale user.** `apiClient`가 refresh 실패 시 `authSessionEvents.notifyAuthExpired()`를 호출하고, `AuthProvider`가 구독해 `user=null`으로 정리한다. `RequireAuth`는 이 상태를 보고 로그인 화면으로 전환한다.

## 구현 완료 후 대조

- [x] 실제 API 함수/훅/상태 제공자 파일과 위 표를 갱신하고 백엔드 producer와 대조했다.
- [x] `/auth/kakao` 요청 body, body 없는 `/auth/refresh`, `AuthResponse` 4개 최상위 필드와 user 4개 필드를 producer 기록과 대조했다.
- [x] access는 메모리, refresh는 HttpOnly cookie로만 전달되는지 확인했다.
- [x] `returnTo` open redirect 방지와 로그아웃 로컬 정리를 확인했다.
- [x] TypeScript build를 통과했다. 실제 Kakao 계정 로그인·복구·401 재시도·보호 라우트 브라우저 QA는 실행 환경에서 확인한다.
