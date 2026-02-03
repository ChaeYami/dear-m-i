package com.dearmi.backend.presentation.subscription;

import com.dearmi.backend.application.subscription.dto.ActivatePremiumCommand;
import com.dearmi.backend.application.subscription.dto.SubscriptionResult;
import com.dearmi.backend.application.subscription.usecase.ActivatePremiumUseCase;
import com.dearmi.backend.application.subscription.usecase.CancelSubscriptionUseCase;
import com.dearmi.backend.application.subscription.usecase.GetSubscriptionUseCase;
import com.dearmi.backend.common.response.ApiResponse;
import com.dearmi.backend.domain.subscription.PaymentProvider;
import com.dearmi.backend.infrastructure.security.AuthenticatedUserId;
import com.dearmi.backend.presentation.subscription.dto.SubscriptionResponse;
import com.dearmi.backend.presentation.subscription.dto.VerifyIapRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/subscriptions")
@RequiredArgsConstructor
public class SubscriptionController {

    private final GetSubscriptionUseCase getSubscriptionUseCase;
    private final ActivatePremiumUseCase activatePremiumUseCase;
    private final CancelSubscriptionUseCase cancelSubscriptionUseCase;

    /** GET /api/v1/subscriptions — 현재 구독 상태 조회 */
    @GetMapping
    public ApiResponse<SubscriptionResponse> get(@AuthenticatedUserId UUID userId) {
        SubscriptionResult result = getSubscriptionUseCase.get(userId);
        return ApiResponse.success(SubscriptionResponse.from(result));
    }

    /**
     * POST /api/v1/subscriptions/verify/app-store — iOS IAP 영수증 검증 및 PREMIUM 활성화
     * TODO: 실제 App Store 서버 검증 연동 (v1.1)
     */
    @PostMapping("/verify/app-store")
    public ApiResponse<SubscriptionResponse> verifyAppStore(
            @AuthenticatedUserId UUID userId,
            @Valid @RequestBody VerifyIapRequest request
    ) {
        ActivatePremiumCommand command = new ActivatePremiumCommand(
                userId,
                PaymentProvider.APP_STORE,
                request.originalTransactionId(),
                LocalDateTime.now().plusYears(1)   // TODO: 영수증에서 실제 만료일 파싱
        );
        return ApiResponse.success(SubscriptionResponse.from(activatePremiumUseCase.activate(command)));
    }

    /**
     * POST /api/v1/subscriptions/verify/play-store — Android 구매 검증 및 PREMIUM 활성화
     * TODO: 실제 Google Play Developer API 검증 연동 (v1.1)
     */
    @PostMapping("/verify/play-store")
    public ApiResponse<SubscriptionResponse> verifyPlayStore(
            @AuthenticatedUserId UUID userId,
            @Valid @RequestBody VerifyIapRequest request
    ) {
        ActivatePremiumCommand command = new ActivatePremiumCommand(
                userId,
                PaymentProvider.PLAY_STORE,
                request.originalTransactionId(),
                LocalDateTime.now().plusYears(1)   // TODO: 구매 토큰에서 실제 만료일 파싱
        );
        return ApiResponse.success(SubscriptionResponse.from(activatePremiumUseCase.activate(command)));
    }

    /** DELETE /api/v1/subscriptions/cancel — 자동 갱신 해제 (기간 만료까지 PREMIUM 유지) */
    @DeleteMapping("/cancel")
    public ApiResponse<Void> cancel(@AuthenticatedUserId UUID userId) {
        cancelSubscriptionUseCase.cancel(userId);
        return ApiResponse.success();
    }
}
