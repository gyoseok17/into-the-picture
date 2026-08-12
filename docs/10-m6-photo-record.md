# 10. M6 사진 놓기와 개인 사진 기록

> M6 완료 시점(2026-08-12)의 구현 기준 문서다. 이전의 사진 비교 계획 문구와 충돌할 경우 이 문서를 우선한다.

## 데이터 구조

```
User 1 ── N UserPhoto 1 ── N PhotoRecord N ── 0..1 ContestWork
                         └── (향후) PhotoPost ── N PhotoLike
```

- `UserPhoto`: 실제 업로드 파일. `storageKey`, 원본 파일명, MIME 타입, 크기만 보관한다.
- `PhotoRecord`: 사진첩의 한 기록. 촬영 시각·장소·메모·보관 상태·표시 방식과 선택적인 수상작 연결을 가진다.
- 하나의 원본 파일은 기존 데이터 호환을 위해 여러 기록이 참조할 수 있다. 원본 파일은 참조하는 기록이 없어질 때만 삭제한다.
- 수상작을 연결한 기록은 `WITH_CONTEST`, 해제한 기록은 `PHOTO_ONLY` 상태다.

## API와 동작

모든 경로는 `/api/v1` 기준이며 인증이 필요하다.

| 메서드 | 경로 | 동작 |
| --- | --- | --- |
| POST | `/me/photos` | JPEG·PNG·WebP(10MB 이하) 업로드 후 사진 기록 생성 |
| GET | `/me/photos` | 내 사진첩 기록 목록 조회 |
| GET | `/me/photos/{recordId}/file` | 소유자만 원본 파일 조회 |
| DELETE | `/me/photos/{recordId}` | 수상작 연결이 없는 기록과 필요 시 원본 파일 삭제 |
| GET | `/me/comparisons` | 수상작 연결 기록 목록 조회 |
| POST | `/me/comparisons` | 사진 기록과 수상작 연결 |
| PATCH | `/me/comparisons/{recordId}` | 다른 사진 기록으로 교체 |
| DELETE | `/me/comparisons/{recordId}?deletePhoto=false` | 수상작 연결만 해제 |
| DELETE | `/me/comparisons/{recordId}?deletePhoto=true` | 기록과 원본 파일 함께 삭제 |

## 파일 접근 정책

- `/files/**`는 차단한다. 원본 파일을 정적으로 공개하지 않는다.
- API는 사진 기록의 소유자와 로그인 사용자가 같을 때만 파일을 반환한다.
- 프런트는 Bearer access token으로 파일을 blob으로 받아 표시한다. `<img>` 태그가 직접 공개 URL을 요청하지 않는다.
- 향후 공유는 공개 여부를 가진 게시물 모델을 별도로 두고, 공개 정책 또는 만료형 서명 URL을 추가한다.

## 화면 흐름

1. `사진 놓기`에서 즐겨찾기한 수상작과 내 사진을 고른다.
2. 내 사진은 앨범에서 선택하거나 새로 업로드한다. 업로드 직후 미리보기를 제공한다.
3. 저장한 결과를 열고 `수정`을 누르면 현재 사진이 보이는 별도 창이 열린다.
4. `사진 변경`은 앨범 또는 새 업로드 사진으로 교체한다. 이전 사진은 사진첩에 남는다.
5. `삭제`는 결과만 지울지, 사진까지 지울지 한 번 더 선택한다.
6. 변경·삭제·업로드 실패는 수정 창 안에서 안내한다.

## 검증 기준

- 프런트: `npm run build`
- 백엔드: `./gradlew.bat test`
- 비로그인 파일 API 요청은 401, 예전 `/files/**` 경로도 차단
