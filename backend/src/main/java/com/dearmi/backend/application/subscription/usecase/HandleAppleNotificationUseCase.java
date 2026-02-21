package com.dearmi.backend.application.subscription.usecase;

public interface HandleAppleNotificationUseCase {
    void handle(String signedPayload);
}
