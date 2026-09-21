# M10 앨범 화면 구조 정리 QA 계획

## 사전 검토 (2026-09-20)

### 계약 유지 확인 대상

- 라우트: `/me/album`, `/me/album?contestId={contestId}`
- 조회: 앨범 묶음, 지도 묶음, 비교 목록
- 동작: 스토리/맵 전환, 사진 추가, 관리 선택·삭제, 묶음 확대, 수상작 비교 진입
- 캐시 논리 키: `photo-records`, `photo-record-bundles`, `photo-record-map`, `photo-record-bundle-map`, `comparisons`

### 리팩터링 전 회귀 위험

1. `PhotoRecordAlbum`이 현재 라우트 검색값, 조회 훅, 관리 선택·삭제, 스토리 확대, 사진 추가·수정, 비교 선택기를 한 파일에서 조율한다. 분리 중 상태 소유자가 바뀌면 다이얼로그 닫기나 `contestId` 제거가 누락될 수 있다.
2. 사진 추가와 삭제는 사진 기록 네 가지 캐시 키와 비교 키를 함께 갱신한다. 키를 모듈화하는 과정에서 한 키라도 빠지면 스토리/지도/비교 표시에 오래된 데이터가 남을 수 있다.
3. 지도는 `layout === 'map'`에서만 조회한다. 분리 뒤 활성화 조건이 달라지면 불필요한 호출 또는 지도 전환 시 빈 화면이 생길 수 있다.
4. 비교가 이미 있는 `contestId`는 즉시 검색값을 제거한다. 이 중복 방지 규칙이 유지되지 않으면 비교 선택기가 다시 열리거나 URL이 남는다.
5. 관리 모드의 부분 삭제는 성공·충돌·실패를 구분해 선택 상태와 메시지를 처리한다. 표시 컴포넌트로 옮기며 mutation·오류 처리 책임이 섞이지 않는지 확인한다.

### 정적 구조 기준

- `components/`는 `apiClient` 및 `queryClient.invalidateQueries`를 직접 호출하지 않는다.
- React Query 키와 무효화 목록은 사진 기록 기능의 한 모듈에서 관리한다.
- 세부 UI는 콜백으로 동작을 전달하고, 페이지/조율 훅이 URL·다이얼로그·mutation 상태를 소유한다.
- API 경로·응답 타입·DB 변경은 이번 범위 밖이다.

### 최종 검증 방법

- `npm run build`, `git diff --check`
- `rg`로 앨범 세부 컴포넌트의 `apiClient`·직접 `invalidateQueries` 잔재 확인
- 라우트, 훅, query-key, 비교 picker 전달값을 코드로 교차 대조
- 가능하면 로그인 브라우저에서 위 사용자 흐름 수동 확인

## 최종 검증 결과 (2026-09-20)

### 계약·흐름 대조

- `/me/album`과 `/me/album?contestId={contestId}`는 `PhotoRecordAlbum`의 라우트 검색값 처리로 유지된다.
- `contestId`에 이미 비교가 있으면 검색값을 제거해 비교 선택기를 다시 열지 않는 기존 중복 방지 흐름이 유지된다.
- 스토리/맵 전환은 동일하고, 지도 조회는 계속 `layout === 'map'`에서만 활성화된다.
- 사진 추가는 `PhotoAddSheet`, 레거시 사진 수정·삭제는 `PhotoRecordEditorDialog`, 묶음 확대는 `PhotoRecordBundleLightbox`, 수상작 비교는 `AlbumComparisonPicker`로 진입한다.
- 관리 선택·일괄 삭제는 페이지 조율 책임으로 남아 있으며, 성공·비교 연결 충돌·기타 실패를 구분한 기존 메시지와 선택 상태 정리가 유지된다.

### 구조·캐시 경계 대조

- `PhotoRecordAlbum`은 라우트·조회·선택 삭제·다이얼로그 진입 조율을 맡고, 헤더/빈 상태/알림·묶음 확대·단일 사진 편집은 각각 별도 컴포넌트로 분리됐다.
- 사진 기록 query key와 무효화 범위는 `photo-record/queryKeys.ts`, 비교 key와 무효화 범위는 `comparison/queryKeys.ts` 한 곳에 있다.
- `BatchPhotoUploadPanel`은 업로드 mutation 훅만 사용하며 직접 `queryClient` 또는 `invalidateQueries`를 호출하지 않는다.
- `photo-record/components`, `comparison/components`를 검색한 결과 `apiClient`, `useQueryClient`, `invalidateQueries` 직접 사용은 0건이다.
- 앨범 세부 컴포넌트 안의 API 경로 문자열도 0건이다.
- 새 JSX·핸들러의 과도한 한 줄 압축을 발견해 수정 요청했고, 포맷 적용 후 재대조했다.

