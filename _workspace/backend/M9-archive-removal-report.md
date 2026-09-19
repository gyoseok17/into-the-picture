# M9 archive removal backend report

## Changed scope

- Removed archive query parameters from photo and bundle list controllers.
- Removed archive update input and `archivedAt` output fields from photo/bundle DTO contracts.
- Removed archive state mutation and all archive-only rejection/filtering from album and map services.
- Replaced repository methods with no-archive queries, so previously archived rows are returned in normal album reads.
- Removed archived filtering from public comparison reads as well; an old archived flag cannot hide a linked public comparison.
- Removed JPA archive fields and archive/restore methods from record entities.

## Data safety decision

- No Flyway migration was added or changed.
- `photo_record.archived_at` and `photo_record_bundle.archived_at` remain in the database with all existing values untouched.
- They are now legacy, ignored persistence columns rather than active product state.

## API contract

- See `_workspace/api-shapes/M9-photo-record-without-archive.md`.

## Verification

- `backend\\gradlew.bat test`: passed.
- Source/test scan confirms no remaining `archive` or `archived` application references outside the retained database schema/migrations.

## Remaining risk

- A stale client that still sends the removed PATCH `archived` field must be updated alongside this backend version.
- Retained legacy database values are intentionally not reversible through the removed API; the data remains available directly for a future migration decision.
