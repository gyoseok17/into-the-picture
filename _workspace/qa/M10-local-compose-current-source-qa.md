# M10 local Compose current-source build QA

## Scope and expected contract

- The deployment base file (`backend/docker-compose.yml`) remains an immutable-image, HTTPS deployment path.
- The local override (`backend/docker-compose.local.yml`) must make only the `backend` service build the current `backend/` workspace through `backend/Dockerfile` before it is started. The frontend may remain on its published image.
- The local override must retain `AWS_PROFILE=into-the-picture-local` and the read-only host bind mount from the developer's AWS configuration directory to `/home/appuser/.aws`.
- `backend/.env` supplies storage selection, region, bucket, database, JWT, and other application configuration. It must not receive AWS access keys.

## Baseline review (2026-09-20)

Current merged Compose configuration has the expected local AWS profile and read-only `/home/appuser/.aws` bind mount, but its backend service specifies only the published `gyoseok/into-the-picture-backend` image. It therefore cannot run the unbuilt workspace source yet.

`backend/Dockerfile` is suitable as the build boundary: it builds `bootJar` in a Gradle stage, copies only the resulting jar into the JRE stage, and runs as the non-root `appuser` user. `backend/.dockerignore` excludes `.env`, build outputs, uploads, logs, and Gradle caches; the Dockerfile also does not copy an AWS directory. Consequently AWS credentials stay host-mounted at runtime and are not baked into either image stage.

## Required implementation checks

1. Add a backend `build` configuration in `docker-compose.local.yml` with context `.` (the `backend/` directory when commands run there) and the existing `Dockerfile`.
2. Keep AWS credentials solely in the existing `read_only: true` bind mount and retain `AWS_PROFILE=into-the-picture-local`.
3. Avoid publishing, pushing, or reusing the deployment image tag for the local build. A distinct local image tag and/or an explicit build-only pull policy is preferred, so an existing Docker Hub image cannot satisfy a local run instead of rebuilding source.
4. Do not alter the base deployment Compose behavior, exposed ports, or backend runtime user.

## Validation commands

Run from `backend/` after the override is changed:

```powershell
docker compose -f docker-compose.yml -f docker-compose.local.yml config --no-interpolate
docker compose -f docker-compose.yml -f docker-compose.local.yml up --build -d
docker compose -f docker-compose.yml -f docker-compose.local.yml ps
docker compose -f docker-compose.yml -f docker-compose.local.yml logs --tail 100 backend
```

Acceptance evidence:

- the merged config contains `build` for `backend`, `AWS_PROFILE=into-the-picture-local`, and a read-only bind target of `/home/appuser/.aws`;
- the build log executes the Gradle `bootJar` stage from the current workspace;
- the backend becomes running and reports no AWS credential-provider failure when `APP_STORAGE_TYPE=s3`;
- no access-key value appears in Compose output, logs, Dockerfile, image layers, or tracked files.

## Current risk notes

- The fixed host source `/mnt/c/Users/kyo/.aws` is developer-machine-specific. It is acceptable for this local-only ignored override, but another developer must adjust it locally rather than committing credentials or a shared absolute home path.
- A read-only bind prevents writes but not reads by the backend process; retain least-privilege, preferably temporary/SSO credentials in the selected profile.
