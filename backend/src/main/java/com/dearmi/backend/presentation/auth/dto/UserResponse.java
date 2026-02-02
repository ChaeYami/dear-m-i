package com.dearmi.backend.presentation.auth.dto;

import java.util.UUID;

public record UserResponse(
        UUID userId,
        String email,
        String name
) {}
