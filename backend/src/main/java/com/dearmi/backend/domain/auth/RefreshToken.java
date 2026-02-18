package com.dearmi.backend.domain.auth;

import com.dearmi.backend.common.entity.BaseTimestampEntity;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Refresh Token (1유저 1세션 정책).
 *
 * <p>{@code user_id} 가 UNIQUE 이므로 한 유저는 한 번에 한 디바이스에서만 로그인 상태 유지.
 * 의도된 정책 — 의료/멘탈케어 앱 특성상 보안 우선이며, 도난된 디바이스 토큰이 다음 로그인으로
 * 자동 무효화되는 효과가 있다.
 *
 * <p><b>멀티디바이스 지원으로 전환 시</b>:
 * <ol>
 *   <li>{@code (user_id, device_id)} 복합 UNIQUE 로 변경하는 Flyway 마이그레이션</li>
 *   <li>로그인 시 클라이언트가 디바이스 식별자(예: SecureStore 에 발급한 UUID) 전달</li>
 *   <li>{@code RefreshTokenRepository.findByUserIdAndDeviceId} 추가</li>
 *   <li>탈퇴/로그아웃은 device_id 무관하게 user_id 기준 일괄 삭제 유지 (원칙 ⑥)</li>
 * </ol>
 */
@Entity
@Table(name = "refresh_tokens")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor(access = AccessLevel.PRIVATE)
@Builder
public class RefreshToken extends BaseTimestampEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(columnDefinition = "uuid", updatable = false, nullable = false)
    private UUID id;

    @Column(name = "user_id", nullable = false, unique = true, columnDefinition = "uuid")
    private UUID userId;

    @Column(name = "token_hash", length = 500, nullable = false)
    private String tokenHash;

    @Column(name = "expires_at", nullable = false)
    private LocalDateTime expiresAt;

    /** Rotation: 재발급 시 해시와 만료일 교체 */
    public void rotate(String newTokenHash, LocalDateTime newExpiresAt) {
        this.tokenHash = newTokenHash;
        this.expiresAt = newExpiresAt;
    }

    public boolean isExpired() {
        return LocalDateTime.now().isAfter(this.expiresAt);
    }
}
