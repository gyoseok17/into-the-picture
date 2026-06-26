# 03. 데이터 모델

> **전제(실제 API 확인 후 확정):**
> - **공모전 수상작만 DB에 저장(동기화)** — 전체 95건으로 작고 거의 안 변하며 필터(계절·등급)가 많기 때문. 저장 시 텍스트를 파싱해 정리.
> - **관광사진·집중률은 실시간 호출**(저장 안 함). 집중률은 장소가 매칭될 때만 표시.
> - 따라서 우리 DB = 우리 데이터(회원·업로드 사진·즐겨찾기) + **공모전 수상작 캐시(ContestWork)**.
> - 설계 원칙: 확장에 열려 있게 — 콘텐츠 종류가 늘어도 테이블을 늘리지 않는다.

## 엔티티 개요 (ERD)

```
        ┌──────────────┐                 ┌──────────────────┐
        │     User     │                 │   ContestWork    │
        │  (회원)       │                 │ (공모전 수상작 캐시)│
        └──────┬───────┘                 └──────────────────┘
               │ 1                        외부 API에서 배치 동기화
       ┌───────┼────────────┐            Favorite(CONTEST)가 참조
     N │                  N │
┌──────▼──────┐     ┌───────▼────────┐
│  UserPhoto  │     │   Favorite     │
│ (업로드 사진) │     │  (즐겨찾기)      │
└─────────────┘     └────────────────┘
                    targetType+source+externalId 로
                    수상작(로컬)·관광사진(외부)·관광지를 참조
```

관광사진·집중률은 엔티티가 아니라 **DTO**로만 존재한다 (어댑터가 반환). → 06 참고.

## 공통 베이스

모든 엔티티는 생성/수정 시각을 공통으로 가진다 (JPA Auditing).

```
BaseTimeEntity
  - createdAt : datetime (자동)
  - updatedAt : datetime (자동)
```

## 엔티티 상세

### User — 회원

| 필드 | 타입 | 제약 | 설명 |
|------|------|------|------|
| id | BIGINT | PK, auto | 내부 식별자 |
| kakaoId | BIGINT | UNIQUE, NOT NULL | 카카오 고유 회원번호 |
| nickname | VARCHAR(50) | NOT NULL | 표시 이름 |
| profileImageUrl | VARCHAR(500) | NULL | 카카오 프로필 이미지 |
| email | VARCHAR(255) | NULL | 동의 시 제공 |
| role | ENUM(USER, ADMIN) | NOT NULL, default USER | 권한 |
| (createdAt, updatedAt) | | | BaseTimeEntity |

- 카카오 로그인만 사용 → 비밀번호 컬럼 없음.
- `role` enum → 관리자 기능 확장 대비.

### UserPhoto — 업로드 사진 (포토 비교용)

| 필드 | 타입 | 제약 | 설명 |
|------|------|------|------|
| id | BIGINT | PK, auto | |
| user | FK → User | NOT NULL | 소유자 |
| storageKey | VARCHAR(500) | NOT NULL | 스토리지 내부 키/경로 |
| url | VARCHAR(500) | NOT NULL | 조회용 URL |
| originalFilename | VARCHAR(255) | NULL | 원본 파일명 |
| contentType | VARCHAR(100) | NULL | image/jpeg 등 |
| fileSize | BIGINT | NULL | 바이트 |
| takenAt | DATETIME | NULL | 촬영일(EXIF, 있으면) |
| memo | VARCHAR(500) | NULL | 사용자 메모 |
| (createdAt, updatedAt) | | | |

- 실제 이미지 파일은 스토리지(로컬/클라우드)에 저장, DB엔 위치·메타만(07 참고).
- `storageKey`/`url` 분리 → 스토리지 종류 바뀌어도(로컬→S3) DB 구조 유지.

### Favorite — 즐겨찾기 (외부 항목 참조)

| 필드 | 타입 | 제약 | 설명 |
|------|------|------|------|
| id | BIGINT | PK, auto | |
| user | FK → User | NOT NULL | 소유자 |
| targetType | ENUM | NOT NULL | PHOTO / CONTEST / ATTRACTION ... |
| source | ENUM | NOT NULL | 출처 외부 API (TOUR_PHOTO / CONTEST / KAKAO ...) |
| externalId | VARCHAR(255) | NOT NULL | 외부 항목 식별자(contentId 등) |
| snapshotTitle | VARCHAR(255) | NULL | 목록 표시용 캐시 |
| snapshotImageUrl | VARCHAR(500) | NULL | 목록 표시용 캐시 |
| (createdAt) | | | |

