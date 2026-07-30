# M1 contest 경계면 incremental QA 리포트 (#12)

> 검증: qa (qa-integration). 방식: **양쪽 동시 읽기 교차비교**(생산자 backend ↔ 소비자 frontend).
> 범위: shape/경계 정합. **데이터 경로 실검증(실제 95건·좌표·집중률)은 external #8 후 별도** — providers 미투입 상태라 현재 /crowd는 항상 204, lat/lng on-demand는 no-op(둘 다 graceful 확인).
> 결과: **PASS 13 · FAIL 1 · 관찰(non-blocking) 2 · 미검증(범위외) 1**.

## 입력 (대조한 실제 코드)
- 생산자: `backend/.../contest/{controller/ContestController, dto/*, service/ContestService, service/RecommendedDatesCalculator, entity/ContestWork, dto/ContestMapper}`, `global/{response/PageResponse, exception/*, support/ImageUrls}`, 회귀테스트 `ContestControllerTest`.
- 소비자: `frontend/src/features/contest/{types.ts, api.ts, hooks/*, components/*, pages/*}`, `frontend/src/lib/{api-types.ts, apiClient.ts, format.ts}`, `routes/router.tsx`, `components/layout/navItems.ts`.
- 계약/shape 문서: `_workspace/contracts/M1_lead_contracts.md`, `_workspace/api-shapes/M1_backend_contest-shapes.md`, `_workspace/frontend/M1_contest_hook-api-map.md`.

---

## FAIL

### F1. `sido`/`sigungu` nullability 불일치 (frontend 수정) — MEDIUM(잠재, 현재 비크래시)
- 생산자: `ContestSummaryDto.sido/sigungu`는 `String`(nullable). 엔티티 `ContestWork.java:94,97` nullable 컬럼이며 파서가 파싱 실패 시 null. 계약 `api-shapes:45-46` = `sido: string | null` / `sigungu: string | null`.
- 소비자: `frontend/src/features/contest/types.ts:13-14` = `sido: string` / `sigungu: string` (**non-null**). `ContestDetail`은 extends라 동일 문제 상속.
- 판정: 계약 위반. 동일 nullable 케이스인 `season`은 types.ts:17에서 `string | null`로 올바르게 처리됐으나 sido/sigungu만 누락됨.
- 현재 영향: 두 **응답** 필드를 렌더링에서 deref하는 곳 없음(grep: `.sido/.sigungu` 사용처는 `ContestFilterBar.tsx:38,96`의 `value.sido` = ContestQuery 쿼리파라미터로 무관). → 런타임 크래시 없음. 단, 향후 `detail.sido.trim()` 류 추가 시 NPE 잠재 + 공개 계약 위반.
- 수정(frontend): `types.ts:13-14` →
  ```ts
  sido: string | null
  sigungu: string | null
  ```
  백엔드는 계약대로라 변경 불필요.
- 통보: frontend(수정), backend(확인용 — 옳은 쪽). 둘 다 SendMessage 발송 완료.

---

## PASS (생산자·소비자 양쪽 확인)

