package com.dearmi.backend.application.notification.usecase;

import com.dearmi.backend.common.exception.CustomException;
import com.dearmi.backend.common.exception.ErrorCode;
import com.dearmi.backend.domain.user.User;
import com.dearmi.backend.domain.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class UpdateFcmTokenUseCaseImpl implements UpdateFcmTokenUseCase {

    private final UserRepository userRepository;

    @Override
    @Transactional
    public void updateToken(UUID userId, String fcmToken) {
        User user = userRepository.findByIdAndDeletedAtIsNull(userId)
                .orElseThrow(() -> new CustomException(ErrorCode.NOT_FOUND));
        user.updateFcmToken(fcmToken);
        userRepository.save(user);
    }
}
