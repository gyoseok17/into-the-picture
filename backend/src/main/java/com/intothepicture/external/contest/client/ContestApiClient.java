package com.intothepicture.external.contest.client;

import com.fasterxml.jackson.databind.JsonNode;
import com.intothepicture.external.contest.dto.ContestApiItem;
import com.intothepicture.external.support.ExternalDateTimes;
import com.intothepicture.external.tour.TourApiClient;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import org.springframework.stereotype.Component;

/**
 * 공모전 수상작(PhokoAwrdService/phokoAwrdList) 클라이언트. 외부 응답(koTitle·koWnprzDiz…)을
 * 내부 {@link ContestApiItem}(원문) 으로 변환한다(외부 필드명 격리). 부문/등급/계절/시도/시군구 파싱은
 * 호출자(sync)가 파서로 수행한다.
 *
 * <p>전체 95건은 100건 1페이지로 충분하지만, 데이터 증가에 대비해 "짧은 페이지가 나올 때까지" 페이징한다.
 */
@Component
public class ContestApiClient {

    private static final String OPERATION = "PhokoAwrdService/phokoAwrdList";
    private static final int PAGE_SIZE = 100;
    private static final int MAX_PAGES = 20;

    private final TourApiClient tourApiClient;

    public ContestApiClient(TourApiClient tourApiClient) {
        this.tourApiClient = tourApiClient;
    }

    public List<ContestApiItem> fetchAll() {
        List<ContestApiItem> all = new ArrayList<>();
        for (int page = 1; page <= MAX_PAGES; page++) {
            List<JsonNode> items = tourApiClient.fetchItems(
                OPERATION, Map.of("numOfRows", PAGE_SIZE, "pageNo", page));
            for (JsonNode node : items) {
                all.add(toItem(node));
            }
            if (items.size() < PAGE_SIZE) {
                break; // 마지막 페이지
            }
        }
        return all;
    }

    private ContestApiItem toItem(JsonNode node) {
        return new ContestApiItem(
            text(node, "contentId"),
            text(node, "koTitle"),
            text(node, "enTitle"),
            text(node, "koFilmst"),
            text(node, "enFilmst"),
            text(node, "lDongRegnCd"),
            text(node, "koCmanNm"),
            text(node, "enCmanNm"),
            text(node, "filmDay"),
            text(node, "koWnprzDiz"),
            text(node, "koKeyWord"),
            text(node, "orgImage"),
            text(node, "thumbImage"),
            text(node, "cpyrhtDivCd"),
            ExternalDateTimes.parse14(text(node, "regDt")),
            ExternalDateTimes.parse14(text(node, "mdfcnDt"))
        );
    }

    /** 누락/빈 문자열은 null 로(외부가 빈값을 주는 경우 graceful). */
    private static String text(JsonNode node, String field) {
        JsonNode value = node.path(field);
        if (value.isMissingNode() || value.isNull()) {
            return null;
        }
        String text = value.asText().strip();
        return text.isEmpty() ? null : text;
    }
}
