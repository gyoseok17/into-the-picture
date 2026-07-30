package com.intothepicture.external.kakao;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.intothepicture.domain.contest.port.Coordinate;
import com.intothepicture.global.exception.ErrorCode;
import com.intothepicture.global.exception.ExternalApiException;
import java.util.Optional;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class KakaoGeocodingAdapterTest {

    private static final String LOCATION = "경상남도 합천군, 가야산국립공원";

    @Mock
    private KakaoLocalClient kakaoLocalClient;

    private KakaoGeocodingAdapter adapter() {
        return new KakaoGeocodingAdapter(kakaoLocalClient);
    }

    @Test
    @DisplayName("① 마지막 조각(장소명) 키워드검색이 성공하면 그 좌표를 쓰고 폴백은 호출하지 않는다")
    void usesPlaceNameKeyword() {
        when(kakaoLocalClient.searchKeyword("가야산국립공원"))
            .thenReturn(Optional.of(new KakaoPlace("가야산국립공원", 35.80, 128.11)));

        Optional<Coordinate> result = adapter().geocode(LOCATION);

        assertThat(result).contains(new Coordinate(35.80, 128.11));
        verify(kakaoLocalClient, never()).searchKeyword(LOCATION);
        verify(kakaoLocalClient, never()).searchAddress(org.mockito.ArgumentMatchers.anyString());
    }

    @Test
    @DisplayName("② 장소명 0건이면 전체 문자열 키워드검색으로 폴백")
    void fallsBackToFullText() {
        when(kakaoLocalClient.searchKeyword("가야산국립공원")).thenReturn(Optional.empty());
        when(kakaoLocalClient.searchKeyword(LOCATION))
            .thenReturn(Optional.of(new KakaoPlace("가야산", 35.8, 128.1)));

        assertThat(adapter().geocode(LOCATION)).contains(new Coordinate(35.8, 128.1));
        verify(kakaoLocalClient, never()).searchAddress(org.mockito.ArgumentMatchers.anyString());
    }

    @Test
    @DisplayName("③ 키워드 모두 0건이면 첫 조각(행정구역) 주소검색으로 폴백")
    void fallsBackToAddress() {
        when(kakaoLocalClient.searchKeyword("가야산국립공원")).thenReturn(Optional.empty());
        when(kakaoLocalClient.searchKeyword(LOCATION)).thenReturn(Optional.empty());
        when(kakaoLocalClient.searchAddress("경상남도 합천군"))
            .thenReturn(Optional.of(new KakaoPlace("경남 합천군", 35.57, 128.17)));

        assertThat(adapter().geocode(LOCATION)).contains(new Coordinate(35.57, 128.17));
    }

    @Test
    @DisplayName("모두 0건이면 empty(좌표 null = graceful)")
    void allMiss() {
        when(kakaoLocalClient.searchKeyword(org.mockito.ArgumentMatchers.anyString())).thenReturn(Optional.empty());
        when(kakaoLocalClient.searchAddress(org.mockito.ArgumentMatchers.anyString())).thenReturn(Optional.empty());

        assertThat(adapter().geocode(LOCATION)).isEmpty();
    }

    @Test
    @DisplayName("외부 오류(쿼터/장애)는 삼켜서 empty 반환 — 상세/배치가 죽지 않게")
    void swallowsExternalError() {
        when(kakaoLocalClient.searchKeyword("가야산국립공원"))
            .thenThrow(new ExternalApiException(ErrorCode.EXTERNAL_QUOTA, "쿼터 초과"));

        assertThat(adapter().geocode(LOCATION)).isEmpty();
    }

    @Test
    @DisplayName("빈 입력은 외부 호출 없이 empty")
    void blankInput() {
        assertThat(adapter().geocode("  ")).isEmpty();
        verify(kakaoLocalClient, never()).searchKeyword(org.mockito.ArgumentMatchers.anyString());
    }
}
