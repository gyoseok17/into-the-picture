package com.intothepicture.domain.contest.port;

import java.util.Optional;

/** Resolves a shooting-location text to a stable provider place identity. */
public interface PlaceSearchProvider {

    Optional<PlaceReference> findPlace(String locationText);
}
