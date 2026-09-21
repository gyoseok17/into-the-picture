package com.intothepicture.domain.photorecord.location;

import com.intothepicture.global.exception.BusinessException;
import com.intothepicture.global.exception.ErrorCode;
import org.springframework.stereotype.Component;

/**
 * The single write boundary for album-map location input.
 *
 * <p>It keeps transport-facing blank/length validation separate from the catalog's
 * canonical-code and region/city membership validation. Every write path receives
 * the same canonical {@link MapLocationCatalog.MapLocation} result.</p>
 */
@Component
public class MapLocationInputResolver {
    private static final int REGION_CODE_MAX_LENGTH = 32;
    private static final int CITY_CODE_MAX_LENGTH = 48;

    private final MapLocationCatalog catalog;

    public MapLocationInputResolver(MapLocationCatalog catalog) {
        this.catalog = catalog;
    }

    public MapLocationCatalog.MapLocation resolve(String regionCode, String cityCode) {
        return catalog.resolve(
            normalize(regionCode, REGION_CODE_MAX_LENGTH, "map region code"),
            normalize(cityCode, CITY_CODE_MAX_LENGTH, "map city code")
        );
    }

    private String normalize(String value, int maxLength, String fieldName) {
        if (value == null || value.isBlank()) return null;
        String normalized = value.trim();
        if (normalized.length() > maxLength) {
            throw new BusinessException(ErrorCode.INVALID_REQUEST,
                fieldName + " must be at most " + maxLength + " characters.");
        }
        return normalized;
    }
}