| # | 항목 | 생산자 | 소비자 | 결과 |
|---|------|--------|--------|------|
| P1 | Page<T> 래퍼·1-based·unwrap | `PageResponse`(`{content,page:{page,size,totalCount,hasNext}}`, `getNumber()+1`) | `api-types.ts:5-13` 동일 + `useContests.ts:12-14`(`page.hasNext`, next=`page.page+1`, init 1) + `ContestListPage:39-42` flatMap `.content`, size20=`api.ts:12` | ✅ |
| P2 | ContestSummary 필드/타입 | `ContestSummaryDto`(12필드) | `types.ts:6-19` | ✅ (sido/sigungu null만 F1) |
| P3 | ContestDetail 추가필드 | `ContestDetailDto`(imageUrl, lat/lng `Double`, copyright, crowdAvailable `boolean`) | `types.ts:22-28`(lat/lng `number|null`) | ✅ |
| P4 | FilterOptions | `FilterOptionsDto{seasons,grades,divisions,sidos}` | `types.ts:31-36` + `ContestFilterBar`(grades→grade, divisions→division, sidos→sido 매핑) | ✅ |
| P5 | CrowdForecast 전 필드 | `CrowdForecastDto`(matchType `String`=`.name()`, daily{date,rate}, recommendedDates) | `types.ts:45-52`(matchType `'EXACT'|'PARTIAL'`) + `CrowdCalendar` | ✅ |
| P6 | recommendedDates 응답 포함 | `ContestMapper:62-64`(도메인 `RecommendedDatesCalculator` 계산), 테스트 `:99` 실 JSON 확인 | `CrowdCalendar:50,79-87` 사용 | ✅ frontend Q#3 해소 |
| P7 | /crowd 204 & crowdAvailable graceful | `ContestController:63-68`(Optional.empty→204), `ContestService:82-89` | `api.ts:43-51`(validateStatus 200/204→null) + `useContestCrowd`(enabled) + `ContestDetailPage:28,102,142`(crowdAvailable 게이트 + null이면 섹션 숨김) | ✅ 에러 아님 |
| P8 | 라우팅 | `router.tsx:19-20`(`/contests`, `/contests/:id`) | `navItems.ts`(`/contests`), `ContestCard:13`(`/contests/${id}`), `ContestDetailPage:33`(back `/contests`) | ✅ 전부 매칭 |
| P9 | 이미지 https 치환 | `ImageUrls.toHttps` → `ContestMapper:23,50`(thumb+org) | 단순 렌더(`AspectImage`) | ✅ |
| P10 | 날짜포맷 비캐스팅 | filmMonth `YYYYMM`(String), crowd date `YYYY-MM-DD`(`ISO_LOCAL_DATE`) | `format.ts`(filmMonth→`YYYY.MM`), `CrowdCalendar`(`parseISO`/`format 'yyyy-MM-dd'`) — 상호 변환·혼용 없음 | ✅ |
| P11 | lat/lng null | `Double`(nullable), `ContestService:72-77` on-demand | `ContestMap:19-22`(hasCoords 게이트, placeholder, 길안내 좌표시만) | ✅ |
| P12 | error shape + 429/502 | `ErrorResponse{error:{code,message}}`, code=`ErrorCode.name()`, `ErrorCode`(429 EXTERNAL_QUOTA·502 EXTERNAL_ERROR) | `api-types.ts:16-21` + `apiClient.ts:85-113`(body 우선 파싱, 429/502 구분 메시지) | ✅ |
| P13 | sort 화이트리스트 | `ContestController:28-29,77-88`(id\|filmMonth\|awardGrade\|sigungu\|season, ,asc/,desc, 기본 id,desc, 무효→폴백) | `ContestQuery.sort?` 존재하나 UI 미전달(매핑표 #2) → 현재 무효 sort 전송 없음 | ✅ (정렬 UI 추가 시 허용값 준수 필요) |

추가 확인: season null — 백엔드 nullable(`ContestWork.java:106`) ↔ 프론트 `season: string|null`, 컴포넌트 null-check(`ContestCard:21`, `ContestDetailPage:77`). frontend Q#4 해소.

---

## 관찰 (non-blocking)

### O1. 에러 code 문자열 분기 경로 차이 (cosmetic)
- 백엔드 enum명 `EXTERNAL_QUOTA`(429)/`EXTERNAL_ERROR`(502) vs 프론트 **fallback**(body 없을 때) `apiClient.ts:104-107` `QUOTA_EXCEEDED`/`UPSTREAM_ERROR`.
- 백엔드는 항상 body를 보내므로 실제 노출 code는 백엔드명. fallback은 게이트웨이/프록시발 bodyless 429/502에서만. contest 흐름은 code로 분기하지 않고 `ErrorState`가 message만 표시 → **기능 무영향**. 429/502 구분(서로 다른 메시지)은 보존됨. 향후 code 기반 분기 도입 시에만 문자열 통일 고려.

### O2. 계약상 non-null이나 DB는 nullable인 필수 필드 (external 데이터 품질)
- title/location/photographer/filmMonth/thumbUrl/awardDivision/awardGrade는 계약·DTO상 non-null이나 `ContestWork` 컬럼은 nullable. external sync가 누락 적재하면 프론트는 대부분 graceful(문자열 보간; filmMonth는 `format.ts` 방어 경로). shape 경계 버그 아님 — **external #4/#5 데이터 품질 + #8 후 실데이터 QA에서 재확인**.

---

## 미검증 (범위 외 — 의도된 보류)
- 실데이터 경로(실제 95건 적재·지오코딩 성공 좌표·집중률 매칭 rate). providers 미투입(Optional 비어 있음)이라 현재 /crowd=204, lat/lng=null 경로만 동작 — 둘 다 코드상 graceful 확인. **external #8(sync+geocode+match 1회) 후 별도 QA 패스로 실값 대조 예정.**

---

## 통보 이력
- frontend ← F1 수정 요청(types.ts:13-14, 구체 diff). 발송 완료.
- backend ← F1 확인용(옳은 쪽) + ContestControllerTest null 케이스 추가 권장(선택). 발송 완료.
- team-lead ← 요약 보고.
