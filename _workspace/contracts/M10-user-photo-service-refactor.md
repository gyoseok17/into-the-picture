# M10 사진 기록 서비스 책임 분리 계약

## 유지할 외부 계약

- `/me/photos`, `/me/photos/bundles`, `/me/photos/map`, `/me/photos/bundles/map`, 대표 기록·파일 조회 API의 경로·요청·응답
- 기존 `PhotoRecordBundleService`, `PhotoComparisonService`, Controller가 사용하는 소유 기록 조회와 업로드/삭제 의미
- 파일 저장 실패 보상과 DB 커밋 뒤 파일 삭제 규칙
- EXIF 우선 촬영일 해석, 수동 촬영일 및 묶음 시작일 보완 규칙

## 목표 내부 경계

| 서비스 | 책임 |
| --- | --- |
| UserPhotoService | 사진 기록의 소유권 조회, 수정·삭제, DTO·파일 조회의 조율 |
| UserPhotoUploadService | 업로드 검증, 파일 저장 보상, EXIF/수동 촬영일 해석, 묶음 업로드용 기록 생성 |
| PhotoRecordMapService | 지도·묶음 지도 투영, 지오코딩 보완, 대표 기록 설정, 지도 지역 목록 |

## 금지 사항

- 서비스 분리만으로 Controller/API/DB/권한 규칙을 바꾸지 않는다.
- 파일을 DB 커밋 전에 삭제하지 않는다.
- 묶음 업로드처럼 같은 트랜잭션 안에서 이미 저장한 여러 파일을 되돌릴 때는, 롤백으로 실행되지 않는 after-commit 예약에 의존하지 않는다. 해당 업로드의 물리 파일은 즉시 보상 삭제하거나 동등하게 확실한 정리 경로를 둔다.
- 외부 지오코딩 호출 횟수·재시도 정책을 이번 작업에서 변경하지 않는다.
