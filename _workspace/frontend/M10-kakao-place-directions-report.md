# M10 Kakao Place Directions Report

- Date: 2026-09-21
- Scope: consume verified Kakao place IDs on the contest-detail map.

## Implemented behavior

- `ContestDetail` consumes nullable `kakaoPlaceId`.
- When it is non-blank, the directions button opens Kakao's documented
  `https://map.kakao.com/link/to/{placeId}` URL.
- When absent, the directions button is hidden; no title, coordinate, or
  generated destination fallback is used. The map placeholder behavior is
  unchanged.

## Source validation

Kakao's official Web API guide documents the place-ID form of `/link/to`; the
place-search API returns that ID. The application intentionally consumes only
the server's verified keyword-place ID rather than constructing an identifier
from client input, names, or coordinates.

## Contract

`_workspace/contracts/M10-kakao-place-directions.md`

## Verification

Run `npm run build` from `frontend/` after the backend's `kakaoPlaceId` DTO
change is present in the shared working tree.
