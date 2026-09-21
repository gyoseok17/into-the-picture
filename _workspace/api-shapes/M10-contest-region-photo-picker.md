# M10 수상작 지역 기반 앨범 선택 API 형태

## 재사용하는 기존 응답

### `GET /api/v1/contests/{contestId}`

수상작 상세 응답에는 프런트 필터 기준이 이미 포함되어 있다.

```json
{
  "id": 63,
  "title": "예시 수상작",
  "mapRegionCode": "JEOLLA",
  "mapCityCode": "YEOSU"
}
```

- `mapRegionCode`: 앨범 지도와 같은 권역 코드.
- `mapCityCode`: 권역 안의 시·군 코드. 없을 수 있다.

### `GET /api/v1/me/photos/bundles`

로그인한 사용자 자신의 앨범 묶음과 legacy 단건 기록을 함께 반환한다. 각 항목과 각 사진은 동일한 지역 코드 필드를 제공한다.

```json
[
  {
    "id": 17,
    "legacy": false,
    "mapRegionCode": "JEOLLA",
    "mapCityCode": "YEOSU",
    "photos": [
      {
        "id": 91,
        "url": "https://...",
        "mapRegionCode": "JEOLLA",
        "mapCityCode": "YEOSU"
      }
    ]
  }
]
```

## 프런트 소비 규칙

1. 수상작과 앨범 기록에 권역·시군 코드가 모두 있으면 두 코드가 같은 기록만 표시한다.
2. 수상작 또는 기록 중 한쪽에 시군 코드가 없으면 권역 코드가 같은 기록까지 표시한다.
3. 수상작의 권역 코드가 없으면 기존처럼 전체 앨범을 표시한다.
4. 대상이 0건이면 이는 정상 빈 결과다. 별도 API 요청이나 오류 처리는 필요 없으며, 프런트가 안내와 새 사진 추가 진입을 표시한다.

## 회귀·권한 경계

- 위 두 엔드포인트의 URL, 요청 파라미터, DTO, 데이터베이스 스키마는 변경하지 않는다.
- `/api/v1/me/photos/bundles`는 `/api/v1/me/**` 보안 규칙 아래에 있어 인증 주체의 기록만 반환한다.
- 수상작 상세는 공개 데이터이며, 지역 필드는 기존 공개 응답의 일부다.
