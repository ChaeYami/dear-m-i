package com.dearmi.backend.application.auth.dto;

import java.util.UUID;

/**
 * 사용자 정보 결과 DTO
 *
 * @param userId 사용자 UUID
 * @param email  이메일
 * @param name   이름
 */
public record UserResult(UUID userId, String email, String name, String plan) {}
