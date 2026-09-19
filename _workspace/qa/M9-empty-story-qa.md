# M9 앨범 스토리 빈 상태 QA

- 판정: 통과.
- 확인: 새 안내·중앙 사진 추가는 활성 앨범·스토리·조회 완료·빈 목록 조건에서만 표시된다.
- 회귀: 지도·보관함의 빈 상태, 로딩·오류 분기와 기존 `PhotoAddSheet` 완료 뒤 목록 갱신 흐름을 유지한다.
- 검증: 프런트 빌드 통과. 기존 청크 크기 경고는 이번 변경과 무관하다.

## 재검토 (2026-09-18)

- `isEmptyActiveStory`가 활성 앨범·스토리·빈 목록을 동시에 만족할 때만 참이다.
- 기존 우하단 floating `+`는 `!isEmptyActiveStory` 조건을 추가해 빈 스토리에서는 렌더하지 않는다. 따라서 빈 스토리는 중앙 `사진 추가` 하나만 제공한다.
- 사진이 하나 이상이면 기존 floating `+`가 그대로 돌아오며, 보관함의 추가 버튼과 지도 모드의 기존 동작은 바뀌지 않는다.
- `npm run build` 성공. 기존 500kB chunk 경고만 발생했다.
- 최종 판정: 통과. 차단 이슈 없음.

## 크롭 저장 최신값 회귀 검토 (2026-09-18)

- 원인: 기존에는 pointer move가 React state 갱신을 예약한 직후 확정 버튼을 누르면, 렌더 클로저의 이전 `editorCrop`이 `onConfirm`으로 전달될 여지가 있었다.
- 보완: `cropRef`와 `commitCrop`이 pointer move·확대·초기화 때 state와 최신값 참조를 동시에 갱신한다. 확정은 `currentEditorCrop()`을 호출하므로 마지막 pointer 이동 직후에도 최신 offset과 현재 수상작 비율을 payload로 만든다.
- 전달 경로 확인: `ComparisonCropEditor.onConfirm` → 앨범 비교 생성/일반 비교 생성의 `create.mutate({ contestId, userPhotoId, crop })` 또는 사진 교체의 `replace.mutate({ id, userPhotoId, crop })` → API POST/PATCH body의 `crop`. 타입·서버 계약은 변경되지 않았다.
- 모바일 pointer 이동·확대·초기화도 같은 `commitCrop` 경로를 사용한다.
- `npm run build` 및 `git diff --check` 성공. 기존 chunk 크기 경고만 발생했다.
- 최종 판정: 통과. 차단 이슈 없음.

## PC 크롭 이미지 드래그 보완 검토 (2026-09-18)

- 크롭 편집 viewport는 기존 `onPointerDown`/`onPointerMove`/`onPointerUp`/`onPointerCancel`과 pointer capture를 유지한다. 이미지 위에서 시작한 포인터 이벤트도 viewport로 버블링되어 기존 offset 이동이 처리된다.
- 비교 원본과 `ComparisonCropImage`의 실제 `<img>` 모두 `draggable={false}`와 `onDragStart` 취소를 적용했다. 브라우저 기본 파일 드래그가 pointer crop을 가로채지 않는다.
- `ComparisonCropImage`는 표시 전용 공통 컴포넌트이므로, 변경 범위는 모든 비교 이미지의 브라우저 기본 드래그 비활성화뿐이다. 확대 range, 초기화, 확정 흐름은 변경하지 않았다.
- 모바일은 기존 pointer event와 `touch-none`을 그대로 사용한다. `onPointerCancel`로 터치 취소도 기존처럼 drag 상태를 해제한다.
- 확정된 `ComparisonCrop`은 기존 create/replace API의 `crop` 인자로 그대로 전달된다. 타입·저장 계약 변경 없음.
- `npm run build` 및 `git diff --check` 성공. 기존 chunk 크기 경고만 발생했다.
- 최종 판정: 통과. 차단 이슈 없음.

## 중앙 배치 보완 재검토 (2026-09-18)

