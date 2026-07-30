# M1 external 실데이터 적재 결과 (external 기록)

> 실행: 2026-06-28, external. DataLoadRunner(sync→geocode→crowd-match) 1회. 실측 수치.
> 환경: Docker 데몬 미기동 → 네이티브 MySQL 8.0.43(localhost:3306)에 격리 DB `into_the_picture` 생성 후 적재.
> (앱은 root 로 1회 실행 — env override DB_USERNAME/DB_PASSWORD. 커밋된 application-local.yml·docker-compose 무변경.)

## 적재 수치
| 항목 | 결과 |
|------|------|
| 공모전 sync | fetched 95 / inserted 95 / skipped 0 |
| 지오코딩(lat/lng) | **95/95 (100%)** |
| 집중률 매칭(crowdAttractionName) | **61/95 (64%)** |
| 시도/시군구 파싱 | 95/95 |
| 계절 파싱 | 52/95 (null 43 — 계절 미상은 정상) |
| external_reg_dt/mdfcn_dt 변환 | 95/95 |

분포(실측): 부문 디지털카메라45·스마트폰27·드론23 / 등급 입선85·금상3·동상3·은상3·대상1 / 계절 봄19·겨울17·가을12·여름4.
집중률 미매칭 34건은 graceful(해당 작품 `/crowd` 204) — docs/06 X3(사진↔집중률 직접키 없음) 범위.

## 검증 포인트
- DB Korean 정상(utf8mb4, 이중인코딩 없음). 매칭 예: 가야산 설경(합천군)→가야산국립공원(홍류동,청량동지구), 대왕암 일출(울산 동구)→대왕암공원.
- 좌표 예: 가야산 (35.80,128.11), 겨울왕국/무주 (35.87,127.74).

## 재현 방법
```
# 1) MySQL(into_the_picture) 준비: docker compose -f backend/docker-compose.yml up -d  (또는 기존 MySQL에 DB 생성)
# 2) 키를 환경변수로 주입 후 적재 러너 실행
DATA_GO_KR_KEY=... KAKAO_REST_KEY=... ./gradlew bootRun --args='--external.dataload.enabled=true'
```
`external.dataload.enabled` 미설정 시 러너 비활성(일반 부팅/테스트 무영향).

## 정리(cleanup)
이 PC 네이티브 MySQL에 `into_the_picture` DB가 남아 있음(프로젝트 실데이터). 불필요 시 `DROP DATABASE into_the_picture;`. 타 프로젝트 DB(orderapp/shop/auth) 무손상.

## DB 전환: MySQL → Supabase(PostgreSQL) — 2026-07-30
> 위 적재(6/28)는 로컬 MySQL 기준. 이후 DB를 Supabase(PostgreSQL 17.6)로 전환하고 재적재.
- 코드 전환: `build.gradle`(드라이버 postgresql·flyway-database-postgresql), `application-local.yml`(jdbc:postgresql·org.postgresql.Driver), `V1__init.sql`(IDENTITY·TIMESTAMP·DOUBLE PRECISION, ENGINE/CHARSET 제거).
- 접속: **Session pooler(IPv4)** 사용. Direct 호스트(`db.<ref>.supabase.co`)는 IPv6 전용이라 IPv4 환경에서 불가 → `aws-0-<region>.pooler.supabase.com:5432`, user `postgres.<ref>`. `.env`의 DB_HOST/DB_USERNAME/DB_PASSWORD로 주입(커밋 금지).
- 재적재 실측: sync 95/95, 지오코딩 95/95(100%), 집중률 매칭 **59/95(62%)** — 6/28의 61건과 2건 차이는 외부 집중률 API 시점 변동(정상).
- 재현: `.env`에 Supabase pooler 접속정보 세팅 후 `./gradlew bootRun --args='--external.dataload.enabled=true'`.
