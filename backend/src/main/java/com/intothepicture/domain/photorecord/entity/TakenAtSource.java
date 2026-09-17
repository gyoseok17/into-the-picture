package com.intothepicture.domain.photorecord.entity;

/** How a newly stored photo record obtained its individual taken-at value. */
public enum TakenAtSource {
    EXIF,
    MANUAL,
    BUNDLE_START_FALLBACK,
    UNKNOWN
}
