package com.dearmi.backend.presentation.payment.dto;

import com.dearmi.backend.domain.payment.PlanType;
import jakarta.validation.constraints.NotNull;

public record PreparePaymentRequest(
        @NotNull PlanType planType
) {}
