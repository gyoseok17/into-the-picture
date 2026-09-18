package com.intothepicture.global.config;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.Map;
import org.junit.jupiter.api.Test;
import org.springframework.boot.context.properties.bind.Bindable;
import org.springframework.boot.context.properties.bind.Binder;
import org.springframework.boot.context.properties.source.MapConfigurationPropertySource;

class CorsPropertiesTest {

    @Test
    void commaSeparatedOrigins_bindToList() {
        var source = new MapConfigurationPropertySource(Map.of(
            "app.cors.allowed-origins", "https://into.example.com,https://www.into.example.com"
        ));

        CorsProperties properties = new Binder(source)
            .bind("app.cors", Bindable.of(CorsProperties.class))
            .orElseThrow(() -> new AssertionError("CORS origins must bind"));

        assertThat(properties.allowedOrigins())
            .containsExactly("https://into.example.com", "https://www.into.example.com");
    }
}
