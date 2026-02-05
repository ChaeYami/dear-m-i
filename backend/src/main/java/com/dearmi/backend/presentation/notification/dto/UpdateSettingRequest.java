package com.dearmi.backend.presentation.notification.dto;

import jakarta.validation.constraints.NotNull;

public record UpdateSettingRequest(
        @NotNull Boolean enabled,
        @NotNull Boolean dayBefore,
        @NotNull Boolean dayOf,
        @NotNull Boolean medEnabled
) {}
