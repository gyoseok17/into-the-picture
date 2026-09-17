# JWT 로컬 실행 시크릿 검토

## 확인 범위

- `application.yml`은 `app.jwt.secret`을 `${JWT_SECRET:}`에서만 읽는다.
- 기본 활성 프로필은 `local`이며, `application-local.yml`에는 JWT 값을 덮어쓰는 설정이 없다.
- `JwtService`는 UTF-8 기준 32바이트 미만 값을 시작 단계에서 거부한다.
- 저장소 루트의 `.env`는 gitignore 대상이지만 Spring Boot가 자동으로 읽도록 구성되어 있지 않다.

## 결정 기준

사용자 요구는 프로젝트를 옮긴 뒤에도 환경변수 설정 없이 로컬에서 실행하는 것이다. 따라서 로컬 프로필에만 32바이트 이상인 **개발 전용 고정값**을 둔다.

- 공통 `application.yml`의 `${JWT_SECRET:}` 계약은 유지한다. 운영/다른 프로필은 계속 배포 시크릿을 필수로 요구한다.
- `application-local.yml`에서만 `app.jwt.secret`을 설정한다. 이 값은 개발용이므로 실 서비스·공개 환경에 사용하면 안 된다.
- JWT 검증(최소 32바이트)은 유지한다. 검증을 제거하거나 짧은 기본값으로 완화하지 않는다.
- `.env`의 실제 값은 읽거나 기록하지 않는다.

## 회귀·보안 확인 항목

1. `local` 프로필에서 환경변수 없이 `bootRun`이 시작되는지 확인한다.
2. `JWT_SECRET` 환경변수가 있으면 로컬 프로필의 고정 개발값이 우선되는지 여부를 명확히 한다. 이 방식은 실행 편의가 목적이므로, 로컬에서 환경변수로 별도 키를 주입해야 한다면 placeholder 우선순위를 별도로 설계해야 한다.
3. 공통/운영 설정에 개발용 fallback을 추가하지 않는다. 운영에서 누락을 발견하지 못하는 회귀를 막는다.
4. 개발용 고정키는 임의 토큰 위조 위험이 있으므로 공개 배포 프로필에서 절대 활성화하지 않는다.

## QA 판정 (구현 전)

- 권고안: `application-local.yml` 한 파일에만 32바이트 이상 개발용 키를 추가.
- 차단 조건: 공통 설정에 fallback을 두거나 최소 길이 검증을 제거하는 방식.
- 구현 후 확인 필요: local startup 및 테스트 실행, 운영 프로필이 환경변수 없이 실패하는 기존 보안 경계 유지 여부.

## 최종 재검토

- 실제 변경 파일은 `application-local.yml` 하나다.
- 로컬 값은 `${JWT_SECRET:...}` 형식이므로, 설정된 환경변수는 계속 우선한다.
- 공통 설정의 환경변수 계약과 `JwtService`의 32바이트 검증은 변경되지 않았다.
- `local` `bootRun`은 기존의 JWT 길이 검증을 통과했다. 이후 DB 연결 단계에서 `The server requested SCRAM-based authentication, but no password was provided`로 멈췄다.

### 판정

- JWT 변경: **통과**. 프로젝트 이동 뒤 local 프로필에서 JWT 시크릿 누락으로 시작이 막히지 않는다.
- 전체 백엔드 기동: **차단**. `DB_PASSWORD`가 비어 있어 PostgreSQL/Supabase SCRAM 인증을 통과하지 못한다. JWT와 별개인 데이터베이스 환경 설정 문제이며, 임의 DB 비밀번호를 저장소에 넣으면 안 된다.
