package com.dearmi.backend.application.auth.usecase;

import java.util.UUID;

/**
 * 회원 탈퇴 UseCase
 * - PII 익명화 + soft delete
 * - refresh_tokens 즉시 삭제 (원칙 ⑥)
 * - 30일 후 HardDeleteWithdrawnUsersJob 이 row + S3 객체 영구 삭제
 */
public interface WithdrawUseCase {

    void withdraw(UUID userId);
}
