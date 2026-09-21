# M10 수상작 비교 앨범 지역 필터 QA

## 생산자·소비자 계약 대조

| 계약 항목 | 생산자 | 소비자 | 판정 |
| --- | --- | --- | --- |
| 수상작 권역·시군 코드 | `ContestDetailDto` / `ContestMapper.toDetail` | `AlbumComparisonPicker`, `PhotoComparisonResultDialog` | 통과 |
| 앨범 묶음·legacy 지역 코드 | `PhotoRecordBundleService.list`의 `PhotoRecordBundleDto`, 내부 `UserPhotoDto` | `ComparisonPhotoPickerDialog` | 통과 |
| 두 코드가 있으면 시군 일치 | 기존 검증된 지도 코드 | `bundleMatchesComparisonTarget` | 통과 |
| 시군 누락 시 권역 일치 | 기존 검증된 지도 코드 | `bundleMatchesComparisonTarget` | 통과 |
| 수상작 권역 누락 시 전체 목록 | nullable detail DTO | `bundleMatchesComparisonTarget` | 통과 |
| 해당 지역 0건 안내와 새 사진 추가 | 필터 결과 빈 배열 | `BundleSelection` | 통과 |

## 경로별 회귀 검토

- 앨범에서 수상작 비교를 새로 만들 때: `AlbumComparisonPicker`가 수상작 상세의 지역 코드를 picker에 전달한다.
- 저장된 비교 결과에서 사진을 교체할 때: `PhotoComparisonResultDialog`도 동일한 지역 코드를 전달한다. 수상작 상세를 읽는 동안은 로딩 오버레이를, 실패하면 재시도/뒤로 가기를 제공하므로 필터 없이 전체 목록이 잠시 노출되지 않는다.
- 직접 새 사진 업로드, 비교 권한, 이미 비교 중인 사진의 선택 불가, 크롭·비교 생성 API는 이 변경 범위 밖이며 호출 방식이 바뀌지 않았다.

## 권한·데이터 안전성

- 앨범 조회는 `/api/v1/me/**` 인증 경로와 `JwtPrincipal.userId()`를 사용한다. 프런트 필터가 다른 사용자의 데이터를 넓히지 않는다.
- 필터는 클라이언트 표시만 바꾸며 DB, API URL, DTO, 비교 생성 요청을 변경하지 않는다.
- legacy 단건 기록도 bundle DTO로 같은 지역 필드를 제공하므로 필터 대상에서 누락되지 않는다.

## 검증 결과

- 백엔드: `backend\\gradlew.bat test --no-daemon --tests "com.intothepicture.domain.contest.controller.ContestControllerTest"` 통과. 수상작 상세 JSON의 `mapRegionCode`, `mapCityCode` 직렬화를 확인했다.
- 프런트: `npm run build` 통과.
- 정적 검증: `git diff --check` 통과. 줄바꿈 변환 경고와 Vite 초기 청크 820.88KB 경고만 있으며, 이번 지역 필터의 차단 이슈는 아니다.

## 통합 판정

통과. 실제 브라우저에서는 아래 세 경우를 한 번씩 확인하면 된다.

1. 수상작과 같은 시군 앨범만 표시되는지
2. 같은 권역이지만 다른 시군 묶음이 제외되는지
3. 0건일 때 안내와 새 사진 추가가 열리는지
