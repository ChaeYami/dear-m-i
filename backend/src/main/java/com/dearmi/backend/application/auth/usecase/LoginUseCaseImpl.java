package com.dearmi.backend.application.auth.usecase;

import com.dearmi.backend.application.auth.dto.AuthTokenResult;
import com.dearmi.backend.application.auth.dto.OAuthLoginCommand;
import com.dearmi.backend.application.auth.port.TokenPort;
import com.dearmi.backend.common.exception.CustomException;
import com.dearmi.backend.common.exception.ErrorCode;
import com.dearmi.backend.domain.auth.RefreshToken;
import com.dearmi.backend.domain.auth.RefreshTokenRepository;
import com.dearmi.backend.domain.notification.NotificationSetting;
import com.dearmi.backend.domain.notification.NotificationSettingRepository;
import com.dearmi.backend.domain.subscription.Subscription;
import com.dearmi.backend.domain.subscription.SubscriptionRepository;
import com.dearmi.backend.domain.user.User;
import com.dearmi.backend.domain.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class LoginUseCaseImpl implements LoginUseCase {

    private final UserRepository userRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final SubscriptionRepository subscriptionRepository;
    private final NotificationSettingRepository notificationSettingRepository;
    private final TokenPort tokenPort;

    @Override
    @Transactional
    public AuthTokenResult login(OAuthLoginCommand command) {
        User user = findOrCreateUser(command);

        if (user.isDeleted()) {
            throw new CustomException(ErrorCode.NOT_FOUND);
        }

        return issueTokens(user);
    }

    private User findOrCreateUser(OAuthLoginCommand command) {
        return userRepository.findByOauthProviderAndOauthProviderId(command.provider(), command.providerId())
                .orElseGet(() -> registerNewUser(command));
    }

    private User registerNewUser(OAuthLoginCommand command) {
        User newUser = User.builder()
                .email(command.email())
                .name(command.name())
                .oauthProvider(command.provider())
                .oauthProviderId(command.providerId())
                .build();
        User saved = userRepository.save(newUser);

        subscriptionRepository.save(Subscription.builder()
                .userId(saved.getId())
                .build());

        notificationSettingRepository.save(NotificationSetting.builder()
                .userId(saved.getId())
                .build());

        return saved;
    }

    private AuthTokenResult issueTokens(User user) {
        String accessToken = tokenPort.generateAccessToken(user.getId(), user.getEmail());
        String rawRefreshToken = tokenPort.generateRefreshToken(user.getId());
        String tokenHash = tokenPort.hashToken(rawRefreshToken);

        refreshTokenRepository.findByUserId(user.getId())
                .ifPresentOrElse(
                        existing -> existing.rotate(tokenHash, tokenPort.calculateRefreshTokenExpiry()),
                        () -> refreshTokenRepository.save(RefreshToken.builder()
                                .userId(user.getId())
                                .tokenHash(tokenHash)
                                .expiresAt(tokenPort.calculateRefreshTokenExpiry())
                                .build())
                );

        return new AuthTokenResult(accessToken, rawRefreshToken);
    }
}
