# M9 스토리 빈 상태 프런트 결과

## 앨범 보관함 제거 (2026-09-19)

- 활성 앨범만 남기고 `archive` view 상태, 헤더·전환 버튼·보관/꺼내기 action,
  보관함 목록과 추가 버튼을 제거했다.
- 사진·묶음 조회 API에서 `archived` query parameter를 제거하고, hooks의
  archive 분기 query key·인자와 record/bundle `archivedAt`, update의
  `archived` 필드를 제거했다.
- 사진 선택기의 묶음 조회는 새 hook signature에 맞춰 enabled 인자만
  전달한다. 스토리·지도·빈 상태·사진 추가·비교 흐름은 유지했다.
- `rg`로 photo-record 프런트의 archive/archived 참조 0건을 확인했고,
  `npm run build`를 통과했다. 기존 500kB 청크 경고만 남아 있다.

## 비교 교체 dead code 제거 (2026-09-19)

- 호출처가 없는 comparison API `uploadUserPhoto`, `replaceComparisonPhoto`와
  hook `useUploadUserPhoto`, `useReplaceComparisonPhoto` 및 import를 제거했다.
- 사진 선택기의 업로드 입력 타입은 해당 컴포넌트 로컬 타입으로 옮겼다.
  앨범의 `useUploadPhotoRecord` 기반 비교 생성·업로드는 별도 경로로 유지했다.
- `rg`로 네 API·hook 이름의 src 호출·export 0건을 확인했고,
  `npm run build`도 통과했다. 기존 500kB 청크 경고만 남아 있다.

## 결과 팝업 사진 교체 제거 (2026-09-19)

- `PhotoComparisonResultDialog`의 사진 교체 버튼, 사진 선택·업로드·크롭
  overlay, replace mutation 상태와 관련 import를 모두 제거했다.
- 결과만 삭제·사진도 삭제 선택은 그대로 유지했다. 비교를 새로 만드는
  `AlbumComparisonPicker`와 그 크롭 흐름은 변경하지 않았다.
- `npm run build` 통과. 기존 500kB 청크 경고만 남아 있다.

## 결과 팝업 중첩 모달 경계 보완 (2026-09-19)

- 원인: 사진 선택기·크롭 편집기·삭제 선택 팝업이 결과 팝업의 backdrop
  자식이어서, 내부 click이 결과 팝업의 outside-click close handler까지
  버블될 수 있었다.
- 변경: 중첩 overlay를 같은 `createPortal` 안의 결과 backdrop 형제 레이어로
  분리했다. 선택기·크롭 편집기·삭제 선택의 바깥 클릭은 각 overlay만 닫고,
  slider·확정·삭제 선택 click은 결과 팝업을 유지한다.
- `npm run build` 통과. 기존 500kB 청크 경고만 남아 있다.

## 비교 관리 경로·결과 팝업 이관 (2026-09-19)

- `/compare` 라우트와 `ComparePage`를 제거했다. 직접 접속은 router의 기본
  Not Found로 처리한다. 홈의 내 사진 보기와 기능 인덱스는 각각
  `/me/comparisons`, `/me/album`으로 옮겼다.
- 앨범 비교 picker는 저장 성공 뒤 현재 앨범을 유지하고 picker만 닫는다.
  이미 비교된 수상작 query도 비교 페이지로 이동하지 않고 앨범 query를
  정리한다. 마이의 저장 비교 썸네일은 결과 팝업을 직접 연다.
- `PhotoComparisonResultDialog`에 본인 비교의 사진 교체(기존 사진 선택기,
  크롭 편집기, replace 훅 재사용)와 결과만 삭제·사진도 삭제를 추가했다.
  공개 비교 갤러리는 이 다이얼로그를 사용하지 않으므로 관리 버튼이 노출되지
  않는다.
- `공개 관리` 표기를 `비교 관리`로 바꾸되 공개·비공개 일괄 변경 화면과 API는
  유지했다.
- TopNav의 native details를 controlled dropdown으로 바꾸어 바깥 pointer,
  Escape, 경로 변경, 마이 메뉴 클릭에서 닫힌다.
- `npm run build` 통과. 기존 500kB 청크 경고만 남아 있다.

### 남은 수동 확인 위험

- 결과 팝업 안에서 picker·crop editor·삭제 선택 팝업이 겹칠 때의 포커스와
  실제 삭제/교체 API 성공 흐름은 브라우저 수동 QA가 필요하다.

## 비교 표시 크롭 공통화 (2026-09-19)

- `ComparisonContestCropImage`를 `ComparisonCropImage`와 같은 모듈에
  추가했다. 저장 `ComparisonCrop`의 aspect ratio 프레임 안에서 수상작 원본을
  contain으로 표시하는 공통 책임이다.
- 비교 결과 목록(`ComparisonResultCard`), 결과 상세(`ComparisonPlacementPair`),
  공개 관리(`ComparisonJoinedThumbnailPair`), 수상작 상세의 저장 비교 진입
  썸네일(`ContestComparisonEntry`), 공개 비교 갤러리에 공통 프레임과
  `ComparisonCropImage crop={comparison.crop}`를 적용했다.
