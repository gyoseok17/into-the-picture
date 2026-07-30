package com.intothepicture.external.config;

import com.intothepicture.external.kakao.KakaoLocalProperties;
import com.intothepicture.external.tour.TourApiProperties;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Configuration;

/** 외부 연동 설정 활성화(관광공사·카카오 키/엔드포인트). 키는 .env(환경변수)에서 주입(하드코딩 금지). */
@Configuration
@EnableConfigurationProperties({TourApiProperties.class, KakaoLocalProperties.class})
public class ExternalConfig {
}
