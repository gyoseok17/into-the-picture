# M10 backend — comparison location and directions

## Changed scope

- `PhotoRecord.attachContest` now copies the linked contest's curated album map codes only when the photo record has no map region code. The same entity path is used for first attachment and replacement.
- The existing `ContestDetailDto.location` is the synchronized shooting-place source for directions; no DTO or database change is required.

## Design decisions

- The upload endpoint remains generic and does not accept a contest id. The durable point at which a new comparison photo and its contest are both known is `attachContest`; that is where the empty location is completed.
- Existing user-selected record codes are preserved. No inferred address, title, coordinate reverse-geocode, or database migration is used.
- A missing source shooting location must not become an invented title-based navigation target; the frontend hides that link.

## Verification

- `./gradlew test --tests "com.intothepicture.domain.comparison.service.PhotoComparisonServiceTest" --tests "com.intothepicture.domain.contest.controller.ContestControllerTest"` passed.
- Added test coverage for inheriting only an empty photo-record location.

## API impact

- No API or database schema change. Comparison request shapes are unchanged; their returned nested photo location reflects the persisted inheritance when applicable.

## Remaining integration

- Frontend passes the existing `detail.location` to the Kakao directions URL and hides navigation when the source value is blank; it must not fall back to the contest title.
