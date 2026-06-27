---
name: spring-backend
description: "Into the Picture Spring Boot 백엔드 구현 규약 — 레이어드 아키텍처(controller/service/repository), JPA 엔티티·DTO 분리, 공통 응답/페이지네이션·에러 포맷, 예외 처리, Flyway, 카카오 OAuth+JWT 인증. 백엔드 엔티티·서비스·컨트롤러·인증·마이그레이션을 작성하거나 수정할 때 반드시 사용."
---

# Spring Backend 구현 규약

Into the Picture 백엔드를 일관되게 구현하기 위한 절차. 스펙(무엇)은 `docs/03·04·05·07`, 이 스킬은 방법(어떻게)이다.

## 패키지 구조 — 도메인별

```
com.intothepicture
├── domain
│   ├── user / userphoto / favorite / contest / crowd / photo
│   │   ├── controller   (REST, DTO 변환만)
│   │   ├── service      (비즈니스 로직)
│   │   ├── repository   (JpaRepository)
│   │   ├── entity       (JPA 엔티티)
│   │   └── dto          (request/response)
├── external             (Provider 인터페이스 — 구현은 external-integration-engineer)
├── global
│   ├── config           (Security, Web, Cache)
│   ├── exception        (GlobalExceptionHandler, ErrorCode)
│   ├── response         (PageResponse 등 공통 응답)
│   └── auth             (JWT, SecurityFilter)
```

도메인 간 직접 의존 대신 서비스 인터페이스로 호출한다. 도메인을 패키지로 분리해야 변경 영향이 격리된다.

## 엔티티 규약
- 공통 시각은 `BaseTimeEntity`(@MappedSuperclass + JPA Auditing)를 상속한다 — created/updated 중복 제거.
- 코드값은 **enum**으로 (role, targetType, source). 새 종류는 enum 값 추가로 확장(테이블 불변).
- 연관관계는 **최소화**하고 지연 로딩(LAZY) 기본. 불필요한 양방향 매핑 금지 — 결합도를 낮춰야 확장이 싸다.
- 필드/제약은 `docs/03`을 그대로 따른다. 추측 금지.

## DTO 규약 — 분리가 핵심
- **엔티티를 컨트롤러 밖으로 노출하지 않는다.** Request DTO / Response DTO를 둔다.
- 외부 API DTO(galWebImageUrl 등)를 응답에 그대로 쓰지 않는다 — `docs/04`의 내부 응답 shape로 변환. 외부 변경이 프론트로 전파되면 안 되기 때문.
- 변환은 정적 팩토리(`PhotoResponse.from(dto)`)로.

## 컨트롤러·응답 규약
- 경로·메서드·응답 shape는 `docs/04`를 **정확히** 따른다 (QA가 프론트 훅과 대조한다).
- 목록은 공통 래퍼 `PageResponse<T> { content, page{page,size,totalCount,hasNext} }`. 단건은 객체 직접 반환.
- 필드는 camelCase. snake_case 혼용 금지(경계면 버그 원인).

## 예외 처리
- `@RestControllerAdvice` GlobalExceptionHandler 하나로 통일.
- 에러 응답은 `docs/04` 포맷: `{ "error": { "code", "message" } }` + 적절한 HTTP 상태(400/401/403/404/429/502).
- `ErrorCode` enum으로 코드·메시지·상태 관리. 비즈니스 예외는 커스텀 예외 던지고 핸들러에서 매핑.

## 외부 데이터 의존
- 외부(관광사진·공모전·집중률·지오코딩)는 `external` 패키지의 **Provider 인터페이스**로만 호출한다. 직접 HTTP 호출 금지.
- 인터페이스 시그니처·반환 DTO는 external-integration-engineer와 합의(`_workspace/`에 게시된 계약 사용).

## Flyway
- `src/main/resources/db/migration/V1__init.sql`에 User·UserPhoto·Favorite·ContestWork + enum 제약 + 인덱스(season·awardGrade·sigungu).
- 이후 변경은 `V2__`, `V3__`로 누적. **기존 마이그레이션 수정 금지** (확장만).
- 보강 컬럼(ContestWork.lat/lng, crowdAttractionName)은 nullable로 두고 값은 배치로 채운다.

## 인증
- 카카오 OAuth → 자체 JWT, Spring Security stateless. 상세 구현은 `references/kakao-auth.md` 참조.

## 테스트
- 서비스 단위 테스트 + 컨트롤러 통합 테스트(외부 Provider는 목). 응답 shape를 검증에 포함해 QA 경계검증을 보조한다.

## 산출물
- `backend/` 코드 + `_workspace/`에 **엔드포인트별 실제 응답 shape**를 기록(QA·프론트 대조용).
