---
name: into-the-picture-build
description: "Into the Picture 앱 구현을 에이전트 팀(backend-engineer·external-integration-engineer·frontend-engineer·qa-integration)으로 조율하는 오케스트레이터. Into the Picture 백엔드/프론트/외부연동/전체 앱을 만들·구현·개발·스캐폴딩할 때 사용. 후속 작업 — 기능 추가, 재실행·다시 실행, 수정·보완·업데이트, 특정 도메인(인증·검색·공모전·집중률·지도·비교 등)만 다시, 이전 결과 개선 요청 시에도 반드시 이 스킬을 사용."
---

# Into the Picture Build Orchestrator

Into the Picture 에이전트 팀을 조율해 설계(`docs/`)를 실제 코드(`backend/` + `frontend/`)로 구현하는 통합 스킬.

## 실행 모드: 에이전트 팀
풀스택 빌드는 backend↔frontend↔external 간 **경계면 합의·실시간 검증**이 품질을 좌우하므로 팀 모드를 쓴다.

## 에이전트 구성

| 팀원 | 타입 | 역할 | 스킬 | 출력 |
|------|------|------|------|------|
| backend-engineer | 커스텀(opus) | 엔티티·서비스·컨트롤러·인증·Flyway | spring-backend | `backend/` |
| external-integration-engineer | 커스텀(opus) | 외부 API 어댑터·DTO·sync·지오코딩 | external-api-adapter | `backend/`(external) |
| frontend-engineer | 커스텀(opus) | 화면·훅·지도·라우팅 | react-capacitor-frontend | `frontend/` |
| qa-integration | general-purpose(opus) | 경계면 교차검증(incremental) | integration-qa | `_workspace/qa-*` |

> 모든 Agent/TeamCreate 호출에 `model: "opus"`를 명시한다.
> 모든 팀원은 영역 스킬과 함께 공통 **`engineering-principles`**(확장성·수정 규율·SRP/DIP·가독성)를 따른다.

## 워크플로우

### Phase 0: 컨텍스트 확인 (초기/후속 판별)
1. `_workspace/` 존재 여부 + `backend/`·`frontend/` 존재 여부 확인.
2. 분기:
   - 미존재 → **초기 빌드**. Phase 1로.
   - 존재 + 사용자가 **부분 수정/기능 추가** 요청 → **부분 재실행**: 해당 도메인 담당 팀원만 재가동, 관련 산출물만 갱신.
   - 존재 + **새 입력/대규모 변경** → 기존 `_workspace/`를 `_workspace_{타임스탬프}/`로 이동 후 새로 진행.

### Phase 1: 준비
1. `docs/` 설계를 로드(00~09). 단일 진실.
2. `_workspace/` 생성. `design-process/data/sigungu-codes.json`(코드표), `.env`(키) 위치 확인.
3. 빌드 범위 결정 — 전체 또는 사용자가 지정한 도메인(인증/검색/공모전/집중률/지도/비교).

### Phase 2: 팀 구성
1. `TeamCreate(team_name:"into-the-picture", members:[4명, 각 model:"opus", 위 에이전트 정의 사용])`.
2. `TaskCreate`로 작업 등록(의존성 `depends_on` 명시). 팀원당 4~6개.

### Phase 3: 빌드 (파이프라인 + 팬아웃)
**3-1. 계약 합의 (먼저):**
- backend ↔ external이 **Provider 인터페이스 계약**(시그니처·DTO)을 합의해 `_workspace/contracts/`에 게시.
- API 응답 shape는 `docs/04`가 기준 — backend가 엔드포인트별 shape를 `_workspace/api-shapes/`에 게시(프론트·QA가 대조).

**3-2. 병렬 구현 (팬아웃):**
- backend: 엔티티·Flyway·도메인 서비스·컨트롤러·인증.
- external: 어댑터·DTO 변환·공모전 sync+파싱·지오코딩.
- frontend: `docs/04` 계약 기준으로 화면·훅 선개발(백엔드 완성 전에도 진행).
- 팀원은 공유 작업 목록에서 claim하고, 경계가 닿는 부분은 SendMessage로 합의.

**3-3. Incremental QA:**
- 한 도메인(예: contest API + 그 훅)이 완성될 때마다 qa-integration이 **즉시** 경계면 검증 → 지적은 양쪽에 전달, 담당이 수정. 전체 완성까지 미루지 않는다.

### Phase 4: 통합·검증
1. 모든 작업 완료 대기(TaskGet).
2. 프론트를 실제 백엔드에 연결, qa-integration 전체 정합성 패스(체크리스트).
3. 남은 경계면 이슈 수정. 빌드/실행 가능 상태 확인.

### Phase 5: 정리
1. 팀원 종료(SendMessage) 후 `TeamDelete`.
2. `_workspace/` 보존(감사 추적).
3. 사용자에게 결과 요약 + 다음 단계(실행/테스트) 안내. **피드백 요청**(개선점·팀 구성 변경 희망?).

## 데이터 전달 프로토콜
- **태스크 기반**(TaskCreate/Update): 진행·의존 관리.
- **파일 기반**(`_workspace/`): contracts/, api-shapes/, qa-리포트 등 산출물.
- **메시지 기반**(SendMessage): 경계면 실시간 합의.
- 파일명: `_workspace/{phase}_{agent}_{artifact}.{ext}`. 최종 코드만 `backend/`·`frontend/`.

## 에러 핸들링
| 상황 | 전략 |
|------|------|
| 외부 API 쿼터/장애 | 어댑터 폴백·1회 재시도, 안 되면 누락 명시하고 진행 |
| 팀원 실패/유휴 | 리더가 감지 → 상태 확인 → 재시작 또는 작업 재할당 |
| 계약 충돌(API shape 불일치) | 삭제 말고 `docs/04` 기준으로 합의, 양쪽 수정 |
| 스펙 모호 | 추측 금지 — 리더가 사용자에 확인 |

## 테스트 시나리오
**정상 흐름:** docs 로드 → 팀 구성(4명) → 계약 합의 → 병렬 구현 → 도메인별 incremental QA → 통합 → `backend/`+`frontend/` 생성, 경계면 통과.
**에러 흐름:** 집중률 매칭 실패 도메인에서 frontend가 빈 데이터 접근 → qa가 경계면 지적(파일:라인) → frontend가 graceful 처리(섹션 숨김)로 수정 → 재검증 통과.

## 범위 메모
- `design-process/data/sigungu-codes.json`은 빌드 시 backend 리소스로 이동(앱이 사용).
- 위치기반 "할거리 추천"·비교 저장 등은 설계상 후속(별도 요청 시 부분 재실행으로 추가).
