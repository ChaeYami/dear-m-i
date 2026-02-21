package com.dearmi.backend.application.auth.usecase;

import com.dearmi.backend.domain.auth.RefreshTokenRepository;
import com.dearmi.backend.domain.user.User;
import com.dearmi.backend.domain.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class LogoutUseCaseImpl implements LogoutUseCase {

    private final RefreshTokenRepository refreshTokenRepository;
    private final UserRepository userRepository;

    @Override
    @Transactional
    public void logout(UUID userId) {
        refreshTokenRepository.deleteByUserId(userId);
        userRepository.findByIdAndDeletedAtIsNull(userId)
                .ifPresent(user -> {
                    user.updateFcmToken(null);
                    userRepository.save(user);
                });
    }
}
