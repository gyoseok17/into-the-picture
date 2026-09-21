# M10 상세·지도·전역 오류 경계 프런트 보고

## 변경 범위

- 수상작 상세 진입 조율을 `ContestDetailPage`에 남기고, 목록에서 열린 상세의 포커스·스크롤 잠금은 `ContestDetailOverlay`, 공개 비교 모달은 `PublicComparisonDialog`로 분리했다.
- 라우터 최상위에 `RouteErrorPage`를 연결했다. 이는 화면 렌더링 예외 전용이며, 개별 API 요청 실패의 `ErrorState`를 대체하지 않는다.

## 설계 결정

- 재시도는 `navigate(0)`으로 현재 라우트를 다시 렌더링하고, 홈 이동은 `/`으로 보낸다.
- 수상작 상세의 URL, 목록 복귀, 즐겨찾기·비교·혼잡도 동작과 API 계약은 변경하지 않았다.
- 지도 마커 묶음·기존 좌표 보정·권역 판정은 `lib/photoRecordMapPresentation.ts`로 옮겼다. 지도 화면은 표시/상태, helper는 React 없는 순수 계산으로 경계를 고정한다. focus·방문 기록·lightbox는 상호 상태를 직접 공유하는 하나의 흐름이라 이번 단계에서는 한 컴포넌트로 유지했다.

## 검증

- `frontend npm run build` 통과
- `git diff --check` 통과
- 초기 청크 820KB 경고는 기존 후속 과제로 유지된다.

## 남은 위험

- 라우트 렌더 예외를 실제 브라우저에서 강제로 발생시켜 재시도·홈 이동을 수동 확인해야 한다.
- 지도 focus 흐름이 더 커질 때에는 visit history와 lightbox를 별도 다이얼로그 컴포넌트로 이관한다.

## 지도 분리 복구 (2026-09-20)

- 중간에 생긴 `PhotoRecordMapView` 내부 구현과 새 파일 간의 중복을 제거했다. 지도 조율부는 193줄이며 stage 크기·권역 선택·마커 선택·focus 선택만 맡는다.
- `MapFocus`, `MapPhotoLightbox`, `MapVisitHistory`, `MapRegionPicker`는 각각 독립 컴포넌트 파일로 완성했다. 기존의 대표 기록 설정, 사진 전환, 비교 트로피, 방문 이력, 확대 보기, Esc 닫기 동작을 그대로 보존했다.
- marker 묶음과 stage 크기 계산은 React 없는 `lib/photoRecordMapPresentation.ts`, 공유 타입은 `types/photoRecordMap.ts`로 이동했다.
- 검증: `frontend npm run build`, `git diff --check` 통과. 초기 청크 820KB 경고는 기존 후속 과제로 유지된다.
