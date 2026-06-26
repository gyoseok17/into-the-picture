# 07. 사진 저장 (사용자 업로드)

> 포토 비교용 **사용자 업로드 사진**의 저장 전략. 외부 관광사진/수상작 이미지는 외부 URL을 그대로 쓰므로 여기 대상 아님.

## 추상화 (확장성 핵심)

저장소를 인터페이스로 격리해, **개발=로컬 / 운영=클라우드**를 설정만으로 전환한다.

```
[업로드 서비스] → FileStorage (인터페이스)
                     ├─ LocalFileStorage   (개발: 서버 디스크)   ← 지금
                     └─ S3FileStorage      (운영: S3 호환 스토리지)
```

`FileStorage`:
- `store(InputStream, meta) -> storageKey`
- `url(storageKey) -> 조회 URL`
- `delete(storageKey)`

DB(`UserPhoto`)에는 `storageKey`(내부 키)와 `url`(조회용)을 분리 저장(03) → 구현체가 바뀌어도 엔티티 불변.

## 개발 (LocalFileStorage)

- 저장 경로: 설정값 `app.storage.local-dir`(예: `./uploads`), git 제외.
- `storageKey` = `u/{userId}/{uuid}.{ext}` (사용자별 폴더 + 랜덤 파일명).
- 조회: 정적 제공 엔드포인트(`GET /files/{key}`) 또는 컨트롤러 스트리밍.

## 운영 (S3FileStorage)

- S3 호환(AWS S3 / Cloudflare R2 / 네이버 오브젝트스토리지).
- `storageKey` = 오브젝트 키, `url` = CDN URL 또는 (비공개 시)presigned URL.
- 전환은 `app.storage.type=s3` + 자격증명 환경변수만 (코드 변경 없음).

## 업로드 처리 파이프라인

`POST /api/v1/me/photos` (multipart) 처리 순서:

1. **인증 확인** (🔒, 본인만 업로드).
2. **검증 (보안 — 10-future E1 초기부터 적용):**
   - 크기 제한(예: 10MB)
   - **매직바이트로 실제 이미지 여부 확인** (확장자만 믿지 않음)
   - 허용 타입: jpeg/png/webp/heic
3. **정규화/안전화:** 이미지 **재인코딩**(악성 페이로드 제거) + EXIF의 `takenAt`만 추출 후 위치정보 등 민감 EXIF 제거.
4. **저장:** `FileStorage.store()` → `storageKey`, `url` 확보.
5. **DB 기록:** `UserPhoto` 저장 → `UserPhotoDto` 반환(04).

## 향후 (10-future)

- **썸네일/WebP 변환·CDN** (C1) — 피드 성능.
- 비교 세션 저장 시 업로드 사진 ↔ 수상작 매핑 보관 (B1).
- 용량 쿼터(사용자당 N장/MB) — 남용 방지.

## 메모

- 비교 화면 자체는 프론트 렌더(내 사진 + 수상작 나란히) — 저장 외 별도 백엔드 불필요.
- 삭제 시 DB 레코드 + 스토리지 객체 함께 제거(`FileStorage.delete`).
