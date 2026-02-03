package com.dearmi.backend.application.payment.usecase;

import com.dearmi.backend.application.payment.dto.ConfirmPaymentCommand;
import com.dearmi.backend.application.payment.dto.ConfirmPaymentResult;

public interface ConfirmPaymentUseCase {
    ConfirmPaymentResult confirm(ConfirmPaymentCommand command);
}
