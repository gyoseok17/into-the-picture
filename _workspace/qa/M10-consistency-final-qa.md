# M10 일관성 경계 최종 QA

## 범위

- 계약: `_workspace/contracts/M10-consistency-boundaries.md`
- 역할 보고: 백엔드 위치 입력 경계, 프런트 캐시·다이얼로그 공통화 보고
- 코드 교차 검증: 앨범 기록 쓰기 경로, React Query key·무효화, 다이얼로그 전역 키 이벤트

## 검증 결과

### 1. 위치 입력 경계 — 통과

- 단건 업로드 `UserPhotoUploadService`, 기록 수정 `UserPhotoService`, 묶음 업로드 `PhotoRecordBundleService`가 모두 `MapLocationInputResolver.resolve`를 호출한다.
- 세 서비스에는 `MapLocationCatalog` 또는 `mapLocations.resolve` 직접 호출이 남아 있지 않다. `PhotoRecordMapService`의 `MapLocationCatalog` 사용은 지도 조회·좌표 계산 전용이므로 쓰기 입력 검증 중복이 아니다.
- resolver는 blank 정리, 길이 제한, 카탈로그의 정규 코드·지역/시군 소속 검증을 순서대로 맡는다.
- Controller, DTO, API URL, DB 마이그레이션에는 이번 경계 통합에 따른 변경이 없다.

### 2. React Query key·무효화 — 통과

- `frontend/src/features/*/queryKeys.ts` 외 `queryKey: [` 직접 배열 작성은 정적 검색에서 0건이다.
- 비교 생성·삭제·사진 교체는 `invalidateComparisonQueries`와 `invalidatePhotoRecordQueries`를 함께 호출한다. 따라서 앨범의 연결 표시와 공개 비교 목록이 모두 갱신된다.
- 크롭·공개 상태 변경은 비교 조회 및 공개 비교 prefix를 무효화한다. 사진 레코드 자체는 변하지 않으므로 앨범 캐시를 불필요하게 다시 읽지 않는다.

### 3. 다이얼로그 공통 동작 — 통과

- 일반 다이얼로그·시트는 `useEscapeDismiss`, `useDialogFocusRestoration`, `useDocumentScrollLock` 또는 `useBodyOverflowLock`을 사용한다. 중첩 스크롤 잠금은 reference count 방식으로 보완돼 있다.
- 남은 직접 `keydown`은 공통 훅으로 치환하면 의미를 잃는 고유 흐름이다.
  - `PhotoComparisonResultDialog`: 편집 단계별 Esc 역순 복귀와 이벤트 전파 차단.
  - `ContestDetailOverlay`: dialog 내부 Tab 포커스 트랩.
  - `ScrollAssist`, `TopNav`: 모달이 아닌 메뉴/빠른 도구의 닫기.
- 따라서 Esc 단순 닫기 규칙을 다시 복제한 사례는 발견하지 못했다.

## 실행 검증

- `backend\\gradlew.bat test --no-daemon` 통과.
- `frontend npm run build` 통과. 초기 JS 청크 `819.99 kB` Vite 경고는 비차단 성능 후속 항목이다.
- `git diff --check` 통과. 기존 LF/CRLF 경고만 발생했다.

## 판정

**통과.** M10의 중복 제거·일관성 규칙이 실제 쓰기 경로와 소비자 캐시에 적용되어 있으며, API·DTO·DB 계약 회귀는 발견하지 못했다.

## 권고

- 브라우저에서 중첩된 비교 편집 → 사진 선택 → 크롭 → 삭제 확인의 Esc·포커스 복귀만 수동 회귀 확인한다.
- 초기 번들 분할은 별도 성능 작업으로 다룬다.