- 활성 스토리 빈 목록은 전용 `StoryEmptyState`로 분기되며, 일반 섹션 `EmptyState` 흐름을 사용하지 않는다.
- 전용 상태는 기존 `photo-record-story-surface` 안에서 `min-h-[calc(100dvh-11rem)]`와 `items-center justify-center`를 사용한다. 아이콘·문구·사진 추가 버튼이 스토리 배경 영역의 세로·가로 중앙에 배치된다.
- 보관함은 기존 공통 `EmptyState`, 지도는 `PhotoRecordMapView`, pending/error는 기존 `LoadingState`/`ErrorState` 조건을 유지한다.
- 사진이 하나 이상이면 `isEmptyActiveStory`가 거짓이므로 기존 우하단 floating `+`가 유지된다. 빈 스토리에서는 중앙 버튼만 표시된다.
- `npm run build` 및 `git diff --check` 성공. 기존 chunk 크기 경고만 발생했다.
- 최종 판정: 통과. 차단 이슈 없음.

## PC 크롭 저장 최종 재검토 (2026-09-19)

- 마지막 `pointermove`는 `commitCrop()`으로 `cropRef.current`와 React state를 함께 갱신한다. 확정 버튼은 렌더 시점의 `editorCrop`이 아닌 `currentEditorCrop()`을 전달하므로, 드래그 직후 저장해도 최신 `offsetX`·`offsetY`가 create 또는 replace 요청의 `crop`에 전달된다.
- 확대 range와 초기화도 같은 `commitCrop()`을 사용하며, `ComparisonCrop`의 `aspectRatio`·`zoom`·offset 계약과 API POST/PATCH 전달 경로는 유지된다.
- viewport의 pointer capture·`touch-none`·pointer cancel 처리는 보존돼 모바일 터치 흐름에 회귀가 없다. 원본·편집 이미지의 브라우저 기본 drag는 모두 차단돼 PC 마우스 드래그와 충돌하지 않는다.
- `npm run build`, `git diff --check` 성공. 기존 500kB 청크 크기 경고만 발생했다.
- 최종 판정: 통과. 차단 이슈 없음.

## 비교 결과 크롭 표시 경로 점검 (2026-09-19 / 구현 전)

- 차단 발견: `ComparisonPlacementPair`는 `comparison.crop`을 소비하지 않고 내 사진을 `AspectImage`로만 렌더한다. 따라서 create/replace API 응답부터 `ComparePage`의 result까지 crop 값은 전달되지만, 개인 비교 결과 보드에서는 저장된 비율·확대·offset이 표시되지 않는다.
- `PHOTO_ONLY`의 원본 단독 표시와 공개 갤러리의 `ComparisonCropImage crop={selectedComparison.crop}` 경로는 현재 의도대로 유지된다.
- 해소 조건: WITH_CONTEST 결과 보드의 내 사진이 `ComparisonCropImage`로 crop을 소비하고, 수상작·내 사진 프레임이 저장된 crop의 aspect ratio로 동일하게 구성되어야 한다. 구현 반영 뒤 다시 검토한다.

## 비교 결과 크롭 표시 최종 검토 (2026-09-19)

- `ComparisonPlacementPair`의 WITH_CONTEST 경로는 수상작 프레임을 `comparisonCropOrDefault(comparison.crop).aspectRatio`로 고정하고, 내 사진을 `ComparisonCropImage crop={comparison.crop}`으로 렌더한다. 따라서 서버 응답의 crop이 `useComparisons` → `ComparePage` result → Pair까지 전달되어 저장된 비율·확대·offset으로 표시된다.
- `PHOTO_ONLY`는 이전처럼 원본 사진 하나만 `AspectImage`로 보여 주며 crop 보드를 만들지 않는다. 공개 갤러리는 기존 `ComparisonCropImage` 소비 경로를 유지하므로 영향이 없다.
- `npm run build`, `git diff --check` 성공. 기존 500kB 청크 크기 경고만 발생했다.
- 최종 판정: 통과. 차단 이슈 해소.

## 비교 사진 표시 기준 전수 검토 (2026-09-19)

