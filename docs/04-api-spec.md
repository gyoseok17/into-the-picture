# 04. API 명세 (REST)

> 프론트(React)↔백(Spring Boot) 계약. 실제 외부 API 응답(06)을 **내부 DTO로 변환**한 형태로 제공한다.
> 외부 필드명(galWebImageUrl, koTitle…)은 절대 노출하지 않는다 → 외부 API가 바뀌어도 이 계약은 유지(확장성).
> 이 문서의 응답 shape는 나중에 **QA 에이전트가 프론트 훅과 교차검증**하는 기준이 된다.

## 공통 규약

- **Base URL:** `/api/v1` (버전 prefix → 향후 v2 병행 가능)
- **인증:** 보호 엔드포인트는 `Authorization: Bearer {JWT}` 헤더. 표에서 🔒 표시.
- **포맷:** 요청·응답 모두 JSON (업로드만 multipart).
- **페이지네이션 (목록 공통 응답):**
  ```json
  { "content": [ ... ], "page": { "page": 1, "size": 20, "totalCount": 6119, "hasNext": true } }
  ```
- **단건 응답:** 객체를 그대로 반환 (200).
- **에러 응답 (공통):**
  ```json
  { "error": { "code": "NOT_FOUND", "message": "대상을 찾을 수 없습니다." } }
  ```
  HTTP 상태코드 병행: 400(검증) · 401(미인증) · 403(권한) · 404 · 429(외부 쿼터) · 502(외부 API 장애).

---

## 1. 인증 (auth) — D1

| 메서드 | 경로 | 설명 | 🔒 |
|--------|------|------|:--:|
| POST | `/auth/kakao` | 카카오 인가 코드 교환·로그인 → 우리 JWT 발급 | |
| POST | `/auth/refresh` | 리프레시 토큰으로 액세스 토큰 재발급 | |
| POST | `/auth/logout` | 로그아웃 (리프레시 무효화) | 🔒 |
| GET | `/users/me` | 내 프로필 조회 | 🔒 |

**POST /auth/kakao**
```json
// 요청
{ "authorizationCode": "...", "redirectUri": "http://localhost:5173/login" }
// 카카오가 redirectUri로 돌려준 code와, 그 로그인에 사용한 redirect URI를 함께 전달
// 응답
{ "accessToken": "<JWT>", "tokenType": "Bearer", "expiresIn": 900,
  "user": { "id": 1, "nickname": "홍길동", "profileImageUrl": "https://...", "email": null } }
```

응답의 `Set-Cookie` 헤더로 refresh 토큰을 `HttpOnly` 쿠키에 설정한다. refresh 토큰 원문은 JSON 응답에 포함하지 않는다.

자세한 흐름은 `05-auth.md`.

**POST /auth/refresh**
```json
// 요청 body 없음. 브라우저가 HttpOnly refresh 쿠키를 자동 전송.
// 응답: accessToken·tokenType·expiresIn·user 및 회전된 Set-Cookie. 기존 refresh는 더 이상 사용할 수 없음.
```

**POST /auth/logout**은 인증된 access JWT가 필요하며 성공 시 `204 No Content`를 반환한다.

**GET /users/me**
```json
{ "id": 1, "nickname": "홍길동", "profileImageUrl": "https://...", "email": null }
```

---

## 2. 관광사진 검색 (photo-search) — D2 · 실시간 호출

| 메서드 | 경로 | 설명 | 🔒 |
|--------|------|------|:--:|
| GET | `/photos?keyword=&page=&size=` | 키워드 사진 피드 (keyword 없으면 전체 최신) | |

```json
// GET /photos?keyword=단풍 → content[] 요소 (PhotoDto)
{ "id": "3591043", "title": "저지곶자왈",
  "imageUrl": "https://tong.visitkorea.or.kr/cms2/website/43/3591043.jpg",
  "photographer": "천건엽", "location": "제주특별자치도 제주시 한경면",
  "filmMonth": "202509", "keywords": ["숲","산책로","9월 추천여행지"] }
```
> `imageUrl`은 외부 HTTP URL을 **https로 치환**하여 제공(06 X4). 추천 키워드와 별도 사진 상세 API는 두지 않으며, 프런트는 한 응답 페이지 안의 같은 `title + location` 사진을 묶어 상세 모달에서 표시한다.

---

## 3. 공모전 수상작 (contest) — D3 · DB 저장

| 메서드 | 경로 | 설명 | 🔒 |
|--------|------|------|:--:|
| GET | `/contests?season=&grade=&division=&sido=&keyword=&page=&size=&sort=` | 수상작 목록(필터) | |
| GET | `/contests/filters` | 필터 옵션(계절·등급·부문 목록) — UI 구성용 | |
| GET | `/contests/{id}` | 수상작 상세 (좌표 포함) | |
| GET | `/contests/{id}/crowd` | 이 수상작 장소의 집중률 (매칭 시) | |

