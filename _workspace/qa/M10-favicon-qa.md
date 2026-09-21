# M10 파비콘 적용 QA

검토 일시: 2026-09-21

## 확인 결과

- `frontend/index.html`의 `<head>`가 `/into-the-picture-favicon.png`를 `image/png` 아이콘으로 연결한다.
- 원본 파일은 `frontend/public/into-the-picture-favicon.png`에 존재한다.
- Vite는 `public/` 파일을 URL 루트로 그대로 복사하므로 프로덕션 빌드 결과에도 `frontend/dist/into-the-picture-favicon.png`가 생성되는 것을 확인했다.
- 경로는 사이트 루트 기준 절대 경로라 Docker/Caddy가 프런트 정적 루트를 `dist`로 제공하는 현재 배포 구조와 일치한다.

## 검증

- `frontend`: `npm run build` 통과
- `git diff --check` 통과
- 기존 Vite 500 kB 청크 경고만 발생했고 파비콘 변경과 무관하다.

## 판정

통과. 배포 뒤 브라우저가 이전 아이콘을 캐시할 수 있으므로 새 탭 또는 강력 새로고침으로만 외관 확인이 필요하다.

## 재검토 — 짙은 민트 원형 아이콘 교체

- `frontend/public/into-the-picture-favicon.png`의 교체본(662,151 bytes)을 확인했다.
- `frontend/index.html`은 같은 루트 경로 `/into-the-picture-favicon.png`를 계속 참조한다.
- 빌드 후 `frontend/dist/into-the-picture-favicon.png`가 동일한 크기로 생성돼 정적 배포 경로가 유효하다.
- `npm run build`, `git diff --check` 통과.

### 위험

- 파일명·URL이 변하지 않아 이미 접속한 브라우저는 기존 파비콘을 캐시할 수 있다. 기능 오류는 아니며 강력 새로고침 또는 새 탭에서 갱신 여부를 확인하면 된다.
- 기존 500 kB 청크 경고는 유지되며 파비콘 교체와 무관하다.
