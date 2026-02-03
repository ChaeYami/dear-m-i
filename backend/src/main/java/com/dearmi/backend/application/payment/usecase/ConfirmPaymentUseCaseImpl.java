package com.dearmi.backend.application.payment.usecase;

import com.dearmi.backend.application.payment.dto.ConfirmPaymentCommand;
import com.dearmi.backend.application.payment.dto.ConfirmPaymentResult;
import com.dearmi.backend.application.subscription.dto.ActivatePremiumCommand;
import com.dearmi.backend.application.subscription.usecase.ActivatePremiumUseCase;
import com.dearmi.backend.common.exception.CustomException;
import com.dearmi.backend.common.exception.ErrorCode;
import com.dearmi.backend.domain.payment.PaymentStatus;
import com.dearmi.backend.domain.payment.PaymentTemp;
import com.dearmi.backend.domain.payment.PaymentTempRepository;
import com.dearmi.backend.domain.payment.PlanType;
import com.dearmi.backend.domain.subscription.PaymentProvider;
import com.dearmi.backend.domain.subscription.SubscriptionPlan;
import com.dearmi.backend.infrastructure.external.payment.TossPaymentClient;
import com.dearmi.backend.infrastructure.external.payment.dto.TossConfirmResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Slf4j
@Service
@RequiredArgsConstructor
public class ConfirmPaymentUseCaseImpl implements ConfirmPaymentUseCase {

    private final PaymentTempRepository paymentTempRepository;
    private final TossPaymentClient tossPaymentClient;
    private final ActivatePremiumUseCase activatePremiumUseCase;

    @Override
    @Transactional
    public ConfirmPaymentResult confirm(ConfirmPaymentCommand command) {
        // 1. payments_temp 조회 및 PENDING 상태 확인
        PaymentTemp temp = paymentTempRepository.findByOrderId(command.orderId())
                .filter(t -> PaymentStatus.PENDING.name().equals(t.getStatus()))
                .orElseThrow(() -> new CustomException(ErrorCode.NOT_FOUND,
                        "유효하지 않은 주문입니다."));

        // 2. userId 검증 (④ 원칙)
        if (!temp.getUserId().equals(command.userId())) {
            throw new CustomException(ErrorCode.NOT_FOUND);
        }

        // 3. 금액 위변조 방지
        if (temp.getAmount() != command.amount()) {
            log.warn("[ConfirmPayment] 금액 불일치 위변조 시도: orderId={}, expected={}, actual={}",
                    command.orderId(), temp.getAmount(), command.amount());
            throw new CustomException(ErrorCode.INVALID_REQUEST, "결제 금액이 일치하지 않습니다.");
        }

        // 4. 토스페이먼츠 결제 승인 API 호출
        TossConfirmResponse tossResponse = tossPaymentClient.confirm(
                command.orderId(), command.paymentKey(), command.amount());

        if (!"DONE".equals(tossResponse.status())) {
            log.warn("[ConfirmPayment] 토스 결제 승인 실패: orderId={}, status={}",
                    command.orderId(), tossResponse.status());
            temp.fail();
            paymentTempRepository.save(temp);
            throw new CustomException(ErrorCode.EXTERNAL_SERVICE_ERROR, "결제 승인이 완료되지 않았습니다.");
        }

        // 5. payments_temp COMPLETED 처리
        temp.complete(command.paymentKey());
        paymentTempRepository.save(temp);

        // 6. 구독 활성화
        PlanType planType = PlanType.valueOf(temp.getPlanType());
        LocalDateTime expiresAt = planType == PlanType.MONTHLY
                ? LocalDateTime.now().plusMonths(1)
                : LocalDateTime.now().plusYears(1);

        activatePremiumUseCase.activate(new ActivatePremiumCommand(
                command.userId(), PaymentProvider.WEB, command.paymentKey(), expiresAt));

        log.info("[ConfirmPayment] 결제 완료: userId={}, orderId={}, plan={}",
                command.userId(), command.orderId(), planType);

        return new ConfirmPaymentResult(SubscriptionPlan.PREMIUM.name(), expiresAt);
    }
}
