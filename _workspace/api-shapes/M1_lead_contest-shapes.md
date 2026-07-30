# M1 contest 응답 shape 시드 (docs/04 기준)

> frontend가 백엔드 완성 전 **타입 선개발**에 쓰는 시드. backend가 실제 구현 shape를 같은 파일/디렉토리에 게시하면 그것이 최종.
> 외부 필드명(galWebImageUrl·koTitle…) 노출 금지 — 아래는 모두 내부 DTO.

## 공통 래퍼

```ts
// 목록 공통
type Page<T> = {
  content: T[];
  page: { page: number; size: number; totalCount: number; hasNext: boolean };
};
// 에러 공통 (HTTP 400/401/403/404/429/502 병행)
type ApiError = { error: { code: string; message: string } };
```

## ContestSummaryDto — `GET /contests` content[]

```ts
type ContestSummary = {
  id: number;
  title: string;
  thumbUrl: string;        // https 치환됨
  location: string;        // "경상남도 합천군, 가야산국립공원"
  sido: string;            // "경상남도"
  sigungu: string;         // "합천군"
  photographer: string;
  filmMonth: string;       // "202401" (YYYYMM)
  awardDivision: string;   // "스마트폰 부문"
  awardGrade: string;      // "입선"
  season: string | null;   // "겨울" | null
  keywords: string[];
};
```

## ContestDetailDto — `GET /contests/{id}`

```ts
type ContestDetail = ContestSummary & {
  imageUrl: string;        // 원본, https 치환됨
  lat: number | null;      // 지오코딩 결과(없으면 on-demand 후 채움)
  lng: number | null;
  copyright: string;       // "Type1"
  crowdAvailable: boolean; // true면 프론트가 /crowd 호출
};
```

## FilterOptionsDto — `GET /contests/filters`

> docs/04엔 "계절·등급·부문 목록"만 명시. 리드 제안 shape(backend 확정 필요):

```ts
type FilterOptions = {
  seasons: string[];     // ["봄","여름","가을","겨울"]
  grades: string[];      // ["대상","최우수","우수","입선", ...]
  divisions: string[];   // ["디지털카메라 부문","스마트폰 부문", ...]
  sidos: string[];       // 데이터에 존재하는 시도 목록
};
```

## CrowdForecastDto — `GET /contests/{id}/crowd` (매칭 시 200, 없으면 204)

```ts
type CrowdForecast = {
  attractionName: string;       // "가야산국립공원(홍류동,청량동지구)"
  areaNm: string;               // "경상남도"
  sigunguNm: string;            // "합천군"
  matchType: "EXACT" | "PARTIAL";
  daily: { date: string; rate: number }[];   // date "YYYY-MM-DD", 30일
  recommendedDates: string[];   // 혼잡도 낮은 추천일(백엔드 계산)
};
```

## 프론트 처리 주의 (QA 교차검증 포인트)
- 목록 훅은 `Page<T>`에서 `.content` unwrap + `.page.hasNext`로 무한스크롤.
- `/contests/{id}/crowd`가 **204**면 캘린더 섹션 **숨김**(에러 아님). `crowdAvailable=false`면 애초에 호출 안 함.
- `lat/lng`가 null일 수 있음 → 지도 마커 graceful 처리.
- 날짜 포맷: 목록 `filmMonth`=YYYYMM, 집중률 `date`=YYYY-MM-DD (상이, 캐스팅 금지).
