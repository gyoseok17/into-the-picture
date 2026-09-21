package com.intothepicture.domain.photorecord.location;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.intothepicture.global.exception.BusinessException;
import org.junit.jupiter.api.Test;

class MapLocationInputResolverTest {
    private final MapLocationInputResolver resolver = new MapLocationInputResolver(new MapLocationCatalog());

    @Test
    void normalizesInputBeforeReturningCanonicalLocationCodes() {
        var location = resolver.resolve(" gangwon ", " gangneung ");

        assertThat(location.regionCode()).isEqualTo("GANGWON");
        assertThat(location.cityCode()).isEqualTo("GANGNEUNG");
    }

    @Test
    void preservesTheExistingBlankSelectionPolicy() {
        var location = resolver.resolve("  ", "\t");

        assertThat(location.regionCode()).isNull();
        assertThat(location.cityCode()).isNull();
    }

    @Test
    void rejectsOversizedRegionInputBeforeCatalogLookup() {
        assertThatThrownBy(() -> resolver.resolve("x".repeat(33), null))
            .isInstanceOf(BusinessException.class)
            .hasMessageContaining("map region code must be at most 32 characters");
    }
}
