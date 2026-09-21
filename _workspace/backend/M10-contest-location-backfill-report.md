# M10 수상작 표준 지역 코드 복구 보고

## 결론

새 보정 마이그레이션이나 애플리케이션 코드 변경은 만들지 않았다. 로컬 백엔드가 재시작되지 않은 상태라서 V16, V17 Flyway 마이그레이션이 아직 실행되지 않았고, 실행 중이던 구버전 클래스도 `ContestDetailDto`의 지역 코드 필드를 응답에 직렬화하지 않고 있었다.

## 확인한 사실

- 재시작 전 `GET /api/v1/contests/1` 응답에는 `mapRegionCode`, `mapCityCode` 자체가 없었다.
- 현재 소스의 `ContestMapper.toDetail`은 두 필드를 `ContestDetailDto`로 전달한다.
- `ContestLocationOverrides`에는 95개 수상작의 검증된 표준 권역/시군 코드가 있으며, V16은 같은 95개 값을 기존 `contest_work`에 보정한다.
- 백엔드를 재빌드·재시작한 로그에서 Flyway가 V16과 V17을 순서대로 적용했다. V16은 `contest_work.map_region_code`, `contest_work.map_city_code`를 추가하고 95개 수상작을 채운다.
- 재시작 뒤 `GET /api/v1/contests/1`은 `mapRegionCode: "GYEONGSANG"`, `mapCityCode: "HAPCHEON"`을 반환했다.

## 변경 및 데이터 안전성

- 프로덕션 코드와 새 SQL 파일은 변경하지 않았다.
- 실행된 V16은 `contest_work`만 갱신한다. `photo_record`, `photo_record_bundle`, 사용자·비교·파일 데이터에는 접근하지 않는다.
- V16은 Flyway 이력으로 한 번만 실행된다. 되돌림이 필요하면 해당 두 컬럼만 `NULL`로 되돌릴 수 있으나, 현재는 검증된 지역 데이터를 제거할 이유가 없다.

## 실행 및 검증

- 백엔드를 Gradle `bootRun`으로 재빌드·재시작했다.
- Flyway 로그: `Successfully validated 17 migrations` → `Migrating schema ... version 16` → `Migrating schema ... version 17` → `Successfully applied 2 migrations ... version v17`.
- HTTP 확인: `GET http://localhost:8080/api/v1/contests/1`에서 두 지역 코드 반환 확인.
- DB 확인: `contest_work` 집계 결과 `total=95`, `coded=95`, `missing=0`이다. 모든 수상작이 권역·시군 코드를 모두 보유한다.

## 남은 확인

- 비교 화면의 `앨범에서 고르기`를 다시 열어, 같은 시군 기록만 표시되는지와 해당 기록이 없을 때 빈 상태 문구가 나오는지 브라우저에서 확인한다.