### 실행 검증

- `frontend npm run build` 통과.
- `git diff --check` 통과. 출력된 LF→CRLF 안내는 기존 작업 트리 줄바꿈 경고이며 공백 오류가 아니다.
- Vite 초기 청크 경고는 유지된다: `index` 약 818KB. 이번 구조 정리의 기능 차단 이슈는 아니며, 라우트 단위 코드 분할 후속 과제다.

### 수동 확인 권고

로그인 브라우저에서 다음만 한 번씩 확인하면 된다.

1. 스토리↔맵 전환 후 지도 자료가 정상 표시되는지
2. 스토리와 지도에서 사진 추가 후 목록·지도 마커가 즉시 갱신되는지
3. 관리 선택에서 비교 중 사진과 일반 사진을 함께 삭제했을 때 각각 유지/삭제 결과가 맞는지
4. 묶음 확대, 여러 사진 썸네일·좌우 전환, 수상작 비교 진입과 기존 비교 중복 방지가 맞는지

### 판정

- 차단 이슈 없음. 계약·구조 경계·빌드 기준 통과.

## 후속 검증 — 사진 추가 패널 재분리 (2026-09-20)

### 책임 경계

- `BatchPhotoUploadPanel`은 `useBatchPhotoUpload` 결과를 `PhotoUploadForm`에 전달하는 34줄 조립 컴포넌트다.
- `useBatchPhotoUpload`은 파일 선택·3장/10MB 검증·EXIF 날짜 추출·Object URL 정리·업로드 상태와 재시도를 맡는다.
- `PhotoUploadForm`은 파일, 날짜, 메모 입력 조립만 맡고, `PhotoUploadLocationPicker`는 장소 선택 표시·오버레이만 맡는다.
- `PhotoAddSheet`는 포털, 스크롤 잠금, 업로드 중 닫기/Esc 차단만 맡는다.
- 순수 표시 변환은 `lib/photoUploadPresentation.ts`, 업로드 상태 타입·상수는 `types/photoUpload.ts`로 이동했다. 이전 `components/photoUploadPresentation|Types` 경로 참조는 0건이다.

### 사용자 흐름 대조

- 파일 수: 선택 파일은 최대 3장으로 제한하고 초과분을 안내한다. 서버의 1~3장 계약과 일치한다.
- 파일 크기: 10MB 초과 파일은 선택 단계에서 제외하고 안내한다. 서버 제한과 일치한다.
- 촬영일: 파일별 EXIF를 먼저 사용하며, 찾지 못한 파일은 수동 촬영일 또는 공통 시작일을 필수로 요구한다. 수동 날짜 배열은 직접 입력이 하나라도 있을 때만 순서를 지켜 전송한다.
- 장소: 권역·시군이 선택되어야 저장이 가능하며, 선택 변경 시 `mapRegionCode`, `mapCityCode`, 표시용 `placeName`을 함께 갱신한다.
- 실패: 실패한 항목은 `failed` 상태로 남고 다시 저장 행동의 대상이 된다.
- 성공: `useUploadPhotoRecordBundle`의 캐시 무효화가 완료된 뒤 `mutateAsync`가 성공으로 끝나고, 그 다음 `onComplete()`가 시트를 자동으로 닫는다.

### 경계·실행 검증

- 사진 추가 컴포넌트와 `useBatchPhotoUpload`에서 `apiClient`, `axios`, `useQueryClient`, `invalidateQueries` 직접 사용 0건.
- `frontend npm run build` 통과.
- `git diff --check` 통과. LF→CRLF 안내만 있으며 공백 오류는 없다.
- Vite 초기 청크 약 819KB 경고는 기존 후속 과제로 유지된다.

### 판정

- 최초 발견한 순수 모듈 위치 위반은 `lib/`·`types/` 이동으로 해소됐다.
- 차단 이슈 없음. 사진 추가 분리의 계약·회귀·모듈 경계 기준 통과.
