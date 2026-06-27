---
name: external-api-adapter
description: "Into the Picture 외부 API 어댑터 구현 규약 — Provider 인터페이스 격리, 외부 응답→내부 DTO 변환, 캐싱 seam, 공모전 수상작 동기화+파싱, 집중률 부분일치 매칭, 카카오 지오코딩. 한국관광공사(관광사진·공모전·집중률)·카카오 API 연동 코드를 작성·수정할 때 반드시 사용."
---

# 외부 API 어댑터 구현 규약

외부 API의 변화·장애가 도메인/프론트에 전파되지 않도록 격리한다. 실제 API 스펙(검증된 사실)은 `docs/06-external-apis.md`, 이 스킬은 구현 방법이다.

## 핵심: Provider 인터페이스 + 어댑터

도메인은 인터페이스에만 의존하고, 외부 호출은 어댑터 구현체에 가둔다.

```
[도메인 서비스] → PhotoProvider / ContestProvider / CrowdProvider / GeocodingProvider (interface)
                     └─ *LiveAdapter (외부 HTTP 호출 + DTO 변환)   ← 현재
                        (나중) *CachedAdapter(데코레이터) / *DbAdapter
```

이렇게 해야 실시간→캐시/DB 전환을 **구현 교체만으로** 할 수 있다(확장성). 인터페이스 시그니처·반환 DTO는 backend-engineer와 합의해 `_workspace/`에 게시한다.

## 내부 DTO 변환 — 외부 필드명 격리
- 외부 필드(galWebImageUrl, koTitle, cnctrRate…)를 도메인/응답에 노출하지 않는다. 어댑터에서 **내부 DTO**로 변환한다.
- 내부 DTO 형태: `docs/04`의 응답 shape와 정합. 필드명은 camelCase.
- 필드 매핑표는 `references/tour-apis.md`.

## 실시간 호출 규약
- 타임아웃 5s + 1회 재시도. 실패 시 빈 결과 또는 명확한 에러 전파(앱이 죽지 않게).
- 쿼터 초과(429)/장애(502)를 구분해 상위에 알림.
- 관광사진 이미지 URL은 **HTTP → https 치환**(혼합콘텐츠 차단 회피), 불가 시 백엔드 프록시.

## 캐싱 seam
- 지금은 실시간이지만, 어댑터를 데코레이터로 감쌀 수 있게 인터페이스를 깨끗하게 유지한다. 트래픽↑ 시 `CachedAdapter`만 추가(도메인 불변).

## 공모전 수상작 — 동기화 + 파싱 (예외적으로 DB 저장)
- 전체 95건으로 작아 DB에 적재한다. `ContestProvider`는 **우리 DB**를 조회(실시간 아님).
- `ContestSyncJob`이 `phokoAwrdSyncList`로 적재·갱신하며, 저장 시 파싱:
  - `koWnprzDiz`("스마트폰 부문 [입선]") → awardDivision + awardGrade
  - `koKeyWord`에서 계절 키워드(봄/여름/가을/겨울·단풍·설경 등) → season
  - `koFilmst`("경상남도 합천군, …") → sido + sigungu
- **원문(awardRaw, keywordsRaw)도 함께 저장** — 파싱 규칙이 바뀌어도 재파싱 가능.

## 집중률 매칭 (graceful)
- 집중률은 `areaCd`+`signguCd`로 조회. 시군구 코드표: `design-process/data/sigungu-codes.json`.
- 수상작 장소와 집중률 관광지명은 **정확히 일치하지 않는다**(예: "가야산국립공원" vs "가야산국립공원(홍류동,청량동지구)"). → **부분일치/정규화 매칭**으로 찾는다.
- 매칭 실패 시 생략(빈 결과). 없는 게 정상 흐름이다.

## 지오코딩
- 모든 사진/수상작에 좌표가 없으므로 카카오로 변환. 방법은 `references/kakao-geocoding.md` (검증됨 8/8).

## 키
- `.env`의 `DATA_GO_KR_KEY`, `KAKAO_REST_KEY`를 환경변수로 읽는다. 코드에 하드코딩 금지.

## 산출물
- `backend/`의 external 패키지(어댑터·DTO·sync) + `_workspace/`에 Provider 계약 게시.
