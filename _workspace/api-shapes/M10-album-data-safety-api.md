# M10 API 형태 확인

이번 변경은 API 형태를 바꾸지 않는다.

| API | 요청/응답 | 내부 변경 |
| --- | --- | --- |
| `DELETE /me/photo-record-bundles/{bundleId}` | 기존 `204`, `404`, `409` 유지 | DB 삭제 후 커밋 콜백으로 파일 제거 |
| `GET /me/photo-record-bundles` | 기존 `PhotoRecordBundleDto[]` 유지 | 사진을 묶음 ID 기준으로 일괄 조회 |
| `GET /me/favorites/contests` | 기존 `FavoriteContestDto[]` 유지 | 수상작을 ID 집합으로 일괄 조회 |

파일 저장소 실패는 요청이 커밋된 뒤에 발생할 수 있으므로 HTTP 응답을 되돌리지 않는다. 이는 DB가 존재하지 않는 파일을 가리키는 더 심각한 불일치를 막기 위한 선택이다.
