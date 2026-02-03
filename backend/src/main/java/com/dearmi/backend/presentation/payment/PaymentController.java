package com.dearmi.backend.presentation.payment;

import com.dearmi.backend.application.payment.dto.ConfirmPaymentCommand;
import com.dearmi.backend.application.payment.dto.PreparePaymentCommand;
import com.dearmi.backend.application.payment.usecase.ConfirmPaymentUseCase;
import com.dearmi.backend.application.payment.usecase.HandleWebhookUseCase;
import com.dearmi.backend.application.payment.usecase.PreparePaymentUseCase;
import com.dearmi.backend.common.response.ApiResponse;
import com.dearmi.backend.infrastructure.external.payment.dto.TossWebhookPayload;
import com.dearmi.backend.infrastructure.security.AuthenticatedUserId;
import com.dearmi.backend.presentation.payment.dto.ConfirmPaymentRequest;
import com.dearmi.backend.presentation.payment.dto.ConfirmPaymentResponse;
import com.dearmi.backend.presentation.payment.dto.PreparePaymentRequest;
import com.dearmi.backend.presentation.payment.dto.PreparePaymentResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/payments")
@RequiredArgsConstructor
public class PaymentController {

    private final PreparePaymentUseCase preparePaymentUseCase;
    private final ConfirmPaymentUseCase confirmPaymentUseCase;
    private final HandleWebhookUseCase handleWebhookUseCase;

    /**
     * POST /api/v1/payments/prepare
     * orderId 생성 + payments_temp 임시 저장.
     * 응답: 토스페이먼츠 SDK 초기화에 필요한 정보.
     */
    @PostMapping("/prepare")
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<PreparePaymentResponse> prepare(
            @AuthenticatedUserId UUID userId,
            @Valid @RequestBody PreparePaymentRequest request
    ) {
        PreparePaymentCommand command = new PreparePaymentCommand(userId, request.planType());
        return ApiResponse.success(PreparePaymentResponse.from(preparePaymentUseCase.prepare(command)));
    }

    /**
     * POST /api/v1/payments/confirm
     * 토스페이먼츠 결제 승인 + 구독 활성화.
     * 클라이언트가 토스 SDK 결제 완료 후 호출.
     */
    @PostMapping("/confirm")
    public ApiResponse<ConfirmPaymentResponse> confirm(
            @AuthenticatedUserId UUID userId,
            @Valid @RequestBody ConfirmPaymentRequest request
    ) {
        ConfirmPaymentCommand command = new ConfirmPaymentCommand(
                userId, request.orderId(), request.paymentKey(), request.amount());
        return ApiResponse.success(ConfirmPaymentResponse.from(confirmPaymentUseCase.confirm(command)));
    }

    /**
     * POST /api/v1/payments/webhook
     * 토스페이먼츠 결제 상태 변경 웹훅.
     * 취소/환불 이벤트 수신 시 구독 다운그레이드.
     * TODO: 토스 웹훅 서명 검증 추가 (v1.1)
     */
    @PostMapping("/webhook")
    public void webhook(@RequestBody TossWebhookPayload payload) {
        handleWebhookUseCase.handle(payload);
    }
}
