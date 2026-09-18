# Into the Picture — Backend

Spring Boot 3.3 / Java 17+ / PostgreSQL(Supabase) / Flyway. 패키지 루트 `com.intothepicture`.

## 실행 (로컬)

```bash
# 1) backend/.env를 만들고 Supabase 연결값과 시크릿을 채운다.
#    예: Copy-Item .env.example .env

# 2) 기존 로컬 실행
./gradlew bootRun
```

- API Base URL: `http://localhost:8080/api/v1`
- 스키마는 Flyway(`src/main/resources/db/migration`)가 생성. `ddl-auto=none`(Flyway 가 단일 진실).
- 백엔드는 단일 `application.yml`에서 `backend/.env`(gitignore 대상)를 읽는다. `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USERNAME`, `DB_PASSWORD`, `JWT_SECRET`을 채운 뒤 실행한다. 처음에는 `backend/.env.example`을 복사해 실제 값을 채운다. YAML에는 DB·JWT 기본값을 두지 않는다.
- 외부 API 키는 `backend/.env`(git 제외) — `DATA_GO_KR_KEY`, `KAKAO_REST_KEY`, `KAKAO_CLIENT_SECRET`(카카오 콘솔에서 Client Secret 사용 시). (external 모듈이 사용)
- `backend/.env`는 Java properties 형식의 `KEY=value`로 작성한다. `JWT_SECRET`은 raw UTF-8 기준 최소 32바이트여야 하며, `backend/.env`와 운영 시크릿은 저장소에 커밋하지 않는다.
- HTTPS 운영 환경에서는 `APP_AUTH_REFRESH_COOKIE_SECURE=true`를 설정한다. refresh 토큰은 HttpOnly 쿠키로만 전달되며 JSON 응답에 포함되지 않는다.

## Docker 배포 실행 (단일 HTTPS 도메인 + 외부 Supabase DB)

### Photo storage selection

### Docker Hub 배포

`docker-compose.yml`은 로컬 소스를 빌드하지 않고 Docker Hub 이미지를 실행합니다.

1. `cp .env.example .env` 후 운영 시크릿과 DB·S3 값을 채웁니다.
2. `APP_DOMAIN`에는 실제 도메인을, `APP_IMAGE_TAG`에는 배포할 고정 버전(최초 `m8.3`)을 설정합니다. HTTPS Compose는 `APP_DOMAIN`에서 CORS와 카카오 콜백 검증용 허용 출처(`https://<APP_DOMAIN>`)를 자동으로 만드므로 `APP_CORS_ALLOWED_ORIGINS`를 별도로 설정하지 않습니다.
3. 실행합니다.

```bash
docker compose pull
docker compose up -d
```

프런트 이미지는 빌드 시점에 공개 카카오 JavaScript 키를 포함합니다. 따라서 배포 서버의 `.env`에는 `VITE_KAKAO_JS_KEY`를 넣지 않습니다. AWS 키·프로필·로컬 `.aws` 마운트도 사용하지 않으며, S3 권한은 EC2 IAM 역할로 제공합니다.

- Default `APP_STORAGE_TYPE=local` stores files under `APP_STORAGE_LOCAL_DIR` (default `./uploads`).
- For S3 set `APP_STORAGE_TYPE=s3`, `AWS_REGION`, and `APP_STORAGE_S3_BUCKET`. Credentials are resolved from local AWS CLI/SSO credentials or the EC2 IAM role; do not put AWS access keys in `.env`.
- Keep the S3 bucket private. The EC2 role needs only `GetObject`, `PutObject`, and `DeleteObject` for `u/*`; the backend keeps its existing authorized file endpoints instead of exposing S3 URLs.

### 로컬 Docker Compose에서 S3 확인

1. AWS CLI로 `into-the-picture-local` 프로필을 만든다. 자격 증명은 프로젝트 파일이 아닌 `%USERPROFILE%\.aws`에만 둔다.
2. `backend/.env`에서 `APP_DOMAIN=localhost`, `APP_STORAGE_TYPE=s3`과 S3 리전·버킷을 설정한다.
3. Git 제외 파일 `backend/docker-compose.local.yml`에 `.aws` 폴더의 읽기 전용 bind mount와 `AWS_PROFILE=into-the-picture-local`만 둔다.
4. `docker compose -f docker-compose.yml -f docker-compose.local.yml pull` 후 `docker compose -f docker-compose.yml -f docker-compose.local.yml up -d`로 실행한다. `https://localhost`의 Caddy 로컬 인증서는 브라우저 신뢰 설정이 필요할 수 있다.

```bash
# backend/.env를 만든 뒤, APP_DOMAIN과 APP_IMAGE_TAG를 포함한 값을 채운다.
# DB·JWT·서버 API 시크릿도 같은 파일에만 둔다.
docker compose pull
docker compose up -d
```

- Compose는 `frontend`(Caddy)만 외부 `80`/`443`을 열며, `APP_DOMAIN`으로 HTTPS 인증서를 관리한다. `/api/*` 요청은 Compose 내부 네트워크의 `backend:8080`으로 전달된다. 백엔드 `8080`은 호스트에 공개하지 않는다.
- `backend/.env`는 **backend 서비스에만** `env_file`로 주입한다. DB·JWT·관광공사·카카오 REST 시크릿은 프런트 이미지나 Caddy 컨테이너로 전달하지 않는다. `VITE_KAKAO_JS_KEY`는 Docker Hub 프런트 이미지의 빌드 시점 공개 키이므로 배포 `.env`에는 넣지 않는다.
- Compose는 `APP_AUTH_REFRESH_COOKIE_SECURE=true`를 강제한다. HTTPS 도메인에서만 refresh HttpOnly 쿠키가 전송되게 하므로 운영에서 false로 바꾸지 않는다. 로컬 HTTP Gradle 실행은 기존 기본값(false)을 유지한다.
- 업로드는 Docker named volume `itp-uploads`의 `/app/uploads`에, Caddy TLS 인증서·상태는 `caddy_data`와 `caddy_config`에 보존된다. 업로드는 컨테이너 재생성에는 유지되지만 서버/볼륨 손실·다중 서버에는 안전하지 않다. S3 호환 스토리지 전환 전까지 단일 서버에서만 사용한다.
- 중지: `docker compose down` (업로드를 지우려면 사용자가 명시적으로 `docker compose down -v`를 실행해야 한다.)

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
