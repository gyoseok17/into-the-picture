# M9 보관함 스키마 잔재 제거 보고

## 대상 확인

- `photo_record.archived_at`: V5에서 추가된 사진 보관 상태 컬럼
- `photo_record_bundle.archived_at`: V10에서 추가된 묶음 보관 상태 컬럼
- 두 컬럼을 참조하는 인덱스 여섯 개
  - `idx_photo_record_user_active_time`
  - `idx_photo_record_user_active_place`
  - `idx_photo_record_user_archived_created`
  - `idx_photo_record_user_active_map_city`
  - `idx_photo_record_public_contest`
  - `idx_photo_record_bundle_user_active_time`

현재 백엔드 엔티티·서비스·리포지터리·테스트에는 `archived_at` 또는 `archivedAt` 사용처가 없다. 외래 키나 체크 제약 조건도 이 컬럼을 참조하지 않는다.

## 설계 및 변경

- `V17__remove_photo_record_archive_columns.sql`을 추가했다.
- PostgreSQL의 의존성 순서에 맞춰 인덱스를 먼저 삭제하고 두 `archived_at` 컬럼을 삭제한다.
- 현재 조회에 필요한 접근 경로는 보관 상태 없이 다시 만든다.
  - 사용자별 촬영일/생성일, 생성일, 장소, 지도 시·군
  - 공개 수상작 비교
  - 묶음별 촬영일/생성일
- 공개 비교 인덱스의 부분 조건은 `contest_id IS NOT NULL`만 남긴다. 보관함 기능이 사라져 더 이상 제외할 보관 상태가 없기 때문이다.

## 검증

- `rg`로 백엔드 실행·테스트 코드의 `archived_at`/`archivedAt` 사용처가 없는 것을 확인했다.
- `backend\\gradlew.bat test` 통과 (2026-09-19).

## 위험 및 되돌림

- 이 마이그레이션이 적용된 DB에서는 두 컬럼의 과거 값은 복구되지 않는다. 현재 제품에서 보관함 기능과 해당 값을 더 이상 사용하지 않는다는 전제의 정리 작업이다.
- 되돌림이 필요하면 새 Flyway 마이그레이션으로 컬럼과 필요한 인덱스를 다시 추가해야 한다. 이미 삭제된 과거 보관 시각 값 자체는 DB 백업이 있어야 복원할 수 있다.
