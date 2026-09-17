package com.intothepicture.domain.photorecord.location;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.intothepicture.global.exception.BusinessException;
import org.junit.jupiter.api.Test;

class MapLocationCatalogTest {
    private final MapLocationCatalog catalog = new MapLocationCatalog();

    @Test
    void resolvesCanonicalCodesAndReturnsTheCityAnchor() {
        var location = catalog.resolve("gangwon", "gangneung");

        assertThat(location.regionCode()).isEqualTo("GANGWON");
        assertThat(location.cityCode()).isEqualTo("GANGNEUNG");
        assertThat(catalog.city(location.cityCode())).hasValueSatisfying(city -> {
            assertThat(city.label()).isEqualTo("강릉");
            assertThat(city.latitude()).isPositive();
        });
    }

    @Test
    void rejectsA_cityFromAnotherRegion() {
        assertThatThrownBy(() -> catalog.resolve("JEJU", "GANGNEUNG"))
            .isInstanceOf(BusinessException.class);
    }

    @Test
    void permitsAnUnselectedLocationAndARegionOnlySelection() {
        assertThat(catalog.resolve(null, null).cityCode()).isNull();
        assertThat(catalog.resolve("JEJU", null).regionCode()).isEqualTo("JEJU");
    }

    @Test
    void exposesTheDocumented161SelectionPolicy() {
        assertThat(catalog.regions()).hasSize(6);
        assertThat(catalog.regions().stream().flatMap(region -> region.cities().stream())).hasSize(161);
        assertThat(catalog.city("JEJU_CITY")).hasValueSatisfying(city -> assertThat(city.label()).isEqualTo("제주시"));
        assertThat(catalog.city("GYEONGGI_GWANGJU")).hasValueSatisfying(city -> assertThat(city.label()).isEqualTo("광주"));
    }

    @Test
    void excludesCountiesThatBelongToMetropolitanCities() {
        assertThat(catalog.city("GUNWI")).isEmpty();
        assertThat(catalog.city("GIJANG")).isEmpty();
        assertThat(catalog.city("GANGHWA")).isEmpty();
        assertThat(catalog.resolve("GYEONGSANG", "BUSAN").cityCode()).isEqualTo("BUSAN");
    }
}
