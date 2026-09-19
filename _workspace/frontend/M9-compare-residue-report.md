# M9 `/compare` 제거 잔재 점검

## 조사 범위

- 프런트 라우터와 페이지 파일
- `navigate`, `Link`, `returnTo` 등 URL 이동 경로
- `/compare`, `ComparePage` 문자열과 비교 전용 상태·검색 파라미터

## 결과

- `/compare` 라우트와 `ComparePage` import는 `router.tsx`에 남아 있지 않다.
- `frontend/src/pages/ComparePage.tsx`는 삭제 상태이며, `/compare` 직접 접근은 `NotFoundPage`로 처리된다.
- `/compare`를 향하는 `Link`, `navigate`, 로그인 복귀 경로, 저장소 키는 남아 있지 않다.
- `PhotoRecordAlbum`의 `comparisonContestId`는 `/me/album?contestId=<id>`에서 수상작을 미리 선택해 비교 사진을 고르는 **현재 앨범 플로우**이므로 제거 대상이 아니다. 이미 비교한 경우에는 선택기를 닫는 동작에도 사용된다.
- `comparison` 도메인 API·타입·공개 관리 경로(`/me/comparisons`)는 현재 기능이므로 유지한다.

## 변경

- 이번 전수 조사에서는 추가로 제거할 `/compare` 전용 실행 코드가 발견되지 않았다. 중복 정리로 현재 앨범 비교 흐름을 손상시키지 않기 위해 코드 변경은 하지 않았다.

## 검증

- `rg -n -i '/compare|comparepage|returnTo=.*compare' frontend` 결과 없음.
- `rg`로 라우트·이동 경로와 `comparisonContestId` 사용처를 수동 대조했다.
- `npm run build` 통과 (기존 500kB chunk 경고만 발생).
- 저장소 루트에서 `git diff --check` 통과 (공백 오류 없음).
