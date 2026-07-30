# Into the Picture — 빌드 계획 (오케스트레이터 기록)

작성: 2026-06-27 · 오케스트레이터: into-the-picture-build · 실행모드: 에이전트 팀 (in-process) — 리드가 `Agent` 도구로 팀원 스폰, 플래그 `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1`로 피어 통신(SendMessage)+공유 Task목록. TeamCreate는 v2.1.178부터 폐기. Windows에서 in-process로 동작(split-pane 보기만 tmux 필요).

## 전략
- **수직 슬라이스**로 진행 — 기능 한 줄기를 backend+external+frontend+QA까지 관통(수평 분할 X).
- 이유: 매 마일스톤마다 실행 가능한 결과 + 경계면 버그 조기 차단(incremental QA).
- **마일스톤마다 멈추고 사용자 보고 → 확인 후 다음**. 전체 무인 진행 안 함.
- 마일스톤 안에서는 4명 병렬 + QA. 순서: 계약 합의 → 병렬 구현 → 즉시 QA.

## 마일스톤 로드맵

| 단계 | 내용 | 의존/비고 |
|------|------|----------|
| **M1** | 기반(백/프론트 뼈대·공통 인프라·데이터모델) + **공모전(contest) 슬라이스 끝까지**(목록·필터→상세→지도/지오코딩→집중률) + QA | 핵심·최복잡 → 먼저 관통해 계약 확정 |
| **M2** | 인증(카카오 로그인 + JWT) | 비교·즐겨찾기 전제 |
| **M3** | 사진 검색(키워드 피드·상세) | |
| **M4** | 방문 타이밍(관광지 선택→30일 캘린더) | 집중률 어댑터는 M1 재사용, 화면 추가 |
| **M5** | 포토 비교(업로드·저장소·비교 뷰) | 인증 필요(M2 후) |
| **M6** | 즐겨찾기 | 인증 필요 |
| **M7** | 통합 마무리(전체 QA·실행 확인·다듬기) | |

## 기록 규약
- 진행 상태 → 공유 작업목록(Task).
- 계약 → `_workspace/contracts/`, API 응답 shape → `_workspace/api-shapes/`, QA 리포트 → `_workspace/qa/`. (`_workspace/`는 빌드 후 보존, 파일명 `{단계}_{에이전트}_{산출물}`)
- 최종 코드 → `backend/`·`frontend/`만.
- 마일스톤 완료 → git 커밋(`feat: M… …`, Claude 표기 없음).
- 프로젝트 진행/결정 → 메모리(into-the-picture-project). 하네스 변경 → CLAUDE.md 변경이력.

## 현재 상태
- Phase 0(초기 빌드 확인: `backend/`·`frontend/` 없음 → 초기 빌드)·Phase 1(설계 로드 00~09, 워크스페이스 준비) 완료.
- **M1 진행 중** — 2026-06-28 착수. 팀 4명(backend·external·frontend·qa) 스폰.
- 작업목록은 세션별로 생성됨(세션 넘으면 미보존) → M1 착수 시 재등록.
- 계약 시드 게시: `_workspace/contracts/M1_lead_contracts.md`, `_workspace/api-shapes/M1_lead_contest-shapes.md` (backend↔external·frontend이 합의·갱신).
