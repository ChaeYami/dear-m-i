package com.dearmi.backend.application.auth.usecase;

import com.dearmi.backend.common.exception.CustomException;
import com.dearmi.backend.common.exception.ErrorCode;
import com.dearmi.backend.domain.audit.AuditLog;
import com.dearmi.backend.domain.audit.AuditLogRepository;
import com.dearmi.backend.domain.auth.RefreshTokenRepository;
import com.dearmi.backend.domain.user.User;
import com.dearmi.backend.domain.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class WithdrawUseCaseImpl implements WithdrawUseCase {

    private final UserRepository userRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final AuditLogRepository auditLogRepository;

    @Override
    @Transactional
    public void withdraw(UUID userId) {
        User user = userRepository.findByIdAndDeletedAtIsNull(userId)
                .orElseThrow(() -> new CustomException(ErrorCode.NOT_FOUND));

        // ⑥ refresh_tokens 즉시 삭제 (탈취 방지) — soft delete 와 같은 트랜잭션
        refreshTokenRepository.deleteByUserId(userId);

        user.withdraw();
        userRepository.save(user);

        auditLogRepository.save(AuditLog.builder()
                .userId(userId)
                .action("ACCOUNT_WITHDRAW")
                .resourceType("user")
                .resourceId(userId)
                .build());
    }
}