```json
// content[] 요소 (ContestSummaryDto)
{ "id": 12, "title": "가야산 설경", "thumbUrl": "https://...image3_1.jpg",
  "location": "경상남도 합천군, 가야산국립공원", "sido": "경상남도", "sigungu": "합천군",
  "photographer": "서정철", "filmMonth": "202401",
  "awardDivision": "스마트폰 부문", "awardGrade": "입선", "season": "겨울",
  "keywords": ["가야산 설경","겨울","눈"] }

// GET /contests/{id} (ContestDetailDto) — 요약 + 좌표/원본
{ "...": "...(요약 동일)", "imageUrl": "https://...image2_1.jpg",
  "lat": 35.8043935, "lng": 128.1083354, "copyright": "Type1",
  "crowdAvailable": true }      // 집중률 매칭 여부 (프론트가 /crowd 호출할지 판단)
```

```json
// GET /contests/{id}/crowd → 매칭되면 CrowdForecastDto, 없으면 204 No Content
{ "attractionName": "가야산국립공원(홍류동,청량동지구)", "areaNm": "경상남도", "sigunguNm": "합천군",
  "matchType": "PARTIAL",
  "daily": [ { "date": "2026-06-26", "rate": 35.25 }, { "date": "2026-06-27", "rate": 86.91 } ],
  "recommendedDates": ["2026-06-26","2026-06-30"] }   // 혼잡도 낮은 추천일(계산값)
```

---

## 4. 방문 타이밍 / 집중률 (crowd-timing) — D4 · 실시간

| 메서드 | 경로 | 설명 | 🔒 |
|--------|------|------|:--:|
| GET | `/regions` | 시도·시군구 코드 목록 (선택 UI용) | |
| GET | `/crowd/attractions?areaCd=&sigunguCd=` | 해당 시군구 집중률 대상 관광지 목록 | |
| GET | `/crowd?areaCd=&sigunguCd=&attraction=` | 특정 관광지 30일 집중률 캘린더 | |

```json
// GET /regions
[ { "areaCd": "48", "areaNm": "경상남도",
    "sigungus": [ { "sigunguCd": "48890", "sigunguNm": "합천군" } ] } ]

// GET /crowd → CrowdForecastDto (위 3번과 동일 형태)
```
> 독립 기능(사용자가 관광지 선택 → 캘린더). 수상작 클릭 플로우는 3번 `/contests/{id}/crowd` 사용.

---

## 5. 포토 비교 (photo-compare) — D6 · 🔒

| 메서드 | 경로 | 설명 |
|--------|------|------|
| POST | `/me/photos` | 사진 업로드 (multipart: file, memo?, takenAt?) |
| GET | `/me/photos` | 내 업로드 사진 목록 |
| DELETE | `/me/photos/{id}` | 내 사진 삭제 |

```json
// UserPhotoDto
{ "id": 5, "url": "https://.../u/5.jpg", "originalFilename": "IMG_1234.jpg",
  "takenAt": "2024-11-01T00:00:00", "memo": "작년 가을", "createdAt": "2026-06-26T..." }
```
> 비교 화면은 프론트에서 내 사진 + 수상작을 나란히 렌더(별도 백엔드 불필요). 비교 *저장*은 향후(10-future B1).

---

## 6. 즐겨찾기 (favorite) — D7 · 🔒

| 메서드 | 경로 | 설명 |
|--------|------|------|
| GET | `/me/favorites?type=` | 즐겨찾기 목록 (type: PHOTO/CONTEST/ATTRACTION) |
| POST | `/me/favorites` | 추가 |
| DELETE | `/me/favorites/{id}` | 삭제 |

```json
// POST /me/favorites 요청 / FavoriteDto 응답
{ "targetType": "CONTEST", "source": "CONTEST", "externalId": "DVvwaI",
  "snapshotTitle": "가야산 설경", "snapshotImageUrl": "https://...image3_1.jpg" }
```
> `snapshot*` 저장 이유: 외부 실시간 호출 회피 — 목록 표시는 스냅샷, 상세는 externalId로 조회(03).

---

## 핵심 플로우: 수상작 클릭 → 안내 + 집중률

```
프론트                              백엔드
  │ GET /contests?season=겨울         │ ContestWork 필터 조회 (DB)
  │◀──────── 목록(thumb,위치) ────────│
  │ (클릭)                            │
  │ GET /contests/{id} ──────────────▶│ 상세 + lat/lng (저장값, 없으면 카카오 지오코딩 후 캐시)
  │◀──── 상세 + 좌표 + crowdAvailable │
  │  지도 표시·길안내 (카카오 JS SDK, 좌표 사용)
  │ crowdAvailable=true 면:           │
  │ GET /contests/{id}/crowd ────────▶│ 시군구로 집중률 조회 → 관광지명 부분일치 매칭
  │◀──── 30일 캘린더 + 추천일 ────────│   (매칭 실패 시 204)
```

## 향후 추가 (10-future)
- `GET /contests/{id}/nearby` 또는 `/places/nearby?lat=&lng=` — 주변 할거리 추천 (위치기반 관광정보 API, B6)
- `POST /me/comparisons` — 비교 기록 저장 (B1)

## 설계 메모 (확장성)
- 모든 응답은 **내부 DTO** — 외부 필드와 분리. 외부 API 교체/캐시 전환 시 컨트롤러·프론트 불변.
- 목록은 공통 페이지 응답 래퍼로 통일 → 프론트 공통 처리 + QA 검증 단순화.
- 신규 콘텐츠 종류는 기존 경로 수정 없이 `targetType`/엔드포인트 추가로 확장.