- 수상작 비교 컨텍스트는 공통 `ComparisonCropImage`·`ComparisonContestCropImage`를 사용한다. 비교 결과 목록(`ComparePage`), 결과 상세·수상작 상세 결과 대화상자(`ComparisonPlacementPair`), 공개 관리 썸네일(`ComparisonJoinedThumbnailPair`), 수상작 상세 진입 표시(`ContestComparisonEntry`), 공개 비교 갤러리의 보드·썸네일까지 저장된 `comparison.crop`을 소비한다.
- `PHOTO_ONLY`는 비교 보드를 만들지 않고 기존 원본 단독 `AspectImage`를 유지한다. 앨범 스토리·지도·묶음 카드 등은 비교 결과가 아닌 개인 사진 기록이므로 원본 `AspectImage` 표시를 유지하며 crop이 침범하지 않는다.
- 수상작 원본도 `ComparisonContestCropImage`로 같은 저장 프레임 비율을 사용해 좌우 비교판의 크기가 일치한다. 공통 컴포넌트로 중복된 aspect-ratio 계산을 제거했다.
- `npm run build`, `git diff --check` 성공. 기존 500kB 청크 크기 경고만 발생했다.
- 최종 판정: 통과. 차단 이슈 없음.

## 비교 화면 통합 전환 검증 (2026-09-19)

- 경로·이동: `/compare` 라우트와 `ComparePage`를 제거했고 소스 내 `/compare` 참조가 없다. 따라서 직접 URL은 router의 `*` Not Found로 처리된다. 홈의 두 진입점은 앨범(`/me/album`)과 비교 관리(`/me/comparisons`)로 각각 연결된다.
- 앨범 흐름: 비교 저장 성공과 이미 비교한 수상작 재진입은 모두 검색 파라미터만 제거해 현재 앨범 맥락을 유지한다. 비교 사진 선택기는 기존 비교에 연결된 사진을 선택 불가로 유지한다.
- 결과·권한: 저장 결과 팝업에 사진 교체(사진 선택→크롭), 결과만 삭제, 사진까지 삭제를 이관했다. 이 팝업은 로그인한 사용자의 `useComparisons` 결과에서만 열리고, 공개 비교 갤러리에는 관리 동작이 없다.
- 중첩 오버레이: 사진 선택기·크롭 편집기·삭제 선택창을 결과 backdrop의 자식이 아닌 같은 portal의 형제 레이어로 분리했다. 내부 클릭은 결과 팝업 닫힘으로 전파되지 않으며, 각 overlay 바깥 클릭은 자신만 닫는다.
- 관리·계정: `/me/comparisons`와 마이 카드의 명칭은 `비교 관리`이고 공개/비공개를 즉시 전환한다. 상단 계정 메뉴는 제어형으로 바뀌어 바깥 클릭·Esc·경로 변경·마이 메뉴 클릭 때 닫힌다.
- 검증: `npm run build`, `git diff --check` 성공. 기존 500kB 청크 크기 경고만 발생했다.
- 최종 판정: 통과. 앞서 발견한 중첩 overlay 클릭 전파 차단 이슈 해소.

## 결과 팝업 사진 교체 제거 재검토 (2026-09-19)

- `PhotoComparisonResultDialog`에서 사진 교체 버튼·선택 상태·크롭 편집기·사진 선택기와 교체/업로드 훅을 제거했다. 결과 팝업에는 결과만 삭제·사진도 삭제 선택만 남는다.
- 프런트의 `uploadUserPhoto`·`replaceComparisonPhoto` API 함수와 `useUploadUserPhoto`·`useReplaceComparisonPhoto` 훅도 함께 제거되어, 교체 기능의 dead import·dead code가 남지 않는다.
- 앨범의 `AlbumComparisonPicker`는 별도 생성 흐름으로 유지된다. 사진 선택(사용 중 사진 차단) → `ComparisonCropEditor` → `useCreateComparison`의 crop 저장 경로를 계속 사용한다.
- 삭제 확인 overlay는 결과 backdrop과 sibling layer로 유지되어 바깥 클릭은 삭제 확인만 닫고, 결과 팝업은 닫지 않는다.
- `npm run build`, `git diff --check` 성공. 기존 500kB 청크 크기 경고만 발생했다.
- 최종 판정: 통과. 차단 이슈 없음.
