package com.intothepicture.external.photo;

import com.fasterxml.jackson.databind.JsonNode;
import com.intothepicture.domain.photo.dto.PhotoDto;
import com.intothepicture.external.tour.DataGoKrEnvelope;
import com.intothepicture.external.tour.TourApiClient;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.stream.Stream;
import org.springframework.stereotype.Component;

/** PhotoGalleryService1을 내부 PhotoDto로 격리한다. */
@Component
public class PhotoGalleryClient {
    private static final String LIST = "PhotoGalleryService1/galleryList1";
    private static final String SEARCH = "PhotoGalleryService1/gallerySearchList1";
    private final TourApiClient tourApiClient;

    public PhotoGalleryClient(TourApiClient tourApiClient) { this.tourApiClient = tourApiClient; }

    public PhotoPage find(String keyword, int page, int size) {
        Map<String, Object> params = new java.util.LinkedHashMap<>();
        params.put("numOfRows", size); params.put("pageNo", page);
        DataGoKrEnvelope.Page result = tourApiClient.fetchPage(
            keyword == null || keyword.isBlank() ? LIST : SEARCH,
            keyword == null || keyword.isBlank() ? params : withKeyword(params, keyword));
        return new PhotoPage(result.items().stream().map(this::toDto).toList(), result.totalCount());
    }

    private Map<String, Object> withKeyword(Map<String, Object> params, String keyword) { params.put("keyword", keyword); return params; }
    private PhotoDto toDto(JsonNode node) {
        return new PhotoDto(text(node, "galContentId"), text(node, "galTitle"), https(text(node, "galWebImageUrl")),
            text(node, "galPhotographyLocation"), text(node, "galPhotographer"), text(node, "galPhotographyMonth"), keywords(text(node, "galSearchKeyword")));
    }
    private static String text(JsonNode node, String field) { String value = node.path(field).asText("").strip(); return value.isEmpty() ? null : value; }
    private static String https(String url) { return url != null && url.startsWith("http://") ? "https://" + url.substring(7) : url; }
    private static List<String> keywords(String value) { return value == null ? List.of() : Arrays.stream(value.split(",")).map(String::strip).filter(v -> !v.isEmpty()).distinct().limit(12).toList(); }
    public record PhotoPage(List<PhotoDto> content, long totalCount) {}
}
