# M1 contest — 프론트 훅 ↔ API 매핑표 (QA 교차검증용)

> 작성: frontend. 기준: `docs/04` · `_workspace/api-shapes/M1_lead_contest-shapes.md` · `_workspace/contracts/M1_lead_contracts.md`.
> 목적: qa-integration이 **백엔드 실제 응답 shape ↔ 프론트 훅 타입**을 양쪽 동시 읽기로 대조하는 진입점.
> 타입은 시드 그대로 정의(any/제네릭 우회 없음). 백엔드 실응답이 다르면 임의 캐스팅 말고 보고.

## 타입 정의 위치
- 공통 래퍼: `frontend/src/lib/api-types.ts` — `Page<T>`, `ApiErrorBody`(`{error:{code,message}}`), `AppError`(정규화).
- contest DTO: `frontend/src/features/contest/types.ts` — `ContestSummary`, `ContestDetail`, `FilterOptions`, `CrowdForecast`, `CrowdDaily`, `ContestQuery`.

## 엔드포인트 ↔ 훅 ↔ 타입

| API (baseURL `/api/v1`) | api.ts 함수 | 훅 | 반환 타입 | 화면 |
|---|---|---|---|---|
| `GET /contests?season=&grade=&division=&sido=&keyword=&page=&size=&sort=` | `fetchContests(query,page)` | `useContests(query)` (useInfiniteQuery) | `Page<ContestSummary>` | ContestListPage |
| `GET /contests/filters` | `fetchContestFilters()` | `useContestFilters()` | `FilterOptions` | ContestListPage(필터바) |
| `GET /contests/{id}` | `fetchContestDetail(id)` | `useContestDetail(id)` | `ContestDetail` | ContestDetailPage |
| `GET /contests/{id}/crowd` | `fetchContestCrowd(id)` | `useContestCrowd(id,enabled)` | `CrowdForecast \| null` (204→null) | ContestDetailPage(집중률) |

파일: `frontend/src/features/contest/api.ts`, `.../hooks/*.ts`.

## 경계면 처리 규약(검증 포인트)
- **페이지 unwrap**: `useContests`가 `Page<T>.content`를 `flatMap`, `page.hasNext`로 다음 페이지(`page.page + 1`). size=20(`CONTEST_PAGE_SIZE`). 1-based page.
- **204 처리**: `/contests/{id}/crowd`는 `validateStatus`로 200·204 허용 → 204면 `null` 반환 → 상세에서 **집중률 섹션 숨김**(에러 아님). `crowdAvailable=false`면 훅 `enabled:false`로 **호출 자체 안 함**.
- **lat/lng null**: `ContestMap`이 좌표 null이거나 `VITE_KAKAO_JS_KEY` 미설정이면 '지도 준비중'/'위치 정보 준비중' graceful(앱 안 죽음). 길안내는 좌표 있을 때만 노출(카카오맵 link URL).
- **날짜 포맷 상이(캐스팅 금지)**: 목록 `filmMonth`=`YYYYMM`(→ `formatFilmMonth` `YYYY.MM`), 집중률 `daily[].date`=`YYYY-MM-DD`(→ `parseISO`). 서로 변환/혼용 안 함.
- **에러 정규화**: `apiClient`가 `{error:{code,message}}` 우선 파싱, 없으면 상태코드 추론(401/403/404/**429 QUOTA_EXCEEDED**/**502 UPSTREAM_ERROR**/타임아웃/네트워크). 화면은 `ErrorState`가 `AppError.message` 표시 + 재시도.
- **3종 상태**: 모든 화면 로딩(Skeleton)/빈/에러+재시도. 목록 빈 결과는 `EmptyState`(정상).

## 라우트 ↔ 화면 (docs/08, 하단탭/상단네비 `to`와 일치)
| 경로 | 컴포넌트 | 비고 |
|---|---|---|
| `/contests` | `features/contest/pages/ContestListPage` | M1 구현 |
| `/contests/:id` | `features/contest/pages/ContestDetailPage` | M1 구현 |
| `/`,`/crowd`,`/compare`,`/me`,`/login` | `src/pages/*` placeholder | 후속 마일스톤 |
라우터: `frontend/src/routes/router.tsx`. 탭 소스: `frontend/src/components/layout/navItems.ts`.

## backend 확정본 대조 결과 (M1_backend_contest-shapes.md 기준 — 전부 해소)
1. ✅ **`GET /contests/filters`**: 시드 `FilterOptions{seasons,grades,divisions,sidos:string[]}` 그대로 확정(seasons 봄·여름·가을·겨울 순, 나머지 오름차순, 빈 데이터면 빈 배열). 타입 변경 없음. 옵션 로드 실패는 graceful 유지.
2. ✅ **`sort`**: 백엔드 허용 field `id`·`filmMonth`·`awardGrade`·`sigungu`·`season`, 형식 `field,(asc|desc)`, 기본 `id,desc`(그 외 폴백). M1엔 정렬 UI 없음 — `ContestQuery.sort?:string`만 유지. 추후 UI 추가 시 허용값 내에서.
3. ✅ **`CrowdForecast.recommendedDates`**: 최종 JSON 포함 확정(YYYY-MM-DD, 최대 5, 혼잡도 낮은순·날짜 오름차순). `CrowdCalendar`가 그대로 강조.
4. ✅ **`season` null**: 빈문자열 아닌 null 확정 — 기존 `string|null` 정합.
5. ✅ **F1 수정완료** — `sido`/`sigungu`를 `string|null`로 변경(`types.ts`). 백엔드 nullable(파싱 실패 시 null)과 정합. `ContestDetail`은 extends로 자동 반영. 렌더링 deref 없음(영향 없음). 재빌드 통과.

추가 확정 메모: `keywords`는 항상 배열(없으면 `[]`), `size`는 1~100 클램프(프론트 20 고정), `page` 1-based.

## 런타임 검증
- `npm install`(310 pkgs) + `npm run build`(`tsc -b` 타입체크 + `vite build`) **통과**(F1 수정 후 재빌드 포함). strict + noUnusedLocals/Parameters 클린.
- 실데이터 적재(external #5~#8) 전이라 목록이 빈 응답일 수 있음 → `EmptyState`로 정상 처리. 적재 후 실데이터 대조는 backend/QA와 후속.
