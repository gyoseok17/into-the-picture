# M10 수상작 표준 지도 지역 코드 보정 QA

## 결론

현재 `localhost:8080`에서 실행 중인 백엔드는 구버전이다. `GET /api/v1/contests/1`의 실제 응답에는 현재 계약에 존재하는 `mapRegionCode`, `mapCityCode` 필드가 아예 없다. 따라서 앨범 선택 필터가 동작하지 않는 직접 원인은 프런트 캐시나 프런트 재시작이 아니라, 최신 백엔드가 실행되지 않은 것이다.

로컬 Gradle 실행이라면 백엔드를 종료한 뒤 최신 소스로 `backend\\gradlew.bat bootRun`을 다시 실행해야 한다. Docker 실행이라면 단순 컨테이너 재시작이 아니라 최신 이미지를 빌드하거나 pull한 뒤 컨테이너를 교체해야 한다.

## 생산자·소비자 계약 대조

- 생산자: `ContestMapper.toDetail`은 `ContestWork.mapRegionCode`, `mapCityCode`를 `ContestDetailDto`에 그대로 넣는다.
- HTTP 계약: `ContestDetailDto`와 `ContestControllerTest.getContest_returnsDetailShape`는 두 필드의 JSON 직렬화를 명시한다.
- 소비자: 비교 사진 선택 계약은 수상작 상세의 지역 코드와 앨범 기록의 지역 코드를 같은 체계로 비교한다. 수상작 상세가 구버전 응답이면 필터는 의도적으로 전체 앨범 fallback이 되어 지역 필터가 적용되지 않는다.

## V16 마이그레이션 검증

- `V16__add_contest_standard_map_locations.sql`은 `contest_work`에만 `map_region_code`, `map_city_code` nullable 컬럼을 추가한다.
- 이어지는 `UPDATE contest_work ... FROM (VALUES ...)`의 title 매핑은 95건이다. 이 값은 지도 `MapLocationCatalog`와 같은 권역·시군 코드 체계를 사용한다.
- 마지막 좌표 보정 `UPDATE` 역시 `contest_work`의 `lat`, `lng` 4건만 대상으로 한다.
- `photo_record`, `photo_record_bundle`, `photo_comparison`, 사용자 테이블 또는 파일 저장소를 참조하거나 변경하는 SQL은 없다. 즉 V16 적용은 기존 사용자 사진·비교·앨범 데이터에 영향을 주지 않는다.
- title 완전 일치 방식이므로 원본 95개 데이터의 제목이 예상과 다르게 변경돼 있으면 해당 행만 보정되지 않는다. 적용 후 누락 건수를 반드시 확인한다.

## Flyway 적용 확인 절차

1. 최신 백엔드로 기동한다. `application.yml`은 `spring.flyway.enabled=true`, `ddl-auto=none`이므로 기동 시 Flyway가 V16을 적용한다.
2. 기동 로그에서 `V16__add_contest_standard_map_locations.sql` 적용 성공을 확인한다. 이미 적용된 DB라면 Flyway history에서 V16 성공 상태를 확인한다.
3. DB에서 아래를 확인한다.

```sql
SELECT COUNT(*) AS total,
       COUNT(*) FILTER (WHERE map_region_code IS NOT NULL) AS region_filled,
       COUNT(*) FILTER (WHERE map_city_code IS NOT NULL) AS city_filled
FROM contest_work;

SELECT id, title
FROM contest_work
WHERE map_region_code IS NULL OR map_city_code IS NULL
ORDER BY id;
```

기대값은 수상작 95건 전부 `region_filled = 95`, `city_filled = 95`, 누락 목록 0건이다.

4. API 샘플로 `GET /api/v1/contests/1`을 다시 호출해 `mapRegionCode: "GYEONGSANG"`, `mapCityCode: "HAPCHEON"`가 포함되는지 확인한다. 다른 권역·제주 작품도 각각 하나 이상 확인한다.
5. 비교 화면에서 해당 수상작의 `앨범에서 고르기`를 열어 같은 시군 기록만 보이고, 없으면 빈 상태 안내가 나오는지 수동 확인한다.

## 실행 검증

- `backend\\gradlew.bat test --no-daemon --tests "com.intothepicture.domain.contest.controller.ContestControllerTest"` 통과.
- 현재 구동 중인 `GET http://localhost:8080/api/v1/contests/1`은 두 지역 코드 필드가 없는 구버전 응답임을 확인했다.

## 판정

코드·마이그레이션 설계상 사용자 데이터 영향은 없고, V16 적용 후 지역 필터 계약을 충족한다. 다만 실제 DB의 95건 보정 여부는 최신 백엔드 재기동 뒤 Flyway 로그·위 SQL·API 샘플로 확인하기 전까지 최종 통과로 판정할 수 없다.
