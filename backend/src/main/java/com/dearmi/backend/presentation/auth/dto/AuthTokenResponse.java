package com.dearmi.backend.presentation.auth.dto;

public record AuthTokenResponse(
        String accessToken,
        String refreshToken
) {}
