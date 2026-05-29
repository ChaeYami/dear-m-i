package com.dearmi.backend.presentation.auth.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/** 사용자 선호 로케일 갱신 요청 (앱 언어 코드: ko/en) */
public record UpdateLocaleRequest(
        @NotBlank @Size(max = 5) String locale
) {}
