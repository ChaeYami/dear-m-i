package com.dearmi.backend.presentation.subscription;

import com.dearmi.backend.application.subscription.dto.ActivatePremiumCommand;
import com.dearmi.backend.application.subscription.dto.SubscriptionResult;
import com.dearmi.backend.application.subscription.usecase.ActivatePremiumUseCase;
import com.dearmi.backend.application.subscription.usecase.CancelSubscriptionUseCase;
import com.dearmi.backend.application.subscription.usecase.GetSubscriptionUseCase;
import com.dearmi.backend.common.response.ApiResponse;
import com.dearmi.backend.domain.subscription.PaymentProvider;
import com.dearmi.backend.infrastructure.external.iap.AppStoreIapValidator;
import com.dearmi.backend.infrastructure.external.iap.GooglePlayIapValidator;
import com.dearmi.backend.infrastructure.external.iap.IapValidator;
import com.dearmi.backend.infrastructure.security.AuthenticatedUserId;
import com.dearmi.backend.presentation.subscription.dto.SubscriptionResponse;
import com.dearmi.backend.presentation.subscription.dto.VerifyIapRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/subscriptions")
@RequiredArgsConstructor
public class SubscriptionController {

    private final GetSubscriptionUseCase getSubscriptionUseCase;
    private final ActivatePremiumUseCase activatePremiumUseCase;
    private final CancelSubscriptionUseCase cancelSubscriptionUseCase;
    private final AppStoreIapValidator appStoreValidator;
    private final GooglePlayIapValidator playStoreValidator;

    /** GET /api/v1/subscriptions — 현재 구독 상태 조회 */
    @GetMapping
    public ApiResponse<SubscriptionResponse> get(@AuthenticatedUserId UUID userId) {
        SubscriptionResult result = getSubscriptionUseCase.get(userId);
        return ApiResponse.success(SubscriptionResponse.from(result));
    }

    /**
     * POST /api/v1/subscriptions/verify/app-store — iOS IAP 영수증 서버 검증 후 PREMIUM 활성화.
     * receiptData 는 JWS signedTransactionInfo. SignedDataVerifier 가 서명/체인 검증 + expiresDate 파싱.
     */
    @PostMapping("/verify/app-store")
    public ApiResponse<SubscriptionResponse> verifyAppStore(
            @AuthenticatedUserId UUID userId,
            @Valid @RequestBody VerifyIapRequest request
    ) {
        IapValidator.ValidationResult verified = appStoreValidator.validate(
                request.productId(), request.originalTransactionId(), request.receiptData());

        ActivatePremiumCommand command = new ActivatePremiumCommand(
                userId,
                PaymentProvider.APP_STORE,
                verified.originalTransactionId(),
                verified.expiresAt()
        );
        return ApiResponse.success(SubscriptionResponse.from(activatePremiumUseCase.activate(command)));
    }

    /**
     * POST /api/v1/subscriptions/verify/play-store — Android 구독 영수증 서버 검증 후 PREMIUM 활성화.
     * AndroidPublisher.purchases.subscriptionsv2.get(packageName, purchaseToken) 호출 — 상태/만료일 파싱.
     */
    @PostMapping("/verify/play-store")
    public ApiResponse<SubscriptionResponse> verifyPlayStore(
            @AuthenticatedUserId UUID userId,
            @Valid @RequestBody VerifyIapRequest request
    ) {
        IapValidator.ValidationResult verified = playStoreValidator.validate(
                request.productId(), request.originalTransactionId(), request.receiptData());

        ActivatePremiumCommand command = new ActivatePremiumCommand(
                userId,
                PaymentProvider.PLAY_STORE,
                verified.originalTransactionId(),
                verified.expiresAt()
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
