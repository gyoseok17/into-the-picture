# M9 프런트엔드 — 수상작 길안내·위치 계약

## 변경 범위

- `ContestDetailPage`는 길안내용 목적지로 수상작 제목 대신 `detail.location`을 전달한다.
- `ContestMap`의 입력 이름을 `destinationName`으로 명확히 해 카카오 길안내 URL에만 사용한다.
- `ContestDetail`에 백엔드 상세 응답의 `mapRegionCode`, `mapCityCode`(nullable)를 추가했다. 이번 화면은 아직 이 값을 표시하거나 비교 업로드에 주입하지 않는다.

## 설계 결정

- `location`이 빈 문자열인 레거시 데이터일 때에만 제목을 안전한 대체값으로 쓴다. 정상 수상작은 실제 촬영지 텍스트가 카카오 링크 목적지로 전달된다.
- 위치 코드는 앨범 지도와 같은 코드 체계를 따르되, 프런트가 주소 문자열을 추측하거나 변환하지 않는다.

## 검증

- `frontend`: `npm run build` 통과 (TypeScript 검사 + Vite production build).
- 카카오 길안내 생성 호출은 `ContestMap` 한 곳이며, 상세 페이지에서 전달하는 목적지명이 `detail.location.trim() || detail.title`인지 확인했다.

## 남은 위험

- 실제 응답의 새 위치 코드 필드는 백엔드 M9 변경과 함께 제공된다. nullable로 선언했으므로 동기 배포 전 기존 응답에서도 화면은 깨지지 않는다.
