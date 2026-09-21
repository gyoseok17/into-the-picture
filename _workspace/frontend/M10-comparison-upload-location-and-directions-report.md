# M10 Comparison Upload Location and Directions Report

- Date: 2026-09-21
- Scope: frontend comparison photo selection, upload location, and contest directions.

## Implemented flow

1. When the comparison picker has no photos for the contest's mapped region,
   its `사진 추가` action closes the picker and opens the album upload sheet.
2. The upload sheet receives the contest `mapRegionCode` and `mapCityCode` as
   its initial location. On successful upload, the comparison picker reopens
   for the same contest; cancellation leaves it closed, so an empty picker is
   never reopened immediately.
3. Direct single-photo uploads retain their existing request shape. The backend
   persists a contest's approved map codes when a previously unlocated photo is
   attached to a comparison; existing user-owned locations are not overwritten.
4. Contest directions use nullable `ContestDetail.directionDestination`, the
   synchronized shooting-place text. If it is absent, `ContestMap` does not
   render a Kakao directions link even when coordinates exist.

## Contract alignment

- `_workspace/contracts/M10-comparison-upload-location-and-directions.md`
- `_workspace/contracts/M10-comparison-location-and-directions.md`
- `ContestDetail.directionDestination`, `mapRegionCode`, and `mapCityCode`.

## Verification

`frontend npm run build` passed on 2026-09-21. Vite reports the pre-existing
production chunk-size warning (largest initial JS chunk: about 822 kB); it is
not a type or build failure.

## Remaining manual checks

- In Kakao Developers, add the local host/domain used by the local frontend to
  the allowed JavaScript SDK domains; otherwise the map SDK can be blocked in
  local browser testing. No external console configuration was changed here.
- Verify in a browser: empty region -> `사진 추가` -> upload with prefilled
  location -> picker resumes with the new photo; blank contest location -> no
  directions button.
