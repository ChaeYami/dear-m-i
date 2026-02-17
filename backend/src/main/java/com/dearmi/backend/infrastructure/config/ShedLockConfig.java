package com.dearmi.backend.infrastructure.config;

import net.javacrumbs.shedlock.provider.jdbctemplate.JdbcTemplateLockProvider;
import net.javacrumbs.shedlock.spring.annotation.EnableSchedulerLock;
import net.javacrumbs.shedlock.core.LockProvider;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.jdbc.core.JdbcTemplate;

import javax.sql.DataSource;

/**
 * ShedLock 분산 스케줄러 락 설정.
 *
 * ECS 에 여러 태스크가 떠 있을 때 {@code @Scheduled} 메서드가 각 태스크에서 동시에 실행되어
 * 같은 cron tick 에 FCM 이 중복 발송되던 문제를 해결한다.
 *
 * 사용: 스케줄 메서드에 {@code @SchedulerLock(name = "...", lockAtMostFor = "30s", lockAtLeastFor = "30s")}.
 */
@Configuration
@EnableSchedulerLock(defaultLockAtMostFor = "PT30S")
public class ShedLockConfig {

    @Bean
    public LockProvider lockProvider(DataSource dataSource) {
        return new JdbcTemplateLockProvider(
                JdbcTemplateLockProvider.Configuration.builder()
                        .withJdbcTemplate(new JdbcTemplate(dataSource))
                        .usingDbTime() // DB 서버 시간 기준 — 인스턴스 간 시계 불일치 영향 제거
                        .build()
        );
    }
}
