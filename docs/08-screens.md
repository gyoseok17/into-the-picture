# 08. 화면 · 라우트

> 모바일 우선(앱·웹 공통). React Router 기반. UI는 Tailwind + shadcn/ui.
> 화면은 도메인(02)·API(04)와 1:1로 매칭되게 구성 → 프론트 기능 폴더(`src/features/*`)와 일치.

## 내비게이션 구조

모바일은 **하단 탭바**(5개), 데스크탑은 상단 네비 + 넓은 그리드(반응형).

```
[탐색] [수상작] [타이밍] [비교] [마이]
```

## 라우트 맵

| 경로 | 화면 | 주요 API | 인증 |
|------|------|----------|:--:|
| `/` | **탐색(홈)** — 추천 키워드 + 사진 피드 | `/photos/keywords`, `/photos` | |
| `/photos?keyword=` | 키워드 검색 결과 피드 | `/photos?keyword=` | |
| `/photos/:id` | 사진 상세 (이미지·촬영지·키워드, 즐겨찾기) | `/photos/:id` | |
| `/contests` | **수상작** 목록 + 필터(계절·등급·부문·지역) | `/contests`, `/contests/filters` | |
| `/contests/:id` | 수상작 상세 — 이미지·지도·길안내·집중률·즐겨찾기 | `/contests/:id`, `/contests/:id/crowd` | |
| `/crowd` | **타이밍** — 지역→관광지 선택→30일 캘린더 | `/regions`, `/crowd/attractions`, `/crowd` | |
| `/compare` | **비교** — 내 사진 업로드 + 수상작 나란히 | `/me/photos`, `/contests` | 🔒 |
| `/me` | **마이** — 프로필 | `/users/me` | 🔒 |
| `/me/favorites` | 즐겨찾기 목록 | `/me/favorites` | 🔒 |
| `/me/photos` | 내 업로드 사진 관리 | `/me/photos` | 🔒 |
| `/login` | 카카오 로그인 | `/auth/kakao` | |

## 핵심 화면: 수상작 상세 (`/contests/:id`)

사용자 플로우(04)의 중심. 한 화면에서:
1. 대표 이미지(원본) + 제목·촬영자·수상정보
2. **지도** — 좌표(lat/lng)에 마커 (카카오 JS SDK) + **길안내** 버튼
3. **집중률 캘린더** — `crowdAvailable=true`면 shadcn `Calendar`에 30일 혼잡도 색상 + 추천일 강조. 없으면 섹션 숨김(graceful)
4. **즐겨찾기** 토글
5. (향후) **주변 할거리** 섹션 (B6)

## 컴포넌트 ↔ shadcn 매핑

| 용도 | 컴포넌트 |
|------|----------|
| 집중률 캘린더 | `Calendar` (혼잡도 색상 커스텀) |
| 사진 상세/비교 모달 | `Dialog` / `Drawer` |
| 필터(계절·등급) | `Select` / `Tabs` / `Badge` |
| 피드 카드 | 커스텀 + `Card` |
| 로딩/빈 상태 | `Skeleton` + 빈상태 컴포넌트 |

## 반응형 원칙

- 모바일 1열 → 태블릿 2열 → 데스크탑 3~4열 그리드(사진 피드).
- 터치 타깃 충분히, 하단 탭은 모바일/앱에서만.
- 이미지 `lazy load` + 종횡비 고정으로 레이아웃 시프트 방지.

## 상태/데이터 패칭

- **TanStack Query**로 서버 상태 캐싱·무한스크롤(피드)·재시도.
- 인증 상태는 전역(컨텍스트) — access 토큰 메모리, refresh 자동 재발급 인터셉터.
