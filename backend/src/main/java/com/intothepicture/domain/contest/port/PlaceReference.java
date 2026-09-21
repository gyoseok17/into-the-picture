package com.intothepicture.domain.contest.port;

/** A provider-owned stable place identity with its returned coordinate. */
public record PlaceReference(String placeId, double lat, double lng) {
}
