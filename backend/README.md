# Into the Picture — Backend

Spring Boot 3.3 / Java 17+ / MySQL 8 / Flyway. 패키지 루트 `com.intothepicture`.

## 실행 (로컬)

```bash
# 1) MySQL 8 기동 (docker)
docker compose up -d

# 2) 애플리케이션 실행 (local 프로파일 기본)
./gradlew bootRun
```

- API Base URL: `http://localhost:8080/api/v1`
- 스키마는 Flyway(`src/main/resources/db/migration`)가 생성. `ddl-auto=none`(Flyway 가 단일 진실).
- DB 접속/포트 등은 환경변수로 override: `DB_HOST, DB_PORT, DB_NAME, DB_USERNAME, DB_PASSWORD`.
- 외부 API 키는 `.env`(저장소 루트, git 제외) — `DATA_GO_KR_KEY`, `KAKAO_REST_KEY`, `KAKAO_CLIENT_SECRET`(카카오 콘솔에서 Client Secret 사용 시). (external 모듈이 사용)
- 인증 실행에는 `JWT_SECRET` 환경변수가 필요하다. 최소 32바이트 raw UTF-8 비밀값을 `.env` 또는 실행 환경의 시크릿에 설정하며, 저장소에는 커밋하지 않는다.
- HTTPS 운영 환경에서는 `APP_AUTH_REFRESH_COOKIE_SECURE=true`를 설정한다. refresh 토큰은 HttpOnly 쿠키로만 전달되며 JSON 응답에 포함되지 않는다.

## 빌드 / 테스트

```bash
./gradlew build       # 컴파일 + 테스트
./gradlew test        # 테스트만
```

## 레이어 구조

```
com.intothepicture
├── domain
│   ├── contest   (controller/service/repository/entity/dto/port)
│   ├── crowd     (port — 집중률 provider 계약)
│   ├── user / userphoto / favorite  (엔티티)
├── global
│   ├── config     (Web/Security/Cache/JpaAuditing)
│   ├── entity     (BaseTimeEntity)
│   ├── exception  (ErrorCode/GlobalExceptionHandler 등)
│   ├── response   (PageResponse)
│   └── support    (ImageUrls)
```

외부 데이터는 `domain/**/port` 의 Provider 인터페이스로만 접근(구현은 external 모듈).
