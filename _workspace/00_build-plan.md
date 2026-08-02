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
- Phase 0·1 및 **M1 기반 + 공모전 수직 슬라이스** 완료(`be434dd`). 공모전 95건 적재·좌표 95/95·집중률 매칭 59/95는 `_workspace/M1_external_dataload_results.md`에 기록.
- **M1.1 공모전 지도 뷰 완료** — 목록/지도 토글, `/contests/map`, 필터 공유, 카카오 지도 클러스터·반응형 선택 패널·경계 QA를 포함한다.
- M1.1 계약·실제 API shape·프런트 매핑·QA는 `_workspace/contracts/`, `api-shapes/`, `frontend/`, `qa/`의 `M1.1_*` 산출물에 보존한다.
- 다음 구현 마일스톤은 사용자 확인 후 M2(인증)로 진행한다.
