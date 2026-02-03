package com.dearmi.backend.application.payment.usecase;

import com.dearmi.backend.application.payment.dto.PreparePaymentCommand;
import com.dearmi.backend.application.payment.dto.PreparePaymentResult;
import com.dearmi.backend.common.exception.CustomException;
import com.dearmi.backend.common.exception.ErrorCode;
import com.dearmi.backend.domain.payment.PaymentTemp;
import com.dearmi.backend.domain.payment.PaymentTempRepository;
import com.dearmi.backend.domain.user.User;
import com.dearmi.backend.domain.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class PreparePaymentUseCaseImpl implements PreparePaymentUseCase {

    private final PaymentTempRepository paymentTempRepository;
    private final UserRepository userRepository;

    @Override
    @Transactional
    public PreparePaymentResult prepare(PreparePaymentCommand command) {
        User user = userRepository.findByIdAndDeletedAtIsNull(command.userId())
                .orElseThrow(() -> new CustomException(ErrorCode.NOT_FOUND));

        String orderId = UUID.randomUUID().toString().replace("-", ""); // 토스 orderId 형식
        int amount = command.planType().getAmount();

        PaymentTemp temp = PaymentTemp.builder()
                .userId(command.userId())
                .orderId(orderId)
                .amount(amount)
                .planType(command.planType().name())
                .build();
        paymentTempRepository.save(temp);

        return new PreparePaymentResult(orderId, amount, user.getName(), user.getEmail());
    }
}
