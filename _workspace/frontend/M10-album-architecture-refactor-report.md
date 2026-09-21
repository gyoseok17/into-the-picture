# M10 앨범 화면 구조 정리 - 프런트엔드 보고

## 변경 범위

- `PhotoRecordAlbum.tsx`를 페이지 조율 중심으로 축소했다.
  - 라우트의 `contestId`, 앨범/비교 조회, 스토리·맵 모드, 관리 선택·삭제, 다이얼로그 진입 상태만 둔다.
- 표시·상호작용 단위를 분리했다.
  - `PhotoRecordAlbumChrome.tsx`: 앨범 헤더, 스토리 빈 상태, 오류 알림
  - `PhotoRecordBundleLightbox.tsx`: 스토리 묶음 확대와 사진 전환
  - `PhotoRecordEditorDialog.tsx`: 레거시 단일 사진 수정·삭제
- 기능 단위 캐시 모듈을 추가했다.
  - `photo-record/queryKeys.ts`
  - `comparison/queryKeys.ts`
- `BatchPhotoUploadPanel`에서 HTTP 호출과 React Query 무효화를 제거했다. 업로드 mutation 훅이 성공 후 앨범·비교 캐시를 갱신한다.
- `ComparisonCropImage`의 인증 이미지 Blob 요청도 `comparison/api.ts`로 옮겨 표시 컴포넌트가 `apiClient`를 직접 호출하지 않게 했다.

## 설계 결정과 이유

- API 경로, DTO, URL, 기존 사용 흐름은 바꾸지 않았다. 이번 작업은 책임 이동만 수행한다.
- 앨범 mutation이 만드는 모든 투영(사진 목록·묶음·지도·묶음 지도)은 `invalidatePhotoRecordQueries` 한 곳에서 갱신한다.
- 묶음 업로드 mutation은 캐시 무효화가 끝날 때까지 `mutateAsync` 완료를 지연한다. 따라서 기존처럼 업로드 패널이 새 기록 조회 전에 닫히지 않는다.
- 비교 mutation이 만드는 투영(내 비교·공개 비교)은 `invalidateComparisonQueries` 한 곳에서 갱신한다. 사진 변경·삭제처럼 두 도메인에 영향이 있는 mutation만 두 invalidator를 함께 호출한다.
- `PhotoRecordAlbum`에 남은 선택 일괄 삭제는 페이지 수준 상태·유스케이스 조율이므로 유지했다. 상세 수정 화면의 입력과 확대보기를 그 파일에서 분리했다.

## 유지한 사용자 흐름

- `/me/album`, `/me/album?contestId={contestId}`
- 스토리/맵 전환과 맵 조회의 lazy enabled 조건
- 관리 선택, 비교 중 사진의 409 보존, 선택 삭제 결과 문구
- 사진 추가·수정·묶음 확대·수상작 비교 다이얼로그 진입

## 검증

- `frontend npm run build` 통과
- `git diff --check` 통과
- `photo-record/components`와 `comparison/components`에서 React Query 무효화 직접 호출 0건 확인
- `ComparisonCropImage`의 `apiClient` 직접 호출 제거 확인

## 남은 위험

- Vite 초기 청크는 약 818KB로 기존 경고가 유지된다. 이번 책임 분리와 별개이며, 라우트 단위 dynamic import 작업에서 처리한다.
- `PhotoRecordAlbum`의 일괄 삭제 조율은 현재 페이지 책임으로 적절하지만, 관리 기능이 더 늘면 전용 관리 훅으로 추가 분리해야 한다.

## 추가 분리: 사진 묶음 업로드 (통합 재점검 반영)

- 기존 786줄 `BatchPhotoUploadPanel`은 파일 선택·EXIF 추출·Object URL 정리·업로드·장소·날짜·포털을 함께 가져 책임 경계에 맞지 않았다.
- `hooks/useBatchPhotoUpload.ts`로 파일 준비, URL 정리, 업로드 상태와 mutation 요청을 이동했다.
- `PhotoUploadForm.tsx`는 파일 선택·날짜·공통 기록 입력을 조립하고, `PhotoUploadLocationPicker.tsx`는 장소 표시/선택, `PhotoAddSheet.tsx`는 포털과 Escape/업로드 중 닫기 방어를 담당한다.
- `BatchPhotoUploadPanel.tsx`는 훅과 폼을 연결하는 34줄 조립 컴포넌트만 남겼다.
- 장소 선택 시 지역·시군 코드와 기존처럼 `placeName` 표시값을 함께 갱신한다. 파일 제한, EXIF 날짜 보완, 실패 재시도, 성공 후 패널 닫힘 계약은 유지했다.
- 검증: `frontend npm run build`, `git diff --check` 통과.
- 순수 지역·날짜 표시 계산은 `components/`에서 `lib/photoUploadPresentation.ts`로, 업로드 상수·상태 타입은 `types/photoUpload.ts`로 이동했다. 훅이 화면 컴포넌트 경로를 참조하던 의존성도 제거했다.
