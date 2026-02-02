package com.dearmi.backend.application.auth.usecase;

import com.dearmi.backend.application.auth.dto.AuthTokenResult;
import com.dearmi.backend.application.auth.dto.TokenRefreshCommand;
import com.dearmi.backend.application.auth.port.TokenPort;
import com.dearmi.backend.common.exception.CustomException;
import com.dearmi.backend.common.exception.ErrorCode;
import com.dearmi.backend.domain.auth.RefreshToken;
import com.dearmi.backend.domain.auth.RefreshTokenRepository;
import com.dearmi.backend.domain.user.User;
import com.dearmi.backend.domain.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class TokenRefreshUseCaseImpl implements TokenRefreshUseCase {

    private final UserRepository userRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final TokenPort tokenPort;

    @Override
    @Transactional
    public AuthTokenResult refresh(TokenRefreshCommand command) {
        String rawRefreshToken = command.refreshToken();

        // JWT 서명/만료 검증
        if (!tokenPort.validateToken(rawRefreshToken)) {
            throw new CustomException(ErrorCode.TOKEN_EXPIRED);
        }

        // 토큰 타입 검증 (REFRESH여야 함)
        String tokenType = tokenPort.extractTokenType(rawRefreshToken);
        if (!"REFRESH".equals(tokenType)) {
            throw new CustomException(ErrorCode.UNAUTHORIZED);
        }

        UUID userId = tokenPort.extractUserId(rawRefreshToken);

        // DB 저장 토큰과 해시 비교 (Rotation 검증)
        RefreshToken stored = refreshTokenRepository.findByUserId(userId)
                .orElseThrow(() -> new CustomException(ErrorCode.UNAUTHORIZED));

        String providedHash = tokenPort.hashToken(rawRefreshToken);
        if (!providedHash.equals(stored.getTokenHash())) {
            // 해시 불일치 → 탈취된 토큰 재사용 시도 또는 이미 rotate된 토큰
            refreshTokenRepository.deleteByUserId(userId);
            throw new CustomException(ErrorCode.UNAUTHORIZED);
        }

        if (stored.isExpired()) {
            refreshTokenRepository.deleteByUserId(userId);
            throw new CustomException(ErrorCode.TOKEN_EXPIRED);
        }

        User user = userRepository.findByIdAndDeletedAtIsNull(userId)
                .orElseThrow(() -> new CustomException(ErrorCode.NOT_FOUND));

        // Rotation: 새 토큰 발급 후 DB 갱신
        String newAccessToken = tokenPort.generateAccessToken(userId, user.getEmail());
        String newRawRefreshToken = tokenPort.generateRefreshToken(userId);
        String newHash = tokenPort.hashToken(newRawRefreshToken);

        stored.rotate(newHash, tokenPort.calculateRefreshTokenExpiry());

        return new AuthTokenResult(newAccessToken, newRawRefreshToken);
    }
}
