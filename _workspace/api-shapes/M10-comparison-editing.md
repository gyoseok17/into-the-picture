# M10 비교 결과 수정 API 형상

## 공통

- 모든 경로는 로그인한 사용자의 소유 `PhotoRecord`만 대상으로 한다. 소유하지 않았거나 비교 연결이 없는 `{id}`는 `404 NOT_FOUND`다.
- 비교 대상 사진은 현재 사용자 소유여야 하며, 이미 다른 수상작과 연결된 사진은 `409 CONFLICT`다.
- 한 사용자의 한 수상작에는 현재 수정 대상 외 다른 연결 기록이 있으면 사진 변경을 `409 CONFLICT`로 거절한다.
- 크롭 값은 파일 자체를 바꾸지 않는 표시 메타데이터다.

## 사진 변경

`PATCH /api/v1/me/comparisons/{id}`

```json
{
  "userPhotoId": 123,
  "crop": {
    "aspectRatio": 1.5,
    "zoom": 1.2,
    "offsetX": 0.1,
    "offsetY": -0.2
  }
}
```

- `userPhotoId`는 필수다. 누락 시 `400 INVALID_REQUEST`.
- `crop`을 보내면 범위를 검증해 새 사진에 적용한다.
- 이전 사진은 수상작 연결만 해제하고 앨범 기록과 파일은 유지한다.
- 새 사진은 수상작 연결·기존 공개 상태를 이어받는다.
- `crop`을 생략한 기존 호환 호출은 수상작 비율만 유지하고 확대·위치를 기본값으로 초기화한다.

## 크롭 변경

`PATCH /api/v1/me/comparisons/{id}/crop`

```json
{
  "crop": {
    "aspectRatio": 1.5,
    "zoom": 1.2,
    "offsetX": 0.1,
    "offsetY": -0.2
  }
}
```

- `crop`은 필수다. 누락 시 `400 INVALID_REQUEST`.
- `aspectRatio`: 0.25 이상 4 이하, `zoom`: 1 이상 4 이하, `offsetX`/`offsetY`: -1 이상 1 이하의 유한한 수만 허용한다.
- 성공 시 변경된 `ComparisonDto`를 반환한다.

## 삭제

- `DELETE /api/v1/me/comparisons/{id}?deletePhoto=false`: 수상작 연결만 해제한다.
- `DELETE /api/v1/me/comparisons/{id}?deletePhoto=true`: 앨범 기록과 원본 파일까지 삭제한다.
