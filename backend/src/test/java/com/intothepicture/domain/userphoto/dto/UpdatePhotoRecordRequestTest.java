package com.intothepicture.domain.userphoto.dto;

import static org.assertj.core.api.Assertions.assertThat;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.intothepicture.domain.photorecord.entity.DisplayMode;
import org.junit.jupiter.api.Test;

class UpdatePhotoRecordRequestTest {
    private final ObjectMapper objectMapper = new ObjectMapper().findAndRegisterModules();

    @Test
    void distinguishesAnOmittedFieldFromAFieldExplicitlyCleared() throws Exception {
        var omitted = objectMapper.readValue("{}", UpdatePhotoRecordRequest.class);
        var cleared = objectMapper.readValue("{\"takenAt\":null,\"placeName\":\"\",\"mapRegionCode\":\"JEJU\",\"mapCityCode\":null,\"displayMode\":\"PHOTO_ONLY\"}", UpdatePhotoRecordRequest.class);

        assertThat(omitted.hasTakenAt()).isFalse();
        assertThat(cleared.hasTakenAt()).isTrue();
        assertThat(cleared.takenAt()).isNull();
        assertThat(cleared.hasPlaceName()).isTrue();
        assertThat(cleared.hasMapRegionCode()).isTrue();
        assertThat(cleared.mapRegionCode()).isEqualTo("JEJU");
        assertThat(cleared.hasMapCityCode()).isTrue();
        assertThat(cleared.mapCityCode()).isNull();
        assertThat(cleared.displayMode()).isEqualTo(DisplayMode.PHOTO_ONLY);
    }
}
