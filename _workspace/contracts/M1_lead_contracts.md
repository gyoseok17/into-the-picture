# M1 계약 시드 (리드 제안 — backend↔external 합의로 확정)

> 단일 진실은 `docs/`. 이 문서는 M1(기반 + contest 슬라이스) 경계면을 **빠르게 합의**하기 위한 리드의 제안이다.
> backend-engineer·external-integration-engineer가 SendMessage로 검토→확정하고, 변경 시 이 파일을 갱신한다.
> 시그니처는 제안이며 패키지 위치·세부 타입은 두 담당이 조정 가능(DIP: 도메인이 port 소유, external이 adapter 구현 선호).

## 0. M1 범위 / 소유 분담

| 영역 | 담당 | 산출물 |
|------|------|--------|
| 프로젝트 스캐폴딩(Gradle·Spring Boot 3·Java 17) | backend | `backend/` build·설정·프로파일 |
| 공통 인프라(BaseTimeEntity·페이지 래퍼·에러 포맷·전역 예외·CORS·`/api/v1`) | backend | `backend/.../common` |
| 엔티티·Flyway V1(User·UserPhoto·Favorite·ContestWork + enum + 인덱스) | backend | `backend/.../{domain}`, `db/migration/V1__init.sql` |
| contest 조회 도메인(Repository 필터·Service·Controller·DTO) | backend | `backend/.../contest` |
| Provider **port 인터페이스 선언**(GeocodingProvider·CrowdProvider) | backend(도메인) | `backend/.../<domain>/port` |
| Provider **adapter 구현** + 외부 클라이언트 | external | `backend/.../external/*` |
| 공모전 sync + 파서(부문·등급·계절·시도·시군구) | external | `ContestSyncJob`, `*Parser` |
| 카카오 지오코딩(2단계 폴백) | external | `GeocodingProvider` 구현 |
| 집중률 매칭(시군구→코드·관광지명 부분일치) | external | `CrowdProvider` 구현 |
| contest 화면·훅·지도·집중률 캘린더 | frontend | `frontend/src/features/contest` 등 |
| 경계면 incremental QA | qa | `_workspace/qa/` |

## 1. ContestWork 엔티티 (backend 정의, external sync가 채움) — ✅ 확정 (backend, 2026-06-28)

