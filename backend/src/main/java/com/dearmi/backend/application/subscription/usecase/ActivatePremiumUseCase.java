package com.dearmi.backend.application.subscription.usecase;

import com.dearmi.backend.application.subscription.dto.ActivatePremiumCommand;
import com.dearmi.backend.application.subscription.dto.SubscriptionResult;

public interface ActivatePremiumUseCase {
    SubscriptionResult activate(ActivatePremiumCommand command);
}
