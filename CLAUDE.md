# Into the Picture

## 공통 하네스 기준

모든 코딩 세션은 [AGENTS.md](AGENTS.md)를 읽고 따른다. 이 파일은 역할 기반 병렬 작업, 계약, QA, 진행 기록, 커밋 게이트의 공통 기준이다. 이 문서는 Claude Code 전용 설정만 추가하며 `AGENTS.md`의 규칙을 약화하지 않는다.

## 개발 진행 기록

`docs/development-log/`은 버전과 커밋 진행 기록의 영구 위치다. 각 버전은 전용 Markdown 파일 하나를 사용하고, `README.md`는 색인 역할만 한다.

- 새 사용자 목적·제품 영역은 `M<번호>`로, 이미 확정한 버전의 사용자 목적을 잇는 다음 독립 기능 변경은 `M<번호>.<세부번호>`로 시작한다. 한 버전의 코드·DB/API·테스트·문서는 같은 기록 파일을 사용한다.
- 기능·아키텍처·보안·데이터 모델·배포 작업은 시작할 때 전용 버전 파일을 만들고 `진행 중`을 기록한다.
- 계획, 결정, 구현 변경, 역할 인수인계, QA, 커밋은 파일 안의 목적별 섹션에 날짜·번호를 붙여 누적한다. 이전 기록을 덮어쓰지 않는다.
- 상세 구조와 파일 템플릿은 `AGENTS.md`와 `docs/development-log/_template.md`를 따른다. 시크릿, 토큰, 개인 정보는 기록하지 않는다.

사진으로 여행지를 발견하는 관광 추천 서비스. 설계는 `docs/`(00~10), 검증 과정은 `design-process/`.

## 하네스: Into the Picture 앱 빌드

**목표:** 설계(`docs/`)를 Spring Boot 백엔드 + React/Capacitor 프론트로 구현한다.

**트리거:** Into the Picture 구현·개발·스캐폴딩, 기능 추가·수정·보완, 특정 도메인(인증·사진검색·공모전·집중률·지도·포토비교) 작업 요청 시 **`into-the-picture-build`** 스킬(오케스트레이터)을 사용하라. 단순 질문·설계 논의·문서 확인은 직접 응답 가능. 역할 구성·병렬 실행·QA 게이트는 반드시 `AGENTS.md`를 따른다.

**변경 이력:**
| 날짜 | 변경 내용 | 대상 | 사유 |
|------|----------|------|------|
| 2026-06-27 | 초기 구성 — 에이전트 4(backend·external·frontend·qa) + 스킬 6(spring-backend·external-api-adapter·react-capacitor-frontend·integration-qa·engineering-principles·into-the-picture-build) | 전체 | 설계 완료 후 신규 구축 |
| 2026-06-28 | 팀 모드 정합 — 팀 플래그(`CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1`)를 공유 settings.json에 추가(저장소 받는 모든 환경에서 팀 모드 활성화), qa 출력 경로 `_workspace/qa/`로 통일, 에이전트 4종 frontmatter에 `model: opus` 명시, 설계단계 permission 잔재 정리 | settings·에이전트·integration-qa | 점검 중 발견된 문서·실설정 불일치 수정 |
| 2026-08-12 | Codex·Claude 공통 역할 기반 병렬 실행, 코드 품질 게이트, 단일 파일 마일스톤 기록 규칙을 `AGENTS.md`로 고정 | 전체 하네스 | 세션 기억이나 Claude 전용 스킬에 의존하지 않고 역할 분담·QA·기록을 강제 |
