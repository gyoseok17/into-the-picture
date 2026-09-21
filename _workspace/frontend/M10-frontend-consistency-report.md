# M10 프런트 캐시·모달 일관성 정리 보고

## 변경 범위

- `contest`, `crowd`, `favorite`, `home`, `photo-search`에 기능별 `queryKeys.ts`를 추가했다.
- 각 조회 훅과 즐겨찾기 낙관적 갱신의 `cancel/get/set/invalidate`가 해당 기능의 키 모듈만 사용하도록 전환했다.
- 비교 생성 성공 뒤에는 비교 캐시뿐 아니라 앨범 투영도 무효화한다. 비교 연결 여부는 앨범의 트로피·선택 불가 상태에도 반영되기 때문이다.
- `useEscapeDismiss`, `useDialogFocusRestoration`, `useBodyOverflowLock`을 추가했다.
- 앨범/지도/검색 앨범의 단순 Esc 닫기는 `useEscapeDismiss`로 통일했고, 수상작 상세와 공개 비교 창은 포커스 복귀·가벼운 스크롤 잠금을 공통 훅으로 전환했다.
- `useDocumentScrollLock`은 전체 화면 창이 중첩될 때 먼저 닫힌 창이 스크롤 잠금을 풀지 않도록 참조 횟수 방식으로 보완했다.

## 설계 결정과 이유

- 캐시 키는 기능 경계 안에 둔다. 공용 최상위 키 파일 하나로 모으면 도메인 간 의존성이 생기므로, 기능별 `queryKeys.ts`가 확장·무효화 책임을 함께 소유한다.
- 모달 UI를 하나로 합치지 않았다. Esc 이벤트, 포커스 복귀, overflow 잠금처럼 화면 모양과 무관한 동작만 공통화했다.
- `ContestDetailOverlay`의 Tab 포커스 트랩과 `PhotoComparisonResultDialog`의 편집 단계별 Esc 되돌리기는 각각 고유 동작이므로 남겼다. 특히 비교 창은 Esc가 단순 닫기가 아니라 `삭제 확인 → 크롭 → 선택기` 같은 내부 단계 복귀를 수행한다.
- `PhotoAlbumDetail`은 기존 스크롤 잠금만 있던 창이어서 동일한 모달 기대에 맞춰 Esc 닫기를 추가했다. URL·API·디자인 변경은 없다.

## 검증

- `rg 'queryKey\\s*:\\s*\\[' frontend/src --glob '!**/queryKeys.ts'` 결과: 직접 배열 key 0건.
- 기능별 키 모듈 사용처를 대조했다. 즐겨찾기의 낙관적 갱신 전후 키와 무효화 키가 동일하다.
- QA에서 발견한 비교 생성 뒤 앨범 캐시 누락을 보완했다. 생성·삭제·사진 교체는 모두 비교 캐시와 앨범 투영을 함께 무효화한다.
- `frontend npm run build` 통과.
- `git diff --check` 통과. 기존 LF/CRLF 경고만 발생했다.

## 남은 위험·권고

- 브라우저에서 중첩된 상세 → 공개 비교, 사진 추가 → 장소 선택, 비교 결과 → 크롭 편집의 Esc·포커스·스크롤 복귀를 수동 확인해야 한다.
- Vite 초기 청크 819.97KB 경고는 이 작업 범위 밖이며, 라우트 지연 로딩을 별도 작업으로 검토한다.
