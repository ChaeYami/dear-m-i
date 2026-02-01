package com.dearmi.backend.infrastructure.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;

/**
 * JPA 설정
 * - @EnableJpaAuditing: BaseTimeEntity의 createdAt, updatedAt 자동 관리 활성화
 */
@Configuration
@EnableJpaAuditing
public class JpaConfig {
    // JPA Auditing 활성화만으로 BaseTimeEntity의 시간 필드가 자동으로 관리됨
}
