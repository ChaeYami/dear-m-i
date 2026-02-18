package com.dearmi.backend.auth;

import com.dearmi.backend.application.auth.usecase.WithdrawUseCaseImpl;
import com.dearmi.backend.common.exception.CustomException;
import com.dearmi.backend.common.exception.ErrorCode;
import com.dearmi.backend.domain.audit.AuditLog;
import com.dearmi.backend.domain.audit.AuditLogRepository;
import com.dearmi.backend.domain.auth.RefreshTokenRepository;
import com.dearmi.backend.domain.user.User;
import com.dearmi.backend.domain.user.UserRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class WithdrawUseCaseImplTest {

    @Mock private UserRepository userRepository;
    @Mock private RefreshTokenRepository refreshTokenRepository;
    @Mock private AuditLogRepository auditLogRepository;

    @InjectMocks
    private WithdrawUseCaseImpl withdrawUseCase;

    @Test
    @DisplayName("탈퇴 시 PII 익명화 + softDelete + refresh_tokens 삭제 + audit 로그 (⑥ 원칙)")
    void withdraw_anonymizes_softDeletes_invalidatesTokens_andAudits() {
        UUID userId = UUID.randomUUID();
        User user = User.builder()
                .email("user@dearmi.kr")
                .name("홍길동")
                .oauthProvider("google")
                .oauthProviderId("google-123")
                .fcmToken("fcm-token-abc")
                .build();

        when(userRepository.findByIdAndDeletedAtIsNull(userId)).thenReturn(Optional.of(user));
        when(userRepository.save(any())).thenReturn(user);

        withdrawUseCase.withdraw(userId);

        // PII 익명화
        assertThat(user.getEmail()).startsWith("withdrawn-").endsWith("@dearmi.local");
        assertThat(user.getName()).isNull();
        assertThat(user.getOauthProvider()).isNull();
        assertThat(user.getOauthProviderId()).isNull();
        assertThat(user.getFcmToken()).isNull();
        // softDelete 적용
        assertThat(user.getDeletedAt()).isNotNull();

        // ⑥ refresh_tokens 즉시 삭제
        verify(refreshTokenRepository).deleteByUserId(userId);

        // audit 로그
        ArgumentCaptor<AuditLog> auditCaptor = ArgumentCaptor.forClass(AuditLog.class);
        verify(auditLogRepository).save(auditCaptor.capture());
        AuditLog audit = auditCaptor.getValue();
        assertThat(audit.getAction()).isEqualTo("ACCOUNT_WITHDRAW");
        assertThat(audit.getUserId()).isEqualTo(userId);
        assertThat(audit.getResourceId()).isEqualTo(userId);
    }

    @Test
    @DisplayName("이미 탈퇴/존재하지 않는 사용자는 NOT_FOUND")
    void withdraw_not_found() {
        UUID userId = UUID.randomUUID();
        when(userRepository.findByIdAndDeletedAtIsNull(userId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> withdrawUseCase.withdraw(userId))
                .isInstanceOf(CustomException.class)
                .satisfies(ex -> assertThat(((CustomException) ex).getErrorCode())
                        .isEqualTo(ErrorCode.NOT_FOUND.getCode()));

        verifyNoInteractions(refreshTokenRepository, auditLogRepository);
    }
}
