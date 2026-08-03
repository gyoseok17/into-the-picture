# M1 — 기반 구축 및 공모전 수직 슬라이스 · 완료

- 커밋: `be434dd` (`feat: M1 기반 + 공모전 슬라이스 (백엔드·프론트·외부연동·QA)`)
- 기간: 2026-07-30

## 구현

- Spring Boot·React·Capacitor 기반과 공통 응답, 예외, CORS, Flyway 기반을 구성했다.
- 공모전 목록·검색·필터·상세 화면과 공모 인원 캘린더를 구현했다.
- 관광 공공데이터 동기화, Kakao 지오코딩, 공모 인원 매칭 어댑터를 연결했다.
- 초기 적재: 공모전 95건, 좌표 100%, 공모 인원 정보 64%.

## 설계 결정과 이유

- 공모전 탐색부터 외부 데이터 수집까지 하나의 수직 슬라이스로 완료해 화면·API·데이터 흐름을 조기에 검증했다.
- 외부 제공처 의존 코드는 어댑터와 DTO 경계로 분리해 제공처 변경과 데이터 누락에 대응한다.

## 검증

- 목록, 상세, 필터, 외부 적재 및 주요 API 계약을 확인했다.
- 근거: `_workspace/M1_api_contract.md`, `_workspace/M1_qa_results.md`, `_workspace/M1_external_dataload_results.md`

## 특이사항 / 후속

- 외부 원본의 누락·변동은 정상 상태로 취급하고 화면에 대체 표시가 필요하다.
- DB 전환은 별도 기록: [M1.DB — Supabase PostgreSQL 전환](M1.DB-supabase-postgres.md)
