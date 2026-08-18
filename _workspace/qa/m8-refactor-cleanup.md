# M8 화면 개편 후 구조 정리 QA

- 검토일: 2026-08-18
- 범위: 수상작 목록 복귀 전략 교체 뒤의 잔존 코드 제거, 모바일 열 수 규칙 공통화, 화면 JSX 가독성 정리

## 교차 확인

- `ContestRoute`는 목록 카드 진입에서 `ContestListPage`를 계속 마운트하고 상세만 자식 라우트로 표시한다. 따라서 목록의 필터 상태, TanStack Query 무한 목록 페이지, 실제 스크롤 위치는 수동 복원 없이 유지된다.
- `ContestListPage`에서 이전 `history.state`/`sessionStorage` 기반 `contestListRestore`, 페이지 재요청, 재시도 스크롤 코드와 카드 `onOpen` 저장 경로가 제거됐다. 검색 결과에서 해당 식별자가 남아 있지 않다.
- 1·2·3열 선택은 `mobileGridClassName` 한 곳의 매핑을 `ContestGrid`, `PhotoAlbumGrid`, 검색 로딩 스켈레톤이 함께 사용한다. 저장 값 훅은 기존 `useMobileGridColumns`를 유지한다.
- 키워드 검색은 URL의 `keyword`를 입력·결과 상태와 동기화하고, 앨범 키워드 선택도 같은 갱신 경로를 쓴다. 무한 스크롤 관찰자는 별도 훅으로 분리됐다.
- 앨범 상세는 기존 문서 스크롤 잠금과 내부 `overscroll-contain`을 유지한다. 상세 수상작 표면과 앨범 모달은 동시에 열리는 경로가 없어 현재는 공통 overlay 추상화를 추가하지 않는 것이 적절하다.

## 검증

- `frontend`: `npm run build` 통과.
- 저장소: `git diff --check` 통과.
- 기존 Vite 500kB 청크 경고만 존재하며 이번 변경의 실패는 아니다.

## 판정

차단 이슈 없음. 실제 브라우저 최종 확인 시에는 긴 수상작 목록에서 상세 열기·브라우저 뒤로가기, 검색 URL 직접 진입, 앨범 모달 내부 스크롤과 닫기, 모바일 1·2·3열 저장값을 확인한다.
