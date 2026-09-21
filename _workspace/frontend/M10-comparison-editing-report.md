# M10 프런트엔드 결과 — 비교 결과 수정

## 변경 범위

- `PhotoComparisonResultDialog`
  - 기존 `삭제` 진입을 `수정`으로 변경했다.
  - 수정 메뉴에서 사진 변경, 크롭 변경, 결과만 삭제, 사진도 삭제를 제공한다.
  - 사진 변경은 앨범 묶음 선택 또는 새 사진 업로드 후 기존 크롭 편집기를 거쳐 `PATCH /me/comparisons/{id}`를 호출한다.
  - 크롭 변경은 현재 사진과 수상작 원본 비율을 다시 불러온 뒤 기존 크롭 편집기를 거쳐 `PATCH /me/comparisons/{id}/crop`를 호출한다.
  - 수정 성공 시 비교/공개 비교/앨범 관련 캐시를 무효화하고 결과 팝업을 닫는다. 실패하면 팝업을 유지하고 오류 문구를 표시한다.
- `ComparisonPhotoPickerDialog`, `ComparisonCropEditor`
  - 중첩 수정 흐름에서도 최상위로 보이도록 오버레이 z-index 주입 지점을 추가했다.
- `useContestDetail`
  - 편집 중에만 수상작 원본을 가져올 수 있도록 선택적 `enabled` 인자를 추가했다. 새 비교 생성 등 기존 호출은 기본값으로 유지된다.
- 미사용 정리
  - 소비처가 없던 `useUserPhotos`, `useDeleteUserPhoto`, `fetchUserPhotos`, `deleteUserPhoto`를 제거했다.
  - 대응하던 `['user-photos']` 캐시 무효화를 전부 제거했다.
  - 호출처가 없던 `BatchPhotoUploadPanel.showLocationField` 옵션과 조건부 장소 입력을 제거했다. 장소 선택은 기존 공통 위치 선택 패널만 사용한다.

## 계약 및 안전성

- 사진 변경 선택기에서는 현재 비교에 연결된 사진을 포함해 이미 다른 비교에 연결된 사진을 선택 불가 상태로 표시한다.
- 수상작 원본을 가져오지 못하면 크롭 편집기를 열지 않고 재시도/뒤로 가기 상태를 표시한다.
- 결과만 삭제는 앨범 사진을 유지하고, 사진도 삭제는 서버의 기존 `deletePhoto=true` 계약을 그대로 호출한다.

## 검증

- `frontend`: `npm run build` 통과.
- `rg`로 `useUserPhotos`, `useDeleteUserPhoto`, 대응 API 함수, `['user-photos']`, `showLocationField` 사용처가 남지 않음을 확인.
- `git diff --check` 통과.
- Vite 청크 크기 경고는 기존 후속 최적화 항목이며 이번 변경의 차단 이슈는 아니다.

## 남은 확인

- 브라우저에서 결과 팝업 → 수정 → 사진 변경/크롭 변경/두 삭제 경로를 실제 로그인 계정으로 각각 확인해야 한다.
- 결과 수정 후 팝업을 닫는 방식으로 최신 캐시 값을 다시 보이게 한다. 저장 즉시 팝업 안에서 새 결과를 유지해 표시하는 UX는 이번 범위에 포함하지 않았다.
