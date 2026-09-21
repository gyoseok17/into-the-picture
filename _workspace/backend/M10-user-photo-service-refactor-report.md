# M10 사진 기록 서비스 책임 분리 — 백엔드 보고

## 변경 범위

- `UserPhotoService`를 기존 사진 기록의 소유권 조회, 수정·삭제, DTO 변환, 개인 파일 조회로 축소했다.
- 새 `UserPhotoUploadService`가 단일·묶음 업로드 검증, 저장소 저장, 저장 실패 보상, EXIF·수동·묶음 시작일 촬영일 해석을 맡는다.
- 새 `PhotoRecordMapService`가 일반/묶음 지도 투영, 지오코딩, 대표 기록, 지도 지역 목록을 맡는다.
- Controller와 `PhotoRecordBundleService`는 각 책임 서비스로만 위임하도록 연결했다. Controller HTTP 경로·요청·응답은 바꾸지 않았다.

## 설계 결정

- 정상 삭제는 `UserPhotoService`의 `AfterCommitFileDeletion`을 계속 사용한다. DB 커밋 뒤에만 파일을 삭제해 롤백 뒤 레코드가 남는데 파일만 사라지는 상황을 막는다.
- 묶음 업로드의 중간 실패는 다른 경우다. 바깥 DB 트랜잭션이 롤백되면 after-commit 콜백이 실행되지 않으므로, `UserPhotoUploadService.BundleUpload`가 저장 직후 받은 `storageKey`를 `PhotoRecordBundleService`가 추적하고 즉시 저장소 삭제로 보상한다.
- 보상 경로는 DB record ID 재조회에 의존하지 않는다. 아직 커밋되지 않은 엔티티의 조회·flush 여부와 무관하게 정확한 저장소 키를 사용한다.

## 계약·권한 확인

- `/me/photos`, `/me/photos/map`, `/me/photos/map/locations`, 대표 기록 설정, 파일 조회, `/me/photos/bundles` 및 묶음 지도 API의 경로·DTO·상태 코드는 유지했다.
- 개인 사진과 대표 기록 모두 기존 `findOwnedRecord(userId, recordId)` 소유권 검사를 유지한다.
- EXIF 우선 묶음 촬영일, 단일 사진의 수동 입력 우선, 시작일 최종 보완 규칙은 `UserPhotoUploadService`로 이동했을 뿐 동일하다.

## 검증

- `backend\\gradlew.bat test --no-daemon` 통과 (2026-09-20).
- `git diff --check` 통과.
- 새 테스트:
  - 묶음에서 뒤 사진 업로드가 실패하면 먼저 저장된 storage key를 rollback 보상으로 삭제하는지 확인.
  - rollback 보상 메서드가 normal delete/after-commit이 아닌 저장소 즉시 삭제를 호출하는지 확인.
  - 기존 EXIF·수동·묶음 시작일 촬영일 해석 테스트를 `UserPhotoUploadService`로 이전해 유지.

## 남은 위험

- 저장소 즉시 보상 삭제 자체가 실패하면 원래 업로드 오류에 suppressed exception으로 첨부되며 고아 파일이 남을 수 있다. 이는 기존 after-commit 삭제 실패와 같은 운영 정리 과제이며, 재시도/정리 배치는 이번 범위 밖이다.
