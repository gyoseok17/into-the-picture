# 개발 진행 로그

사용자가 한 번에 확인·승인할 수 있는 기능 변경 묶음(버전)과 커밋별 구현 경과를 이 폴더에서 관리한다.

## 작성 규칙

- 새 사용자 목적·제품 영역은 `M<번호>-<주제>.md` 파일로 만든다. 직전 버전의 사용자 목적을 유지한 다음 독립 기능 변경은 `M<번호>.<세부번호>-<주제>.md`로 만든다.
- 하나의 버전은 기본적으로 커밋 하나다. 그 기능에 필요한 코드·DB/API·테스트·계약·설계·QA와 최종 완료 기록을 같은 기록 파일·같은 커밋에 모은다. 커밋 해시를 남기는 기록 보완만으로는 새 버전이나 문서 전용 후속 커밋을 만들지 않는다.
- 이전 버전이 커밋으로 확정된 뒤 다음 독립 기능 변경을 시작하면 기존 파일에 이어 쓰지 않고 새 세부 버전 또는 다음 번호의 파일을 만든다. 단순 문서 보완과 커밋 전 같은 기능의 수정은 같은 버전으로 남긴다.
- 한 파일 안에 계획·계획 변경·설계 결정·구현 변경·역할별 결과·QA·커밋·다음 작업 섹션을 둔다.
- 계획 변경이나 설계 변경이 생기면 기존 내용을 지우거나 덮어쓰지 않고, 해당 섹션의 맨 아래에 날짜와 번호를 붙인 새 항목으로 기록한다.
- 커밋 전 최종 범위·QA 판정·검증·완료 상태·커밋 메시지를 기록한다. 실제 해시는 Git 이력으로 확인하고, 커밋 직후 사용자에게 보고한다. 해시 기록만을 위한 추가 커밋은 만들지 않는다.
- 시크릿, 토큰, 개인 정보는 기록하지 않는다. 상세 계약·API·QA 근거는 `_workspace/`에 두고 관련 기록 파일에서 연결한다.

## 버전 목록

| 버전 | 상태 | 기록 |
| --- | --- | --- |
| M1 | 완료 | [M1-foundation-contest-slice.md](M1-foundation-contest-slice.md) |
| M1.1 | 완료 | [M1.1-contest-map.md](M1.1-contest-map.md) |
| M2 | 완료 | [M2-kakao-auth.md](M2-kakao-auth.md) |
| M3 | 완료 | [M3-photo-search.md](M3-photo-search.md) |
| M3.1 | 완료 | [M3.1-contest-location-corrections.md](M3.1-contest-location-corrections.md) |
| M4 | 완료 | [M4-crowd-discovery.md](M4-crowd-discovery.md) |
| M5 | 완료 | [M5-favorites.md](M5-favorites.md) |
| M6 | 완료 | [M6-photo-compare.md](M6-photo-compare.md) |
| M7 | 완료 | [M7-harness-governance.md](M7-harness-governance.md) |
| M8 | 완료 | [M8-photo-first-screen-experience.md](M8-photo-first-screen-experience.md) |
| M8.1 | 완료 | [M8.1-photo-record-album.md](M8.1-photo-record-album.md) |
| M8.2 | 완료 | [M8.2-harness-commit-unit.md](M8.2-harness-commit-unit.md) |
| M8.3 | 완료 | [M8.3-s3-selectable-storage.md](M8.3-s3-selectable-storage.md) |
| M8.4 | 완료 | [M8.4-docker-hub-ec2-deployment.md](M8.4-docker-hub-ec2-deployment.md) |
| M8.5 | 완료 | [M8.5-deployment-origin-configuration.md](M8.5-deployment-origin-configuration.md) |
| M9 | 완료 | [M9-album-empty-story-state.md](M9-album-empty-story-state.md) |
| M10 | 완료 | [M10-album-data-safety-and-query.md](M10-album-data-safety-and-query.md) |
| M10.1 | 완료 | [M10.1-contest-location-code-normalization.md](M10.1-contest-location-code-normalization.md) |
