# 06. 외부 API 연동 (실제 응답 기준)

> ⚠️ 아래 필드는 **추측이 아니라 실제 호출 응답**에서 확인한 것 (2026-06-26 테스트).
> 공통: data.go.kr `serviceKey`(URL-encode), `MobileOS`, `MobileApp`, `_type=json` 필수.
> 응답 공통 래퍼: `response.header.resultCode/resultMsg` + `response.body.items.item[]` + `numOfRows/pageNo/totalCount`.

## 1. 공모전 수상작 — `PhokoAwrdService`

- 엔드포인트: `https://apis.data.go.kr/B551011/PhokoAwrdService`
- 오퍼레이션: `/phokoAwrdList`(목록), `/phokoAwrdSyncList`(동기화), `/ldongCode`(법정동코드)
- **전체 건수: 95건** → 매우 작음, 전체 저장에 적합 ✅

실제 응답 필드:

| 필드 | 예시 | 설명 |
|------|------|------|
| contentId | `DVvwaI` | 외부 식별자(문자열) |
| koTitle / enTitle | 가야산 설경 / Snowscape... | 제목(국/영) |
| lDongRegnCd | `48` | 법정동 시도 코드 |
| koFilmst / enFilmst | 경상남도 합천군, 가야산국립공원 | 촬영지(국/영) |
| filmDay | `202401` | 촬영월(YYYYMM) |
| koCmanNm / enCmanNm | 서정철 | 촬영자(국/영) |
| koWnprzDiz / enWnprzDiz | `스마트폰 부문 [입선]` | **수상내역(부문+등급이 한 문자열)** |
| koKeyWord / enKeyWord | `...가야산 설경, ..., 겨울, 눈` | **키워드(콤마 구분, 계절·주제 섞여 있음)** |
| orgImage / thumbImage | https://tong.visitkorea.or.kr/... | 원본/썸네일 이미지 URL |
| cpyrhtDivCd | `Type1` | 저작권 구분(공공누리 유형) |
| regDt / mdfcnDt | 20241113160022 | 등록/수정 일시 |

**중요(가정 정정):**
- ❌ "계절"·"수상등급" **독립 필드 없음**. 계절→`koKeyWord` 텍스트, 등급→`koWnprzDiz` 텍스트에 섞임.
- ❌ **좌표(위경도) 없음**. 촬영지는 텍스트 + 법정동코드뿐.
- ✅ 국/영문 동시 제공 → 다국어 확장 유리.

## 2. 관광사진 — `PhotoGalleryService1`

- 엔드포인트: `https://apis.data.go.kr/B551011/PhotoGalleryService1`
- 오퍼레이션: `/galleryList1`(목록), `/gallerySearchList1`(**키워드 검색**, `keyword` 필수), `/galleryDetailList1`(제목 상세), `/gallerySyncDetailList1`(동기화)
- **전체 건수: 6,119건** (키워드 검색은 부분집합)

실제 응답 필드:

| 필드 | 예시 | 설명 |
|------|------|------|
| galContentId | `3591043` | 외부 식별자 |
| galContentTypeId | `17` | 콘텐츠 타입(17=관광사진) |
| galTitle | 저지곶자왈 | 제목 |
| galWebImageUrl | `http://tong.visitkorea.or.kr/...jpg` | **이미지 URL (주의: HTTP)** |
| galCreatedtime / galModifiedtime | 20251231161942 | 생성/수정 |
| galPhotographyMonth | `202509` | 촬영월 |
| galPhotographyLocation | 제주특별자치도 제주시 한경면 | 촬영지(텍스트) |
| galPhotographer | 천건엽 | 촬영자 |
| galSearchKeyword | `저지곶자왈, ..., 숲, 산책로, ...` | 키워드(콤마 구분) |

**중요:**
- 키워드(단풍/야경 등) 검색은 `/gallerySearchList1` + `keyword`(한글 URL 인코딩).
- ❌ **좌표 없음** (촬영지 텍스트만).
- ⚠️ 이미지 URL이 **HTTP** → HTTPS 사이트에서 혼합콘텐츠 차단 가능 (프록시/URL 치환 필요할 수 있음).

## 3. 집중률 예측 — `TatsCnctrRateService`

- 엔드포인트: `https://apis.data.go.kr/B551011/TatsCnctrRateService`
- 오퍼레이션: `/tatsCnctrRatedList`
- 필수 파라미터: `areaCd`(시도코드) + `signguCd`(시군구코드) — **별도 코드표 파일 필요**(매뉴얼 '관광지_시군구_코드정보'), 선택 `tAtsNm`(관광지명)
- 전체 건수(1개 시군구 예): 1,650건 = 관광지 × 향후 30일

실제 응답 필드:

| 필드 | 예시 | 설명 |
|------|------|------|
| baseYmd | `20260626` | 날짜(YYYYMMDD) |
| areaCd / areaNm | 51 / 강원특별자치도 | 시도 |
| signguCd / signguNm | 51130 / 원주시 | 시군구 |
| tAtsNm | 간현관광지 | 관광지명 |
| cnctrRate | `35.25` | 집중률(%) |

**중요:**
- 조회 단위가 **지역코드(시도+시군구) + 관광지명**. 좌표·contentId 없음.
- ❌ 사진/공모작과 **직접 연결 키 없음** (사진엔 관광지코드/명이 정형화돼 있지 않음). → 기능 연결 전략 필요.

