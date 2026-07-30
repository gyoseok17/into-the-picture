package com.intothepicture.external.crowd;

import com.fasterxml.jackson.databind.JsonNode;
import com.intothepicture.external.tour.TourApiClient;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

/**
 * 집중률 예측(TatsCnctrRateService/tatsCnctrRatedList) 클라이언트. areaCd+signguCd 로 해당 시군구의
 * 관광지 × 향후 30일 집중률을 받아 내부 {@link CrowdRow} 로 변환한다(외부 필드명 격리).
 *
 * <p>한 시군구가 1,000행 이상일 수 있어 "짧은 페이지가 나올 때까지" 페이징한다.
 */
@Component
public class CrowdApiClient {

    private static final Logger log = LoggerFactory.getLogger(CrowdApiClient.class);
    private static final String OPERATION = "TatsCnctrRateService/tatsCnctrRatedList";
    private static final DateTimeFormatter YYYYMMDD = DateTimeFormatter.ofPattern("yyyyMMdd");
    private static final int PAGE_SIZE = 1000;
    private static final int MAX_PAGES = 10;

    private final TourApiClient tourApiClient;

    public CrowdApiClient(TourApiClient tourApiClient) {
        this.tourApiClient = tourApiClient;
    }

    public List<CrowdRow> fetch(String areaCd, String signguCd) {
        List<CrowdRow> rows = new ArrayList<>();
        for (int page = 1; page <= MAX_PAGES; page++) {
            List<JsonNode> items = tourApiClient.fetchItems(OPERATION, params(areaCd, signguCd, page));
            for (JsonNode node : items) {
                CrowdRow row = toRow(node);
                if (row != null) {
                    rows.add(row);
                }
            }
            if (items.size() < PAGE_SIZE) {
                break;
            }
        }
        return rows;
    }

    private Map<String, Object> params(String areaCd, String signguCd, int page) {
        Map<String, Object> params = new LinkedHashMap<>();
        params.put("areaCd", areaCd);
        params.put("signguCd", signguCd);
        params.put("numOfRows", PAGE_SIZE);
        params.put("pageNo", page);
        return params;
    }

    private CrowdRow toRow(JsonNode node) {
        String baseYmd = text(node, "baseYmd");
        String rateText = text(node, "cnctrRate");
        String attraction = text(node, "tAtsNm");
        if (baseYmd == null || rateText == null || attraction == null) {
            return null;
        }
        try {
            LocalDate date = LocalDate.parse(baseYmd, YYYYMMDD);
            double rate = Double.parseDouble(rateText);
            return new CrowdRow(date, rate, attraction, text(node, "areaNm"), text(node, "signguNm"));
        } catch (Exception e) {
            log.warn("집중률 행 파싱 실패 baseYmd={} rate={}", baseYmd, rateText);
            return null;
        }
    }

    private static String text(JsonNode node, String field) {
        JsonNode value = node.path(field);
        if (value.isMissingNode() || value.isNull()) {
            return null;
        }
        String text = value.asText().strip();
        return text.isEmpty() ? null : text;
    }
}
