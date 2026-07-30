package com.intothepicture.external.kakao;

import com.intothepicture.domain.contest.port.Coordinate;
import com.intothepicture.domain.contest.port.GeocodingProvider;
import com.intothepicture.global.exception.ExternalApiException;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

/**
 * 카카오 기반 {@link GeocodingProvider} 구현(촬영지 텍스트 → 좌표). DIP: 도메인 port 를 구현하는 유일 @Component.
 *
 * <p>2단계 폴백(docs/06 X2·4, 실측 8/8 성공):
 * ① 콤마/슬래시 분리 후 <b>마지막 조각(장소명)</b> 키워드검색 → ② 0건이면 <b>전체 문자열</b> 키워드검색 →
 * ③ 그래도 0건이면 <b>첫 조각(행정구역)</b> 주소검색. 모두 실패하거나 외부 오류면 {@link Optional#empty()}
 * (좌표 없음 = 지도 마커 graceful 처리, 상세/배치가 죽지 않게).
 */
@Component
public class KakaoGeocodingAdapter implements GeocodingProvider {

    private static final Logger log = LoggerFactory.getLogger(KakaoGeocodingAdapter.class);

    private final KakaoLocalClient kakaoLocalClient;

    public KakaoGeocodingAdapter(KakaoLocalClient kakaoLocalClient) {
        this.kakaoLocalClient = kakaoLocalClient;
    }

    @Override
    public Optional<Coordinate> geocode(String locationText) {
        if (locationText == null || locationText.isBlank()) {
            return Optional.empty();
        }
        List<String> parts = segments(locationText);
        String placeName = parts.isEmpty() ? locationText : parts.get(parts.size() - 1);
        String region = parts.isEmpty() ? locationText : parts.get(0);

        try {
            return kakaoLocalClient.searchKeyword(placeName)         // ① 장소명
                .or(() -> kakaoLocalClient.searchKeyword(locationText)) // ② 전체 문자열
                .or(() -> kakaoLocalClient.searchAddress(region))       // ③ 행정구역 주소
                .map(place -> new Coordinate(place.lat(), place.lng()));
        } catch (ExternalApiException e) {
            log.warn("지오코딩 실패(graceful) '{}': {}", locationText, e.getMessage());
            return Optional.empty();
        }
    }

    private List<String> segments(String text) {
        return Arrays.stream(text.split("[,/]"))
            .map(String::strip)
            .filter(s -> !s.isEmpty())
            .toList();
    }
}
