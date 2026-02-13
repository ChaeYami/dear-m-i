package com.dearmi.backend.infrastructure.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.reactive.function.client.ExchangeStrategies;
import org.springframework.web.reactive.function.client.WebClient;

@Configuration
public class WebClientConfig {

    /** e약은요 허가정보 API 는 단일 약품 응답이 256KB 기본 버퍼를 넘는 경우가 있음 (예: 아빌리파이). 2MB 로 확장. */
    private static final int MAX_IN_MEMORY_SIZE = 2 * 1024 * 1024;

    @Bean
    public WebClient.Builder webClientBuilder() {
        ExchangeStrategies strategies = ExchangeStrategies.builder()
                .codecs(configurer -> configurer.defaultCodecs().maxInMemorySize(MAX_IN_MEMORY_SIZE))
                .build();
        return WebClient.builder().exchangeStrategies(strategies);
    }
}
