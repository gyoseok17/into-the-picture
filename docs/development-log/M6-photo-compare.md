# M6 사진 놓기 — 완료

- 완료일: 2026-08-12
- 커밋: `feat: M6 사진 놓기와 개인 사진 기록`

## 목표

- 즐겨찾기한 수상작과 내 사진을 나란히 놓아 보고, 결과를 개인 기록으로 남긴다.

## 구현

- 사진 업로드: JPEG·PNG·WebP, 최대 10MB와 파일 시그니처를 검증한다.
- 사진 놓기: 즐겨찾기한 수상작과 내 앨범 사진을 선택하거나 새 사진을 올려 결과를 저장한다.
- 결과 관리: 결과 상세의 `수정` 창에서 현재 사진을 확인하고, 사진 변경 또는 삭제를 선택한다.
  - 사진 변경: 앨범 사진 또는 새 업로드 사진으로 교체하며, 이전 사진은 사진첩에 남긴다.
  - 삭제: 결과만 삭제(수상작 연결 해제) 또는 사진도 함께 삭제(기록·원본 파일 삭제)를 구분한다.
- 내 사진: 마이 화면에서 앨범 사진을 조회하고, 수상작 연결이 없는 사진은 삭제할 수 있다.
- 접근 보호: 내 사진 파일은 정적 URL로 공개하지 않으며, 로그인한 소유자만 사진 파일 API로 조회한다.
- 인증 보완: 세션 표시 쿠키가 있을 때만 초기 refresh를 요청하고 실패 시 표시를 지운다.

## 구조 변경

- `user_photo`는 원본 파일의 저장 정보만 가진다.
- `photo_record`는 사진첩 기록이며, `takenAt`, `placeName`, `memo`, `displayMode`, `archivedAt`와 선택적 수상작 연결을 가진다.
- 기존 `photo_comparison` 데이터는 Flyway V5에서 `photo_record`로 이관하고 기존 테이블을 제거했다.
- 기존 `/me/photos`, `/me/comparisons` 응답 형태는 유지해 다음 사진첩 UI 개편을 위한 호환 계층으로 사용한다.

## API

- `POST/GET/DELETE /api/v1/me/photos`
- `GET /api/v1/me/photos/{recordId}/file` (소유자 전용)
- `GET/POST/PATCH/DELETE /api/v1/me/comparisons`

## 검증

- `frontend`: `npm run build` 통과
- `backend`: `./gradlew.bat test` 통과
- 비로그인 사진 파일 조회는 401, 기존 `/files/**` 공개 경로는 차단됨을 확인

## 다음 단계

- 사진첩 UI 개편: 촬영일·장소 정렬, 직접 업로드 기록, 보관/표시 방식 편집
- 공유 기능은 별도 `photo_post`, `photo_like` 모델로 확장
