# M10 Kakao place directions contract

## Persisted identity

- `contest_work.kakao_place_id` stores only the Kakao Local **keyword place-search** document ID selected from the contest's synchronized shooting-location text.
- Address-search results never populate this field because they do not establish a Kakao place identity.
- Missing or failed searches leave the field `null`; no title, coordinate, or generated ID is substituted.
- Existing curated contest coordinates and album map codes are not changed by place-ID backfill.

## Backfill and API

- The data-load flow backfills every contest without a place ID through the existing Kakao REST configuration. External failure is isolated per work and does not abort the batch.
- `GET /api/v1/contests/{id}` adds nullable `kakaoPlaceId`.
- When `kakaoPlaceId` is present, directions use Kakao's documented `/link/to/{placeId}` URL. If absent, the client must not produce a title-based destination URL.
