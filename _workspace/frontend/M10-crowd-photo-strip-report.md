# M10 혼잡도 사진 가로 목록 프런트엔드 결과

## 변경 범위

- `features/crowd/pages/CrowdPage.tsx`
  - 관련 수상작과 키워드 검색 결과를 작은 가로 카드 목록으로 표시한다.
  - 가로 공간이 부족하면 가로 스크롤되며, 스크롤바는 숨긴다.
- `features/photo-search/components/PhotoAlbums.tsx`
  - 기존 앨범 선택·상세 보기 동작을 보존한 `strip` 레이아웃 옵션을 추가했다.

## 설계

- 공통 앨범 컴포넌트에 레이아웃 옵션을 추가해 상세 보기 다이얼로그 동작을 복제하지 않았다.
- 혼잡도 화면만 `strip`을 사용하며 기존 검색 화면의 그리드 표시에는 영향이 없다.

## 검증

- `frontend/npm run build` 통과.
- Vite 초기 청크 크기 경고(약 822KB)는 기존 경고이며 이번 변경과 무관하다.
