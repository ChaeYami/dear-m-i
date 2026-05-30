package com.dearmi.backend.infrastructure.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.time.Clock;

/**
 * 시간 의존성 주입용 Clock 설정.
 * - 시간에 의존하는 로직은 LocalDateTime.now() 직접 호출 대신 주입된 Clock 으로 now(clock) 사용.
 * - 테스트에서 Clock.fixed(...) 로 시점을 고정해 만료/경계 케이스를 결정적으로 검증할 수 있다.
 */
@Configuration
public class ClockConfig {

    @Bean
    public Clock clock() {
        return Clock.systemDefaultZone();
    }
}
