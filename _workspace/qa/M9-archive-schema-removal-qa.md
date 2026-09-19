# M9 `archived_at` 스키마 제거 QA

- 검토일: 2026-09-19
- 범위: 보관함 기능 제거 뒤 남은 `photo_record.archived_at`, `photo_record_bundle.archived_at` 및 종속 인덱스

## 교차 검토

- 실행 코드·테스트·프런트 소스에서 `archived_at`, `archivedAt`, `archive` 런타임 참조가 없다. 과거 마이그레이션과 기록 문서의 이력 참조만 남아 있다.
- JPA 엔티티 `PhotoRecord`, `PhotoRecordBundle`에도 해당 열 매핑이 없다. 따라서 열 삭제 뒤 Hibernate-스키마 불일치가 생기지 않는다.
- `V17__remove_photo_record_archive_columns.sql`은 두 열을 참조하는 인덱스 6개를 먼저 삭제한 뒤 열을 삭제한다. PostgreSQL의 종속성 순서에 맞는다.
- 삭제되는 인덱스는 V5~V14에서 만든 `archived_at` 포함 인덱스 전부다. `idx_photo_record_user_contest`, 묶음-사진 FK/인덱스, 비교·지도 관련 열 자체는 유지된다.
- V17은 보관 상태만 제외한 조회 경로를 새 인덱스 6개로 다시 만든다. 특히 공개 비교 인덱스의 조건은 `contest_id IS NOT NULL`로 유지되어, 예전에 보관된 행도 이제 공개 비교 정책에 따라 조회될 수 있다.

## 데이터·Flyway 안전성

- V1부터 새 DB에 적용해도 V5/V10/V14가 먼저 열과 인덱스를 만들고 V17이 마지막에 제거하므로 순서상 문제 없다.
- 이미 운영 중인 DB에서는 V17이 forward-only로 적용된다. 기존 `archived_at` 값은 영구 삭제되므로 이전 보관 여부를 되돌릴 수 없다. 현재 제품이 보관함 기능과 해당 값을 모두 폐기한다는 사용자 승인 범위와 일치한다.
- 되돌림이 필요하면 새 Flyway 마이그레이션으로 열·인덱스를 다시 만들 수는 있으나, 삭제된 과거 값 복구에는 사전 DB 백업이 필요하다.

## 검증

- `backend\\gradlew.bat test` 통과.
- `git diff --check` 통과.
- SQL 정적 검토 통과. 이 테스트 묶음은 별도 PostgreSQL/Testcontainers 통합 DB를 띄우지 않으므로, 실제 배포 전 DB 백업 후 Flyway V17 적용 로그를 확인하는 것을 권고한다.

## 판정

- 차단 이슈 없음. V17 적용 가능.
- 기록 문서와 `_workspace` 계약에 남아 있는 “DB 열·값을 보존한다”는 과거 M9 결정은 이번 구현 변경에 맞게 정정·누적 기록되어야 한다.
