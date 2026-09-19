# M9 Photo record API without archive

## Unchanged routes

- `GET /api/v1/me/photos`
- `GET /api/v1/me/photos/bundles`
- `PATCH /api/v1/me/photos/{photoId}`

## Removed request and response contract

- `GET /me/photos` and `GET /me/photos/bundles` no longer accept the `archived` query parameter.
- `PATCH /me/photos/{photoId}` no longer accepts `archived` as an update field.
- `UserPhotoDto` and `PhotoRecordBundleDto` no longer contain `archivedAt`.

## Read behavior

- Both album endpoints return every owned record/bundle without an archive filter.
- Map views and public comparison reads use the same no-archive filtering rule.
- V17 removes the database `archived_at` columns and their existing values. The schema no longer has an archive state.

## Client impact

- Clients must remove archive filters, archive/restore PATCH values, and `archivedAt` response parsing.
- Authorization, photo URLs, comparison links, and all non-archive fields keep their previous shape.