> **확정**: `com.intothepicture.domain.contest.entity.ContestWork` + `ContestRepository` 구현·컴파일 완료. 필드셋 아래 표 그대로 고정.
> - 테이블 `contest_work`(snake_case 컬럼), `content_id` UNIQUE, 인덱스 `season/award_grade/sigungu`. enum 없음(전부 String/Double/LocalDateTime).
> - external upsert: `ContestRepository.findByContentId`/`existsByContentId`/`save`. 신규 행은 **`ContestWork.builder()`** 로 생성(원문·파싱 필드 + `syncedAt` 세팅). id 외 일반 setter 없음.
> - 보강은 backend 제공 메서드로만: `assignCoordinates(double,double)`, `assignCrowdAttraction(String)` → 호출 후 `save`. (external #6/#7 보강 배치)
> - `keywordsRaw`=TEXT. `externalRegDt/externalMdfcnDt`=`LocalDateTime`(외부 14자리 `regDt`/`mdfcnDt` 를 external 파서가 변환). `filmMonth`=String "YYYYMM".

필드·타입은 `docs/03` 표 그대로. **원문 + 파싱값 동시 저장**(재파싱 가능).

| 그룹 | 필드 | 채우는 주체/시점 |
|------|------|------------------|
| 식별 | `contentId`(UNIQUE) | sync |
| 원문 | `title/titleEn, location/locationEn, sidoCode, photographer/photographerEn, filmMonth, awardRaw, keywordsRaw, orgImageUrl, thumbImageUrl, copyrightCode, externalRegDt/externalMdfcnDt` | sync |
| 파싱 | `sido, sigungu`(location 파싱), `awardDivision, awardGrade`(awardRaw 파싱), `season`(keywordsRaw 파싱, 없으면 null) | sync(파서는 external) |
| 보강 | `lat, lng`(지오코딩, null 허용), `crowdAttractionName`(집중률 매칭명, null 허용) | 보강 배치(geocode/crowd-match) |
| 메타 | `syncedAt` | sync |

- 인덱스: `season, awardGrade, sigungu`.
- `crowdAvailable`(API 응답 필드) = `crowdAttractionName != null`.
- external은 backend의 `ContestWork` 엔티티 + `ContestRepository`를 통해 저장(단일 모듈 모놀리스). 엔티티 필드셋 확정 전에는 파서를 **순수 함수**로 선개발.

### 파서 규약 (external 소유, `docs/06` 실응답 기준)
- award: `koWnprzDiz` 예 `"스마트폰 부문 [입선]"` → `division="스마트폰 부문"`, `grade="입선"`. 대괄호/공백 변형 방어.
- season: `koKeyWord` 콤마분리 토큰에서 `봄/여름/가을/겨울`(또는 벚꽃→봄·단풍→가을·설경→겨울 등 매핑) 추출, 없으면 null.
- location: `koFilmst` 예 `"경상남도 합천군, 가야산국립공원"` → `sido="경상남도"`, `sigungu="합천군"`(첫 조각의 행정구역). 지오코딩 키워드는 **마지막 조각(장소명)** 사용.

## 2. GeocodingProvider (external 구현 / backend contest 도메인 사용) — ✅ 확정 (backend, 2026-06-28)

> **port 선언 완료**(도메인 소유, DIP). external 은 이 인터페이스를 구현하는 `@Component` 어댑터 1개만 빈으로 등록하면 backend 가 자동 주입한다(Optional 주입 → 미연동이어도 backend 부팅·동작 OK).
> - 패키지: **`com.intothepicture.domain.contest.port`** (`GeocodingProvider`, `Coordinate`). *주의: 시드의 `external` 패키지 아님 — DIP 로 도메인 port 에 둠.*
> - backend 가 넘기는 인자: `geocode(work.getLocation())` — **촬영지 전체 텍스트**. 콤마/슬래시 분리·마지막조각 키워드검색·폴백은 어댑터 책임.

```java
public interface GeocodingProvider {
    /** 촬영지 텍스트 → 좌표. 2단계 폴백(키워드검색→주소검색). 실패 시 empty. */
    Optional<Coordinate> geocode(String locationText);
}
public record Coordinate(double lat, double lng) {}
```
- 폴백(`docs/06` X2·4번): 콤마/슬래시 분리 → 마지막 조각 키워드검색 → 0건이면 전체문자열 → 0건이면 첫 조각 주소검색.
- 사용처: ① 보강 배치(ContestWork.lat/lng 일괄), ② `GET /contests/{id}` 시 lat/lng null이면 on-demand 호출 후 저장(캐시) — `docs/04` 플로우.

## 3. CrowdProvider (external 구현 / backend contest·crowd 도메인 사용) — ✅ 확정 (backend, 2026-06-28)

> **port 선언 완료**(도메인 소유, DIP). external 은 구현 어댑터 `@Component` 1개를 빈 등록(Optional 주입). 시그니처는 시드 그대로 확정.
> - 패키지: **`com.intothepicture.domain.crowd.port`** (`CrowdProvider`, `CrowdQuery`, `CrowdForecast`, `DailyRate`, `MatchType`). *시드의 `external` 패키지 아님 — DIP.*
> - backend 가 만드는 `CrowdQuery` = `(work.getSidoCode(), work.getSigungu(), crowdAttractionName ?? 촬영지 마지막조각)`. 어댑터는 `sigunguName`→`signguCd` 해석 + `tAtsNm` 부분일치.
> - `recommendedDates` 는 backend 가 daily 로 계산(하위 5일·날짜순) → provider 는 **daily 까지만** 반환.

```java
public interface CrowdProvider {
    /** 시군구로 좁힌 뒤 관광지명 부분일치 → 30일 일별 집중률. 매칭 실패 시 empty. */
    Optional<CrowdForecast> getForecast(CrowdQuery query);
}
public record CrowdQuery(String sidoCode, String sigunguName, String placeNameText) {}
public record CrowdForecast(String attractionName, String areaNm, String sigunguNm,
                            MatchType matchType, List<DailyRate> daily) {}
public record DailyRate(LocalDate date, double rate) {}
public enum MatchType { EXACT, PARTIAL }
```
- 시군구 코드 해석: `design-process/data/sigungu-codes.json`(flat `{areaCd,areaNm,sigunguCd,sigunguNm}`) → 앱 리소스로 이동(`src/main/resources/`). external이 `sigunguName`→`signguCd` 해석.
- 매칭: `signguCd`로 `TatsCnctrRatedList` 호출 → `tAtsNm` 부분일치(`placeNameText` 포함/역포함) → 매칭 관광지의 30일 행 수집.
- **`recommendedDates`는 도메인(backend)이 계산**(혼잡도 하위 N일 등). Provider는 daily만 반환.
- contest 플로우 입력: ContestWork의 `sido/sidoCode + sigungu + (crowdAttractionName ?? location 장소조각)`.

## 4. 이미지 URL 규약
- 모든 이미지 URL은 응답 직전 `http://` → `https://` 치환(`docs/06` X4). contest 썸네일/원본 공통.

## 5. M1 contest 엔드포인트 (응답 shape는 api-shapes/ 참조)
- `GET /contests?season=&grade=&division=&sido=&keyword=&page=&size=&sort=` → page<ContestSummaryDto>
- `GET /contests/filters` → FilterOptionsDto
- `GET /contests/{id}` → ContestDetailDto (lat/lng·crowdAvailable 포함)
- `GET /contests/{id}/crowd` → CrowdForecastDto(매칭) 또는 204 No Content

## 6. 합의 절차
1. backend가 ContestWork 엔티티 필드셋 + port 인터페이스 시그니처를 확정해 이 파일에 ✅ 표시 + `_workspace/api-shapes/`에 실제 응답 shape 게시.
2. external이 시그니처 수용/이견을 SendMessage로 회신, 합의 후 adapter 구현.
3. 불일치는 삭제 말고 `docs/` 기준으로 합의(오케스트레이터 에러표).
