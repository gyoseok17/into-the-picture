# M10 Kakao place directions API shape

## `GET /api/v1/contests/{id}`

```json
{
  "id": 63,
  "location": "경상남도 합천군, 가야산국립공원",
  "kakaoPlaceId": "18577297",
  "lat": 35.8043935,
  "lng": 128.1083354
}
```

- `kakaoPlaceId` is a nullable string because it is the opaque Kakao Local keyword-place document ID.
- It is not derived from title, coordinates, address search, or album map codes.
- When non-null, Kakao directions use `https://map.kakao.com/link/to/{kakaoPlaceId}`. When null, no directions link is emitted.
