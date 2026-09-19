# M9 최종 통합 QA

- 검토일: 2026-09-19
- 범위: 보관함 제거, 수상작 비교 사진 선택 후 업로드 편집 레이아웃
- 담당: 통합 QA

## 계약 교차 검증

- `_workspace/api-shapes/M9-photo-record-without-archive.md`와 대조했다.
- `GET /me/photos`, `GET /me/photos/bundles`는 `archived` 쿼리 없이 일반 앨범 전체를 조회한다.
- `PATCH /me/photos/{photoId}` 요청 DTO와 `UserPhotoDto`·`PhotoRecordBundleDto`에서 `archived`/`archivedAt` 필드가 제거됐고, 프런트 API·타입·React Query 키도 같은 계약으로 변경됐다.
- `PhotoRecordRepository.findAllByUserIdForAlbum` 및 묶음·레거시 조회는 `archived_at` 필터를 사용하지 않는다. 지도와 공개 수상작 비교 조회도 같은 원칙으로 변경되어 과거 보관 행이 목록·지도·공개 비교에서 숨겨지지 않는다.
- 엔티티 및 Flyway의 `archived_at` 열은 남아 있으며, 이번 범위에는 데이터 삭제·마이그레이션이 없다.

## UI 흐름 검토

- 앨범에는 스토리/맵만 남고 보관함 전환, 보관/꺼내기 행동, 보관 전용 쿼리 키와 요청 파라미터가 제거됐다.
- 비교 사진 선택 시작 화면은 새 사진 직접 선택과 앨범에서 고르기를 유지한다.
- 새 파일을 고른 뒤에는 대형 선택 카드가 사라지고, 112px~128px 미리보기와 촬영일 입력이 한 행으로 정렬된다. 파일 재선택은 작은 `다른 사진` 버튼으로 제공된다.
- 모바일은 대화상자 내부 스크롤(`68dvh`)을 유지하고, 데스크톱은 넓은 미리보기와 입력 행을 유지한다. 비교 중인 사진의 선택 불가 처리, EXIF 촬영일 채움·직접 입력, 업로드 후 크롭 생성 흐름은 변경되지 않았다.

## 검증

- `backend`: `./gradlew.bat test` 통과.
- `frontend`: `npm run build` 통과.
- `git diff --check` 통과.
- `frontend/src/features/photo-record` 및 사진 기록·비교 백엔드 도메인에서 `archive`/`archived` 실행 참조를 검색해 0건을 확인했다. DB 마이그레이션의 열·인덱스 참조는 의도적으로 보존했다.

## 판정

- 차단 이슈: 없음.
- 권고 사항: 실제 브라우저에서 새 사진 선택 뒤 `다른 사진` 재선택, EXIF 촬영일 자동 입력/직접 입력, 보관 이력이 있던 계정의 스토리·맵 재노출을 한 번 수동 확인한다.
- 통합 판정: 통과.

## 수상작 위치·길안내 및 비교 페이지 제거 재검증 — 2026-09-19

### 계약·데이터 교차 검증

- `_workspace/contracts/M9-album-empty-state.md`의 수상작 위치·길안내 계약과 승인 위치표를 M9 현재 작업 기준으로 검토했다. 전용 M10 버전 기록은 만들지 않는다.
- `ContestLocationOverrides.MAP_LOCATIONS`와 V16 `VALUES`를 기계적으로 대조했다. 양쪽 모두 95건이며 작품명·권역·세부 지역 코드가 전부 일치한다. ID 42 `산사의 설야`는 승인값 `CAPITAL / INCHEON`이다.
- 95개 코드의 권역·도시 값은 모두 `MapLocationCatalog`에 존재한다. 문자열 주소를 프런트에서 재해석하는 경로는 추가되지 않았다.
- V16은 `contest_work`에 nullable 코드 열만 추가하고 기존 95행의 코드·네 좌표만 갱신한다. 사용자 사진, 앨범, 비교, 즐겨찾기 데이터는 변경하지 않는다.
- ID 34·83 포항 스페이스워크, ID 63 여수 영취산, ID 79 밀양 표충사의 보정 좌표는 정적 sync 표와 V16에서 정확히 일치한다. 새 DB sync도 네 작품에 좌표를 먼저 저장하므로 이후 좌표 보강 배치가 덮어쓰지 않는다.

### 생산자·소비자 및 내비게이션 교차 검증

- 상세 API 생산자 `ContestDetailDto`·`ContestMapper`와 프런트 `ContestDetail` 타입이 모두 `mapRegionCode`, `mapCityCode`를 포함한다. 컨트롤러 JSON 테스트도 두 필드를 확인한다.
- 상세 길안내는 `detail.title`이 아니라 `detail.location`을 `ContestMap.destinationName`으로 넘긴다. 카카오 길안내 URL을 만드는 유일한 호출 경로도 이 값을 사용한다.
- `frontend/src`에서 `/compare`, `ComparePage`, `/compare`로의 이동 참조는 0건이다. 라우터에는 `/me/comparisons` 관리 화면만 남고, 삭제한 `ComparePage.tsx`도 라우트에 없다.
- 문구 `비교 화면에서 결과를 먼저 삭제해 주세요`는 현재 결과 창을 뜻하므로 동작상 잔재는 아니지만, 사용자 혼동을 줄이려면 추후 `비교 결과 창에서`로 다듬는 것을 권고한다.

### 검증 결과

- `backend\\gradlew.bat test` 통과.
- `frontend\\npm run build` 통과. Vite의 기존 500 kB 청크 경고만 발생했고 이번 변경의 실패는 아니다.
- `git diff --check` 통과. 기존 Windows CRLF 경고만 출력됐다.

### 최종 판정

- 차단 이슈: 없음.
- 통합 판정: 통과. M9에 위치 데이터·좌표 보정·길안내 목적지 수정·`/compare` 제거 검증을 포함할 수 있다.