- `PHOTO_ONLY`의 단독 원본 사진 표시는 수상작을 숨기는 기존 의도대로
  유지했다. 앨범·지도·일반 사진 목록의 원본 렌더는 비교 컨텍스트가 아니므로
  변경하지 않았다.
- 수상작만 보여 주는 비교 선택용 작은 썸네일은 결과 쌍이 아니므로 원본
  썸네일로 유지했다.
- `npm run build` 통과. 기존 500kB 청크 경고만 남아 있다.

## 저장 크롭 결과 렌더링 보완 (2026-09-19)

- 원인: `ComparisonPlacementPair`가 `comparison.crop`을 사용하지 않고 내
  사진을 기본 4:3 `AspectImage`로 렌더링했다. 편집기 저장값은 API에 남아도
  결과 쌍 화면에서 보이지 않았다.
- 변경: 일반 수상작 비교 쌍에서 수상작 원본은 저장 crop의 aspect ratio
  프레임 안에 contain으로 표시하고, 내 사진은
  `ComparisonCropImage crop={comparison.crop}`로 렌더링한다.
- `PHOTO_ONLY`는 수상작을 의도적으로 숨기고 원본 사진만 보이는 기존
  동작이므로 변경하지 않았다. 공개 비교 갤러리는 이미 같은 crop 프레임과
  `ComparisonCropImage`를 사용하고 있음을 대조했다.
- `npm run build` 통과. 기존 500kB 청크 경고만 남아 있다.

## 크롭 마지막 드래그 저장 회귀 보완 (2026-09-18)

- 원인: pointer 이동은 `setCrop`으로만 상태를 갱신했으므로 마지막 이동 직후
  확정하면 React 렌더 전 클로저의 `editorCrop`이 `onConfirm`으로 전달될 수
  있었다.
- 변경: `cropRef`와 `commitCrop`을 추가해 pointer 이동·확대 slider·초기화에서
  화면 state와 최신 crop ref를 동시에 갱신한다. 확정과 drag 시작은 최신 ref에
  수상작 비율을 적용한 값을 사용한다.
- 결과: 드래그 직후 저장해도 전송 crop이 가장 최근 화면 위치와 일치한다.
  기존 pointer 이동 계산, 터치, 확대, 초기화, crop API 계약은 유지했다.
- 검증: `npm run build` 통과. 기존 500kB 청크 경고만 남아 있다.

## PC 크롭 이미지 드래그 보완 (2026-09-18)

- `ComparisonCropImage`의 실제 `<img>`에 `draggable={false}`와
  `dragstart` 취소를 추가했다. 같은 표시 컴포넌트를 쓰는 읽기 전용 비교
  화면도 브라우저 기본 이미지 끌기를 시작하지 않는다.
- `ComparisonCropEditor`의 수상작 원본 이미지와 포인터 크롭 viewport에도
  동일하게 native drag를 차단했다. 포인터 캡처·이동 계산·zoom·reset·confirm
  및 저장 crop 계약은 수정하지 않았다.
- `touch-none`과 기존 pointer 이벤트는 유지했으므로 모바일 터치 이동은
  영향을 받지 않는다.
- `npm run build` 통과. 기존 500kB 청크 경고만 남아 있다.

## 중앙 스토리 빈 상태 보완 (2026-09-18)

- 활성 스토리의 빈 상태만 별도 `StoryEmptyState`로 분리했다.
- 스토리 배경 유틸리티(`photo-record-story-surface`) 안에서 모바일은 남은
  화면 높이, 데스크톱은 최소 34rem 영역을 차지하고 안내 아이콘·문구·추가
  버튼을 세로·가로 중앙에 배치한다.
- 기존 `PhotoAddSheet`를 여는 동작과 빈 스토리에서 FAB를 숨기는 조건을
  유지했다. 지도와 보관함의 `EmptyState`는 변경하지 않았다.
- `npm run build` 통과. 기존 500kB 청크 경고만 남아 있다.

## QA 피드백 보완 (2026-09-18)

- 활성 스토리의 묶음이 하나 이상일 때만 플로팅 `+` 버튼을 표시하도록
  `!isEmptyActiveStory` 조건을 추가했다.
- 빈 스토리에서는 중앙의 `사진 추가` 버튼만 보이고, 사진 묶음이 생기면
  기존 우측 하단 플로팅 버튼이 다시 보인다.
- `npm run build`를 다시 실행해 통과했다. 기존 500kB 청크 경고만 남아 있다.

- 변경 범위: `PhotoRecordAlbum`의 활성 스토리 조회 완료·빈 목록 분기.
- 구현: `hasNoBundles`, `isEmptyActiveStory` 조건을 분리해 `사진이 없어요.`와 `사진을 추가해 주세요.`를 표시하고, `사진 추가` 버튼은 기존 `PhotoAddSheet`를 연다.
- 유지: 지도·보관함의 빈 상태, 로딩·오류 상태는 바꾸지 않았다.
- 검증: `npm run build` 통과. 기존 500kB 청크 경고만 유지된다.
- 위험: 빈 스토리에서는 중앙 사진 추가 버튼과 기존 우하단 + 버튼이 함께 보인다. 기능상 문제는 없지만 다음 UI 검토에서 중복 행동을 정리할 수 있다.
