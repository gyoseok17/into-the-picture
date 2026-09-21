# M10 수상작 비교 앨범 지역 필터 백엔드 검토

## 결론

백엔드 변경은 필요 없다. 수상작 상세와 로그인 사용자 앨범 조회가 이미 동일한 지도 카탈로그의 `mapRegionCode`·`mapCityCode`를 반환하므로, 프런트가 응답을 비교해 필터링할 수 있다.

## 확인한 생산자

- `ContestMapper.toDetail`은 `ContestWork`의 `mapRegionCode`, `mapCityCode`를 `ContestDetailDto`로 그대로 전달한다.
- `ContestControllerTest.getContest_returnsDetailShape`는 두 필드가 JSON 응답에 포함되는 것을 검증한다.
- `PhotoRecordBundleService.list`는 bundle DTO와 legacy 단건 DTO 모두에 지역 코드를 포함한다.
- bundle 내부 `UserPhotoDto`도 사진별 지역 코드를 포함한다.
- 지역 입력은 `MapLocationInputResolver`와 `MapLocationCatalog`에서 정규화·소속 검증되므로, 프런트 비교 대상은 같은 코드 체계다.

## 보안·회귀 검토

- 앨범 API는 `/api/v1/me/**` 인증 규칙과 `JwtPrincipal.userId()`를 사용해 다른 사용자의 기록을 조회할 수 없다.
- 필터는 클라이언트 표시 범위만 바꾸며 비교 생성, 사진 업로드, 기존 비교 권한, DTO/URL/DB에는 영향을 주지 않는다.
- 지역 코드가 누락된 과거 데이터는 기존 전체 앨범 표시로 돌아가는 프런트 계약을 사용한다. 데이터 이관이나 마이그레이션은 필요 없다.

## 검증

- DTO·mapper·bundle/legacy 매핑·보안 경로를 정적 대조했다.
- 기존 수상작 상세 controller 테스트가 지역 코드 JSON 직렬화를 검증한다.
- API 변경이 없어 백엔드 테스트 추가는 불필요하다.