- **UNIQUE (user, targetType, externalId)** — 중복 즐겨찾기 방지.
- **확장 포인트:** 새 콘텐츠 종류(영상·행사 등) 추가 시 `targetType`/`source` **enum 값만 추가** — 테이블·스키마 불변.
- `snapshot*` 필드: 외부 데이터를 실시간 호출하므로, 즐겨찾기 *목록*을 보여줄 때 외부 API를 N번 호출하지 않도록 **표시에 필요한 최소 정보만 스냅샷**. 상세는 클릭 시 externalId로 실시간 조회.

### ContestWork — 공모전 수상작 (동기화 저장)

> 외부 `PhokoAwrdService` 응답을 우리 DB에 적재. **원문 + 파싱값을 함께 저장**한다(파싱 로직이 바뀌어도 원문 보존 → 재파싱 가능, 확장성).

| 필드 | 타입 | 출처/설명 |
|------|------|----------|
| id | BIGINT | PK |
| contentId | VARCHAR(50) | UNIQUE, 외부 식별자(`contentId`) |
| title / titleEn | VARCHAR(255) | `koTitle` / `enTitle` |
| location / locationEn | VARCHAR(255) | `koFilmst` / `enFilmst` (촬영지 텍스트) |
| sidoCode | VARCHAR(10) | `lDongRegnCd` (법정동 시도 코드) |
| sido / sigungu | VARCHAR(50) | **파싱**: location에서 시도·시군구 추출 (집중률 매칭·필터용) |
| photographer / photographerEn | VARCHAR(100) | `koCmanNm` / `enCmanNm` |
| filmMonth | VARCHAR(6) | `filmDay` (YYYYMM) |
| awardRaw | VARCHAR(100) | `koWnprzDiz` 원문 (`스마트폰 부문 [입선]`) |
| awardDivision / awardGrade | VARCHAR(50) | **파싱**: 부문 / 등급 (필터용) |
| keywordsRaw | TEXT | `koKeyWord` 원문(콤마 구분) |
| season | VARCHAR(20) | **파싱**: 키워드에서 계절 추출 (없으면 null) |
| orgImageUrl / thumbImageUrl | VARCHAR(500) | `orgImage` / `thumbImage` |
| copyrightCode | VARCHAR(20) | `cpyrhtDivCd` (공공누리 유형) |
| lat / lng | DOUBLE | **카카오 지오코딩 결과**(나중에 채움, null 허용) |
| crowdAttractionName | VARCHAR(100) | 집중률 관광지명과 매칭 성공 시 저장(없으면 null) |
| externalRegDt / externalMdfcnDt | DATETIME | `regDt` / `mdfcnDt` |
| syncedAt | DATETIME | 우리가 동기화한 시각 |

- 인덱스: `season`, `awardGrade`, `sigungu` (필터/매칭 조회).
- 동기화: 배치(`ContestSyncJob`)가 `phokoAwrdSyncList`로 적재·갱신. 도메인은 `ContestProvider` 인터페이스에만 의존 → 나중에 소스 바꿔도 도메인 불변.
- `lat/lng`, `crowdAttractionName`은 **나중에 채워지는 보강 필드** — 카카오 키/코드표 확보 후 보강 배치로 갱신.

## 확장 대비 (지금 만들지 않음, 자리만 비워둠)

| 후보 엔티티 | 용도 | 추가 시점 |
|------------|------|----------|
| PhotoComparison | 비교 세션 저장(내 사진 ↔ 수상작 쌍) | 비교 기록 보관 요구 생기면 |
| SearchHistory | 검색 기록/개인화 | 추천 고도화 시 |
| 외부데이터 캐시 테이블 | 실시간→캐시 전환 시 | 쿼터/속도 문제 발생 시 (어댑터 구현만 교체) |

위 후보들은 모두 **기존 엔티티 수정 없이 신규 추가**로 가능하도록 관계를 느슨하게(외래키 최소) 설계했다.

## Flyway 마이그레이션 방침

- `V1__init.sql` : User, UserPhoto, Favorite, ContestWork + enum 제약 + 인덱스
- 이후 변경은 `V2__...`, `V3__...` 로 누적 (기존 마이그레이션 수정 금지 → 확장만)
- 보강 필드(ContestWork.lat/lng, crowdAttractionName)는 V1에 컬럼만 두고 값은 배치로 채움
