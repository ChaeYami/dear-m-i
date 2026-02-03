package com.dearmi.backend.application.payment.usecase;

import com.dearmi.backend.infrastructure.external.payment.dto.TossWebhookPayload;

public interface HandleWebhookUseCase {
    void handle(TossWebhookPayload payload);
}
