package com.intothepicture.external.http;

import com.intothepicture.global.exception.ErrorCode;
import com.intothepicture.global.exception.ExternalApiException;
import java.net.URI;
import java.time.Duration;
import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.HttpStatusCodeException;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestClient;

/**
 * 외부 HTTP GET 전송 계층(관광공사·카카오 공용). 타임아웃 5s + IO/5xx 1회 재시도,
 * HTTP 상태 → ErrorCode 분류(429 = EXTERNAL_QUOTA, 그 외 = EXTERNAL_ERROR).
 *
 * <p>응답 페이로드(래퍼·필드)는 호출자(TourApiClient·KakaoLocalClient)가 해석한다.
 * 여기서는 raw 문자열만 돌려주어 전송과 페이로드 관심사를 분리한다(SRP).
 */
@Component
public class ExternalHttpClient {

    private static final Logger log = LoggerFactory.getLogger(ExternalHttpClient.class);
    private static final Duration TIMEOUT = Duration.ofSeconds(5);
    private static final int MAX_RETRIES = 1;

    private final RestClient restClient;
    private final int maxRetries;

    public ExternalHttpClient(RestClient.Builder builder) {
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout((int) TIMEOUT.toMillis());
        factory.setReadTimeout((int) TIMEOUT.toMillis());
        this.restClient = builder.requestFactory(factory).build();
        this.maxRetries = MAX_RETRIES;
    }

    /**
     * GET 후 응답 본문을 문자열로 반환. 전송 실패 시 {@link ExternalApiException}.
     * IO 오류·5xx 는 {@code maxRetries} 회 재시도, 4xx 는 즉시 분류(재시도 무의미).
     */
    public String getString(URI uri, Map<String, String> headers) {
        ExternalApiException lastError = null;
        for (int attempt = 0; attempt <= maxRetries; attempt++) {
            try {
                return restClient.get()
                    .uri(uri)
                    .headers(httpHeaders -> headers.forEach(httpHeaders::set))
                    .retrieve()
                    .body(String.class);
            } catch (HttpStatusCodeException e) {
                ErrorCode code = classify(e.getStatusCode().value());
                lastError = new ExternalApiException(code, "외부 API 응답 오류: " + e.getStatusCode());
                if (code == ErrorCode.EXTERNAL_QUOTA || !e.getStatusCode().is5xxServerError()) {
                    throw lastError; // 쿼터/4xx 는 재시도해도 동일 → 즉시 전파
                }
            } catch (ResourceAccessException e) {
                lastError = new ExternalApiException(ErrorCode.EXTERNAL_ERROR, "외부 API 연결 실패: " + e.getMessage());
            }
            if (attempt < maxRetries) {
                log.warn("외부 API 재시도 {}/{}: {}", attempt + 1, maxRetries, uri.getHost());
            }
        }
        throw lastError;
    }

    private ErrorCode classify(int status) {
        return status == 429 ? ErrorCode.EXTERNAL_QUOTA : ErrorCode.EXTERNAL_ERROR;
    }
}
