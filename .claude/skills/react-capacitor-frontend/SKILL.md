---
name: react-capacitor-frontend
description: "Into the Picture 프론트엔드 구현 규약 — React+TypeScript+Vite+Capacitor, 기능 폴더 구조, Tailwind+shadcn/ui, TanStack Query 데이터 패칭, 카카오 지도 JS SDK, JWT 토큰 관리. 화면·컴포넌트·라우팅·API 연동 훅을 작성하거나 수정할 때 반드시 사용."
---

# React + Capacitor 프론트엔드 구현 규약

웹·앱 공통, 모바일 우선 UI. 스펙(무엇)은 `docs/04·08·09`, 이 스킬은 방법(어떻게)이다.

## 프로젝트 구조 (Vite + React + TS)

```
frontend/src
├── features/{domain}     (photo / contest / crowd / compare / favorite / auth)
│   ├── components/  hooks/  api.ts  types.ts
├── components/ui         (shadcn/ui 컴포넌트 — 복사해와 수정)
├── components            (공용: 레이아웃, 탭바, 상태표시)
├── lib                   (apiClient, queryClient, kakaoMap)
├── routes                (React Router)
└── main.tsx
```

기능별 폴더로 분리해야 도메인 변경이 격리된다. 화면↔도메인↔API는 1:1로 맞춘다.

## 데이터 패칭 — TanStack Query
- 모든 서버 상태는 `useQuery`/`useMutation`. 직접 fetch를 컴포넌트에 흩뿌리지 않는다.
- 훅은 feature의 `hooks/`에. 목록은 무한스크롤(`useInfiniteQuery`).
- **응답 타입(`types.ts`)은 `docs/04`의 shape를 그대로 정의**한다. 백엔드 실제 응답과 다르면 `any`/제네릭으로 우회하지 말고 backend-engineer와 합의 — 캐스팅 우회는 런타임 경계면 버그를 숨긴다(QA가 잡는 대표 결함).

## API 클라이언트
- `lib/apiClient.ts`: 공통 baseURL(`/api/v1`), JSON, 에러 포맷(`{error:{code,message}}`) 파싱.
- **JWT 인터셉터**: access를 `Authorization: Bearer`로 첨부, 401 시 refresh로 자동 재발급 후 재시도. access는 메모리, refresh는 Capacitor 보안저장소/웹 httpOnly.
- 목록 응답은 `{content, page}` 래퍼를 훅에서 unwrap한다(`.content`).

## 스타일 — Tailwind + shadcn/ui
- shadcn 컴포넌트는 `components/ui`에 복사해 쓰고 자유 수정.
- 집중률 캘린더 = `Calendar`(혼잡도 색상 커스텀), 모달 = `Dialog`/`Drawer`, 필터 = `Select`/`Tabs`/`Badge`.
- 모바일 우선: 1열→2열→3~4열 그리드. 이미지 lazy load + 종횡비 고정(레이아웃 시프트 방지).

## 카카오 지도
- `lib/kakaoMap.ts`로 JS SDK 로드(`VITE_KAKAO_JS_KEY`). 좌표(lat/lng)로 마커·길안내. 좌표는 백엔드 응답(지오코딩 결과)에서 받는다.

## 라우팅
- React Router. 모바일 하단 탭(탐색/수상작/타이밍/비교/마이) — `docs/08`의 라우트 맵. 보호 라우트는 인증 가드.
- href/이동 경로는 실제 라우트와 정확히 일치(QA가 대조).

## 상태 표시
- 모든 화면에 **로딩(Skeleton)/빈 상태/에러+재시도** 3종. 외부 데이터 빈 응답(집중률 없음 등)은 에러가 아니라 섹션 숨김으로 처리.

## 환경변수
- 클라이언트 노출 키는 `VITE_` 접두사(`VITE_KAKAO_JS_KEY`). REST 키 등 서버 비밀은 프론트에 두지 않는다.

## 산출물
- `frontend/` 코드 + `_workspace/`에 훅↔API 매핑표(QA 대조용).
