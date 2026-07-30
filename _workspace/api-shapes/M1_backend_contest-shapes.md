# M1 contest 응답 shape — backend 확정본 (실제 구현)

> 게시: backend · 출처: `backend/src/main/java/com/intothepicture/domain/contest/dto/*` 실제 DTO + `ContestController`.
> 이 문서가 **최종 계약**(리드 시드 `M1_lead_contest-shapes.md` 를 대체). `@WebMvcTest`(ContestControllerTest)로 아래 shape 를 회귀 고정.
> 외부 필드명(galWebImageUrl·koTitle…) 비노출. 모든 이미지 URL 은 응답 직전 `http://`→`https://` 치환.

## 공통 래퍼 / 에러

```ts
type Page<T> = {
  content: T[];
  page: { page: number; size: number; totalCount: number; hasNext: boolean };
};
type ApiError = { error: { code: string; message: string } };
// code ∈ INVALID_REQUEST(400) | UNAUTHORIZED(401) | FORBIDDEN(403) | NOT_FOUND(404)
//        | EXTERNAL_QUOTA(429) | EXTERNAL_ERROR(502) | INTERNAL_ERROR(500)
```

- **page 는 1-based**: 첫 페이지 = `page=1`, 응답 `page.page` 도 1 부터. (무한스크롤은 `page.hasNext` 로 판단, 다음 요청은 `page+1`.)
- 단건은 객체 직접 반환(200). 목록은 위 `Page<T>`.

## `GET /api/v1/contests` → `Page<ContestSummary>`

쿼리 파라미터:

| 파라미터 | 기본 | 설명 |
|---------|------|------|
| `season` `grade` `division` `sido` | — | 정확일치 필터(선택). 빈값이면 미적용 |
| `keyword` | — | title·location·keywords 부분일치(대소문자 무시) |
| `page` | `1` | 1-based |
| `size` | `20` | 1~`100`(초과 시 100 으로 클램프) |
| `sort` | `id,desc` | `field,(asc\|desc)`. **허용 field: `id` `filmMonth` `awardGrade` `sigungu` `season`** (그 외/형식오류는 `id,desc` 로 폴백) |

```ts
type ContestSummary = {
  id: number;
  title: string;
  thumbUrl: string;        // https 치환됨
  location: string;        // "경상남도 합천군, 가야산국립공원"
  sido: string | null;     // "경상남도" (파싱 실패 시 null 가능)
  sigungu: string | null;  // "합천군"  (파싱 실패 시 null 가능)
  photographer: string;
  filmMonth: string;       // "202401" (YYYYMM)
  awardDivision: string;   // "스마트폰 부문"
  awardGrade: string;      // "입선"
  season: string | null;   // "겨울" | null  ← 없으면 빈문자열이 아니라 null
  keywords: string[];      // keywordsRaw 콤마 분리·트림 (없으면 [])
};
```

## `GET /api/v1/contests/filters` → `FilterOptions` (확정)

> 프론트 확인 1 회신: 시드의 `{seasons,grades,divisions,sidos}` 그대로 **확정**. 각 배열은 DB 에 실제 존재하는 distinct 값.
> `seasons` 는 봄·여름·가을·겨울 순 정렬, 나머지는 값 오름차순. 데이터가 비면 빈 배열.

```ts
type FilterOptions = {
  seasons: string[];     // 예: ["봄","여름","가을","겨울"]
  grades: string[];      // 예: ["대상","우수","입선", ...]
  divisions: string[];   // 예: ["디지털카메라 부문","스마트폰 부문", ...]
  sidos: string[];       // 데이터에 존재하는 시도 목록
};
```

## `GET /api/v1/contests/{id}` → `ContestDetail`

`ContestSummary` 의 모든 필드(평면) + 아래. `id` 가 없으면 404 `{error:{code:"NOT_FOUND"}}`.
좌표가 없으면 상세 조회 시 지오코딩 on-demand 후 저장(캐시) — 단, geocoding provider 미연동/실패면 `lat/lng=null`.

```ts
type ContestDetail = ContestSummary & {
  imageUrl: string;        // 원본, https 치환됨
  lat: number | null;      // 지오코딩 결과(없으면 null → 지도 마커 graceful 처리)
  lng: number | null;
  copyright: string;       // copyrightCode, 예 "Type1"
  crowdAvailable: boolean; // crowdAttractionName != null. true 면 프론트가 /crowd 호출
};
```

## `GET /api/v1/contests/{id}/crowd` → `CrowdForecast` (200) 또는 **204 No Content**

> 프론트 확인 2 회신: `recommendedDates` 는 **최종 JSON 에 포함**(백엔드가 daily 로 계산, 혼잡도 낮은 상위 5일·날짜 오름차순).
> 매칭 실패 또는 crowd provider 미연동 → **204**(본문 없음, 에러 아님 → 캘린더 섹션 숨김). `id` 없으면 404.

```ts
type CrowdForecast = {
  attractionName: string;       // "가야산국립공원(홍류동,청량동지구)"
  areaNm: string;               // "경상남도"
  sigunguNm: string;            // "합천군"
  matchType: "EXACT" | "PARTIAL";
  daily: { date: string; rate: number }[];   // date "YYYY-MM-DD", 30일
  recommendedDates: string[];                 // "YYYY-MM-DD", 최대 5
};
```

## 경계면 주의 (QA 교차검증)

- 날짜 포맷 상이: 목록 `filmMonth`=`YYYYMM`, 집중률 `date`/`recommendedDates`=`YYYY-MM-DD` (캐스팅 금지).
- `season`·`sido`·`sigungu` 는 **null 가능**(빈문자열 아님) → 옵셔널 처리.
- `/crowd` 204 와 `crowdAvailable=false` 구분: `crowdAvailable=false` 면 애초에 호출 안 함, 호출했는데 204 면 섹션 숨김.
- 외부 데이터 적재 전(현재)에는 목록이 비어 있을 수 있음(정상). external 적재(#8) 후 실데이터 반영.
