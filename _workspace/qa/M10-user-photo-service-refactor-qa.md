# M10 사진 기록 서비스 책임 분리 QA·보안 검토

## 판정

- 통합 판정: 통과
- 검증 시점: 2026-09-20
- 범위: 서비스 내부 책임 이동. HTTP API 경로·요청·응답·DB 스키마는 변경하지 않음.

## 계약·소유권 교차 검증

| 경로 또는 소비자 | 확인 결과 |
| --- | --- |
| `GET/PATCH/DELETE /me/photos/{photoId}` 및 파일 조회 | Controller가 인증 주체의 `userId`를 전달하고, `UserPhotoService.findOwnedRecord`가 `findByIdAndUserId`로 소유권을 강제한다. |
| `POST /me/photos` | Controller가 `UserPhotoUploadService`에 인증 주체·기존 multipart 값을 그대로 전달한다. |
| `GET /me/photos/map`, 지도 지역 목록, 대표 지정 | `PhotoRecordMapService`로 이동했으며, 대표 지정은 먼저 소유 기록을 조회한다. 기존 지오코딩 한도(20), 24시간 재시도, 도시 좌표 fallback 규칙은 유지된다. |
| `POST/GET/DELETE /me/photos/bundles`, `GET /map` | Bundle Controller 경로·응답은 유지된다. 지도는 Map Service 위임, 목록은 batch child query를 유지한다. |
| `PhotoComparisonService` | 비교 생성·교체·삭제·표시 DTO가 계속 `UserPhotoService.findOwnedRecord`/`dto`를 통해 같은 소유권 규칙을 사용한다. |

## 데이터 안전성

- 일반 사진·묶음 삭제는 DB 커밋 이후 `AfterCommitFileDeletion`이 물리 파일을 지운다. 롤백된 DB 삭제가 이미 삭제된 파일을 가리키지 않는다.
- 여러 장 묶음 업로드의 중간 실패는 after-commit 예약에 의존하지 않는다. Upload Service가 저장 직후 받은 `storageKey`를 `BundleUpload` 내부 결과로 전달하고, Bundle Service가 이미 저장된 각 키를 즉시 보상 삭제한다. DB 작업은 바깥 트랜잭션 롤백으로 되돌린다.
- 업로드 중 현재 파일의 DB 저장 실패도 Upload Service 내부에서 해당 저장 키를 즉시 삭제한다.
- 비교가 연결된 묶음은 삭제 전에 `CONFLICT`로 거절되어 부분 삭제가 발생하지 않는다.
- 남은 운영 위험: DB 커밋 뒤 스토리지 삭제 자체가 실패하면 논리 삭제는 유지되고 고아 파일만 남는다. 오류 로그는 남지만 자동 재시도/정리 배치는 이번 범위 밖이다.

## 촬영일 우선순위

- 단일 업로드: 수동 입력 → EXIF → 오류.
- 묶음 업로드: 각 사진 EXIF → 같은 위치의 수동 입력 → 묶음 시작일 → 오류.
- 종료일은 시작일 없이 지정할 수 없고, 시작일보다 이를 수 없다.

## 실행 검증

- `backend\\gradlew.bat test` 통과.
- `git diff --check` 통과. 줄바꿈 경고만 있으며 공백 오류는 없음.
- 단위 검증에 EXIF/수동/묶음 시작일 우선순위, 최대 3장, `manualTakenAts` 위치 정렬, 묶음 중간 실패의 즉시 파일 보상 삭제, comparison 포함 묶음 삭제 거절, 목록 batch 조회, after-commit 삭제를 포함한다.

## 권고 사항

- 현 분리는 계약상 적절하다. 롤백 보상은 생성된 record를 다시 조회하지 않고 저장 키를 직접 추적하므로 flush·조회 시점에도 의존하지 않는다.
