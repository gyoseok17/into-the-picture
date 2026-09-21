# M10 backend/external — Kakao place directions

## Configuration investigation

- The existing `external.kakao` configuration binds its REST key from `KAKAO_REST_KEY`; `KakaoLocalClient` already sends it only in the `KakaoAK` authorization header.
- No credential value was read, printed, or added to source control.
- The existing opt-in `external.dataload.enabled=true` runner is the suitable bulk-enrichment boundary: it already performs sync and geocoding outside normal application startup.

## Implementation

- Flyway V18 adds nullable `contest_work.kakao_place_id` and a partial index for unresolved rows.
- `KakaoLocalClient` now retains the keyword-search document `id` alongside result coordinates.
- `KakaoGeocodingAdapter` also implements the contest-owned `PlaceSearchProvider`. Stable IDs are returned only from keyword search; address fallback stays coordinate-only.
- `KakaoPlaceBackfillJob` processes every contest work with a null ID and persists only successful provider IDs. It does not modify curated coordinates or region codes. The opt-in data-load runner invokes it after geocoding.
- `ContestDetailDto` adds nullable `kakaoPlaceId` for the frontend's Kakao `/link/to/{placeId}` directions URL.

## Failure behavior

- Blank locations, no keyword result, unavailable credentials, quota failures, and external failures keep the ID null and do not abort the backfill batch.
- Failed rows remain eligible on a later opt-in data load; no artificial ID or title fallback is stored.

## Verification

- `./gradlew test --tests "com.intothepicture.external.kakao.KakaoGeocodingAdapterTest" --tests "com.intothepicture.external.contest.sync.KakaoPlaceBackfillJobTest" --tests "com.intothepicture.domain.contest.controller.ContestControllerTest"` passed.
- Full backend `./gradlew test` passed.
- The tests cover keyword-ID selection, rejection of address fallback as an identity, null-result handling, persistence only for resolved work, and API JSON shape.

## Operational follow-up

- Apply V18 and run the existing opt-in data-load flow with the deployed Kakao REST configuration to populate existing rows. This task deliberately does not make external network calls or inspect credentials.