## 4. Kakao Map — ✅ 확정 · 검증 완료 (2026-06-26)

**실측:** 공모전 수상작 8건의 촬영지 텍스트를 카카오 키워드 검색으로 변환 → **8/8 정확한 좌표 획득**.
- 예: "경상남도 합천군, 가야산국립공원" → 가야산국립공원 (35.80, 128.11)
- **지오코딩 파싱 규칙:** 촬영지 텍스트를 콤마/슬래시로 분리 → **마지막 조각(장소명)**으로 키워드 검색이 가장 정확. 0건이면 전체 문자열 재시도 → 그래도 0건이면 첫 조각(행정구역)으로 주소 검색 폴백.


위 API들이 모두 **좌표를 안 주므로**, 지도 API의 1순위 역할은 **텍스트(촬영지)→좌표 변환**이다. 후보(카카오/네이버/구글) 비교 결과 **카카오맵으로 확정**. 우리 데이터(장소명 텍스트)와 사용자 플로우에 가장 적합.

사용할 카카오 기능:
| 기능 | API | 용도 |
|------|-----|------|
| **키워드 장소 검색** | `GET /v2/local/search/keyword` | **지오코딩 주력** — "가야산국립공원" 등 장소명→좌표+상세 |
| 주소 검색 | `GET /v2/local/search/address` | 폴백 — "합천군" 등 행정구역→시군구 중심 좌표 |
| 카테고리 검색 | `GET /v2/local/search/category` | 향후 "할거리 추천" — 주변 관광명소(AT4)·음식점(FD6)·숙박(AD5) |
| 지도 표시/마커 | Kakao Maps **JS SDK** | 화면에 위치 표시 (Capacitor WebView 호환) |
| 길찾기 | 길찾기/내비 | "거기 어떻게 가" 경로 안내 |

**지오코딩 2단계 폴백:** ① 장소명 키워드 검색 → ② 실패 시 행정구역 주소 검색. → 어떤 촬영지든 최소 동/면 수준 좌표 확보.

**필요 키:**
- **REST API 키** — 서버에서 지오코딩·장소검색·길안내 호출 (지금 테스트/개발에 필요)
- **JavaScript 키** — 프론트 지도 화면 표시 (개발 시 도메인 등록 필요, localhost 가능)

⚠️ REST 키 확보 후 "가야산국립공원" 등으로 실제 좌표가 잘 나오는지 검증 예정.

---

## 설계에 미치는 영향 (결정/대응 필요)

| # | 발견 | 영향 | 대응안 |
|---|------|------|--------|
| X1 | 공모전 계절/등급 독립 필드 없음 | 필터 구현 난이도 | 저장 시 `koWnprzDiz`→부문/등급, `koKeyWord`→계절 **파싱**하여 컬럼화 (vs 텍스트 검색) |
| X2 | 모든 사진 API에 좌표 없음 | 지도 핀 불가 | Kakao 지오코딩으로 촬영지 텍스트→좌표 변환 (정확도·쿼터 고려) |
| X3 | 집중률↔사진 연결 키 없음 | "방문 타이밍" 연계 약함 | 집중률을 **독립 기능**(관광지 선택→예측)으로, 또는 지역(시군구) 단위 느슨 매칭 |
| X4 | 사진 이미지 URL이 HTTP | 혼합콘텐츠 차단 | https 치환 시도 또는 백엔드 이미지 프록시 |
| X5 | 집중률 지역코드표 필요 | 관광지 지정 불가 | data.go.kr 매뉴얼의 코드표 확보 필요 |

## 확정 결정 (2026-06-26)

- **공모전 수상작**: DB에 저장(동기화). 저장 시 부문/등급/계절/시도·시군구 **파싱**(X1 → 파싱 채택). 좌표는 카카오 지오코딩으로 보강(X2).
- **관광사진·집중률**: 실시간 호출(저장 안 함).
- **사용자 플로우**: 수상작 리스트/지도 → 클릭 → 위치·길안내 + 집중률 + (향후)할거리 추천.
- **집중률(X3)**: 수상작 장소가 집중률 관광지와 매칭되면 표시, **안 되면 생략/지역 대체**(graceful fallback). 매칭률은 코드표 확보 후 실측.
- **할거리 추천(⑤)**: "위치기반 관광정보" API 추가 신청 후 구현(10-future B6).
- **대기 항목**: 카카오 REST 키, 집중률 지역코드표(X5) — 확보 후 좌표·관광지목록·매칭률 진행.

## 내부 DTO 설계 원칙 (어댑터 격리)

외부 필드명(`galWebImageUrl`, `koTitle` 등)을 도메인·프론트에 노출하지 않는다. 어댑터가 내부 DTO로 변환:

```
ContestWorkDto { id, title, location, photographer, filmMonth, award{division,grade}, keywords[], imageUrl, thumbUrl, season? }
PhotoDto       { id, title, location, photographer, filmMonth, imageUrl, keywords[] }
CrowdForecast  { attractionName, region, daily[ {date, rate} ] }
```
→ 외부 API가 바뀌어도 어댑터만 수정, 도메인/프론트 불변 (확장성 원칙).
