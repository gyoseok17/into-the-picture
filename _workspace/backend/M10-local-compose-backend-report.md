# M10 Local Compose Report

- Date: 2026-09-20
- Scope: local Docker Compose image selection only.

## Decision

`backend/docker-compose.local.yml` overrides the deployment images with local
builds:

```yaml
frontend:
  build:
    context: ../frontend
    dockerfile: Dockerfile
    args:
      VITE_API_BASE: ${VITE_API_BASE:-/api/v1}
      VITE_KAKAO_JS_KEY: ${VITE_KAKAO_JS_KEY:?...}
  image: into-the-picture-frontend:local
backend:
  build:
    context: .
    dockerfile: Dockerfile
  image: into-the-picture-backend:local
```

The existing local AWS behavior remains unchanged:

- `AWS_PROFILE=into-the-picture-local`
- read-only bind mount from `/mnt/c/Users/kyo/.aws` to
  `/home/appuser/.aws`

The existing Dockerfiles already build the Gradle boot jar and Vite bundle from
their respective current checkouts. The frontend receives browser-visible Vite
values as build arguments; its runtime `APP_DOMAIN` behavior remains in the base
Compose configuration. No Dockerfile change is required.

## Local command

Run from `backend/`:

```powershell
docker compose -f docker-compose.yml -f docker-compose.local.yml up --build
```

Use `-d` to run detached. `--build` rebuilds both images from the current
working-tree source before starting the services.

## Verification

Validate the merged Compose model without starting services:

```powershell
docker compose -f docker-compose.yml -f docker-compose.local.yml config
```

Expected frontend properties: build context `../frontend`, image
`into-the-picture-frontend:local`, and Vite build arguments. Expected backend
properties: build context `.`, image `into-the-picture-backend:local`, profile
`into-the-picture-local`, and the read-only AWS credentials mount.

## Risk / rollback

This override is local-only and does not change the deployment Compose file.
Omit `docker-compose.local.yml` to return to the published deployment image.
