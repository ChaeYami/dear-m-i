package com.dearmi.backend.application.payment.usecase;

import com.dearmi.backend.application.payment.dto.PreparePaymentCommand;
import com.dearmi.backend.application.payment.dto.PreparePaymentResult;

public interface PreparePaymentUseCase {
    PreparePaymentResult prepare(PreparePaymentCommand command);
}
