package com.dearmi.backend.presentation.auth;

import com.dearmi.backend.application.auth.dto.AuthTokenResult;
import com.dearmi.backend.application.auth.dto.OAuthLoginCommand;
import com.dearmi.backend.application.auth.port.TokenPort;
import com.dearmi.backend.application.auth.usecase.LoginUseCase;
import com.dearmi.backend.common.response.ApiResponse;
import com.dearmi.backend.domain.subscription.PaymentProvider;
import com.dearmi.backend.domain.subscription.Subscription;
import com.dearmi.backend.domain.subscription.SubscriptionRepository;
import com.dearmi.backend.presentation.auth.dto.AuthTokenResponse;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Profile;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * 로컬 개발 전용 — OAuth2 없이 테스트 유저로 JWT 발급 + PREMIUM 자동 활성화.
 * local 프로파일에서만 활성화됨. prod 와 동시 활성화는 EnvironmentValidator 가 부팅 차단.
 */
@Slf4j
@Profile("local")
@RestController
@RequestMapping("/api/v1/dev")
@RequiredArgsConstructor
public class DevAuthController {

    private final LoginUseCase loginUseCase;
    private final TokenPort tokenPort;
    private final SubscriptionRepository subscriptionRepository;

    @PostConstruct
    void warnActivation() {
        log.warn("⚠️ DevAuthController activated (local profile) — DO NOT deploy this profile to production");
    }

    public record DevLoginRequest(String email, String name) {}

    @PostMapping("/login")
    public ApiResponse<AuthTokenResponse> devLogin(@RequestBody DevLoginRequest request) {
        OAuthLoginCommand command = new OAuthLoginCommand(
                "DEV",
                "dev-" + request.email(),
                request.email(),
                request.name()
        );
        AuthTokenResult result = loginUseCase.login(command);

        // dev login 유저를 PREMIUM으로 자동 활성화
        UUID userId = tokenPort.extractUserId(result.accessToken());
        subscriptionRepository.findByUserId(userId).ifPresent(sub -> {
            if (!sub.isPremium()) {
                sub.activatePremium(
                        PaymentProvider.APP_STORE,
                        "dev-transaction",
                        LocalDateTime.now().plusYears(10)
                );
                subscriptionRepository.save(sub);
            }
        });

        return ApiResponse.success(new AuthTokenResponse(result.accessToken(), result.refreshToken()));
    }
}
