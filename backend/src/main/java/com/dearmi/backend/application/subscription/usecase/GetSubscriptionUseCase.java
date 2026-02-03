package com.dearmi.backend.application.subscription.usecase;

import com.dearmi.backend.application.subscription.dto.SubscriptionResult;

import java.util.UUID;

public interface GetSubscriptionUseCase {
    SubscriptionResult get(UUID userId);
}
