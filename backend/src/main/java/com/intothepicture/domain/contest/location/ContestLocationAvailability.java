package com.intothepicture.domain.contest.location;

import java.util.Set;

/** Curated exceptions where a contest work must not be represented by a guessed map location. */
public final class ContestLocationAvailability {

    private static final Set<Long> PLACELESS_CONTEST_IDS = Set.of(80L);

    private ContestLocationAvailability() {
    }

    public static boolean hasNoReliableLocation(Long contestId) {
        return PLACELESS_CONTEST_IDS.contains(contestId);
    }
}
