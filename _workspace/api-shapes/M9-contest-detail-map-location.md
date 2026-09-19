# M9 수상작 상세 지도 위치 API 형태

## `GET /api/v1/contests/{id}` 추가 응답 필드

```json
{
  "id": 63,
  "title": "영취산의 봄",
  "location": "전남광주통합특별시 여수시 중흥동, 영취산",
  "lat": 34.8205286,
  "lng": 127.7167708,
  "mapRegionCode": "JEOLLA",
  "mapCityCode": "YEOSU"
}
```

- `mapRegionCode`, `mapCityCode`는 앨범 `MapLocationCatalog`와 동일한 검증된 내부 코드다.
- 기존 상세 필드는 변경하지 않고 위 두 읽기 전용 필드만 추가한다.
- 과거·신규 DB 모두 sync 경계의 정적 보정표를 거치므로, 외부 주소 문자열을 프런트에서 해석할 필요가 없다.
