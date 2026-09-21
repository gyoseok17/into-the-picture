# M10 앨범 화면 구조 정리 계약

## 목적

앨범의 사용자 동작과 API 계약을 바꾸지 않고, 화면 조율·표시·세부 상호작용의 책임만 분리한다.

## 유지할 외부 계약

- 라우트: `/me/album`, `/me/album?contestId={contestId}`
- 앨범 조회·지도 조회·사진 추가/수정/삭제·묶음 삭제 API의 요청과 응답
- 스토리/맵 전환, 관리 선택, 사진 확대, 수상작 비교 진입의 사용자 흐름
- React Query 캐시의 논리 키: photo records, bundles, map, bundle map, comparisons

## 내부 책임 계약

| 단위 | 책임 |
| --- | --- |
| Album page/container | 라우트 검색값, 앨범 데이터 훅, 화면 모드와 다이얼로그 진입 상태 조율 |
| Story view | 시간 그룹과 카드 표시, 스토리 미리보기 진입 전달 |
| Map view | 지도 표시·권역 선택·지도 내부 포커스 상호작용 |
| Album dialogs | 사진 추가, 레거시 사진 수정, 묶음 확대, 수상작 선택/결과 보기 |
| Query-key module | 사진 기록·비교 관련 캐시 키와 무효화 범위 |

## 금지 사항

- 세부 표시 컴포넌트가 `apiClient` 또는 React Query 무효화를 직접 호출하지 않는다.
- 리팩터링만을 이유로 API 경로·응답·DB를 바꾸지 않는다.
- 기존 앨범 화면과 비교 기능의 진입 경로를 제거하지 않는다.
