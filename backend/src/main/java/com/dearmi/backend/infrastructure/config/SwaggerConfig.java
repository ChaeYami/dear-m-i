package com.dearmi.backend.infrastructure.config;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import org.springdoc.core.models.GroupedOpenApi;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class SwaggerConfig {

    private static final String BEARER = "Bearer";

    @Bean
    public OpenAPI openAPI() {
        SecurityScheme scheme = new SecurityScheme()
                .type(SecurityScheme.Type.HTTP)
                .scheme("bearer")
                .bearerFormat("JWT")
                .description("JWT Access Token — Authorization: Bearer {token}");

        return new OpenAPI()
                .info(new Info()
                        .title("DearMI API")
                        .version("1.0.0")
                        .description("Dear Me + I — 멘탈 케어 진료 기록 앱 백엔드 API"))
                .components(new Components().addSecuritySchemes(BEARER, scheme))
                .addSecurityItem(new SecurityRequirement().addList(BEARER));
    }

    @Bean
    public GroupedOpenApi authGroup() {
        return GroupedOpenApi.builder()
                .group("auth")
                .displayName("인증")
                .pathsToMatch("/api/v1/auth/**")
                .build();
    }

    @Bean
    public GroupedOpenApi scheduleGroup() {
        return GroupedOpenApi.builder()
                .group("schedule")
                .displayName("병원 일정")
                .pathsToMatch("/api/v1/schedules/**")
                .build();
    }

    @Bean
    public GroupedOpenApi recordGroup() {
        return GroupedOpenApi.builder()
                .group("record")
                .displayName("상담 기록")
                .pathsToMatch("/api/v1/records/**")
                .build();
    }

    @Bean
    public GroupedOpenApi checkinGroup() {
        return GroupedOpenApi.builder()
                .group("checkin")
                .displayName("하루 체크인")
                .pathsToMatch("/api/v1/checkins/**")
                .build();
    }

    @Bean
    public GroupedOpenApi prescriptionGroup() {
        return GroupedOpenApi.builder()
                .group("prescription")
                .displayName("처방전")
                .pathsToMatch("/api/v1/prescriptions/**")
                .build();
    }

    @Bean
    public GroupedOpenApi medicationGroup() {
        return GroupedOpenApi.builder()
                .group("medication")
                .displayName("약품 · 복약 일정")
                .pathsToMatch("/api/v1/medications/**", "/api/v1/medication-schedules/**")
                .build();
    }

    @Bean
    public GroupedOpenApi subscriptionGroup() {
        return GroupedOpenApi.builder()
                .group("subscription")
                .displayName("구독 · 결제")
                .pathsToMatch("/api/v1/subscriptions/**")
                .build();
    }

    @Bean
    public GroupedOpenApi searchGroup() {
        return GroupedOpenApi.builder()
                .group("search")
                .displayName("통합 검색")
                .pathsToMatch("/api/v1/search/**")
                .build();
    }

    @Bean
    public GroupedOpenApi notificationGroup() {
        return GroupedOpenApi.builder()
                .group("notification")
                .displayName("알림")
                .pathsToMatch("/api/v1/notifications/**")
                .build();
    }

    @Bean
    public GroupedOpenApi prepNoteGroup() {
        return GroupedOpenApi.builder()
                .group("prep-note")
                .displayName("진료 준비 메모")
                .pathsToMatch("/api/v1/prep-notes/**")
                .build();
    }
}
