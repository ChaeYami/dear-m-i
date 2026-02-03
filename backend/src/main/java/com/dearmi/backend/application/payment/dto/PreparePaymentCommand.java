package com.dearmi.backend.application.payment.dto;

import com.dearmi.backend.domain.payment.PlanType;

import java.util.UUID;

public record PreparePaymentCommand(
        UUID userId,
        PlanType planType
) {}
