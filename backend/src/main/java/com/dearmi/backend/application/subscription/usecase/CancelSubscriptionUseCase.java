package com.dearmi.backend.application.subscription.usecase;

import java.util.UUID;

public interface CancelSubscriptionUseCase {
    /** 자동 갱신을 해제한다. 기간 만료까지는 PREMIUM 유지. */
    void cancel(UUID userId);
}
