package com.dearmi.backend.presentation.notification.dto;

import jakarta.validation.constraints.NotBlank;

public record FcmTokenRequest(
        @NotBlank String fcmToken
) {}
