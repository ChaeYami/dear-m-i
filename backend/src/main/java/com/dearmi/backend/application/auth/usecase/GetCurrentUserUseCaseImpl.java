package com.dearmi.backend.application.auth.usecase;

import com.dearmi.backend.application.auth.dto.UserResult;
import com.dearmi.backend.common.exception.CustomException;
import com.dearmi.backend.common.exception.ErrorCode;
import com.dearmi.backend.domain.subscription.SubscriptionRepository;
import com.dearmi.backend.domain.user.User;
import com.dearmi.backend.domain.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class GetCurrentUserUseCaseImpl implements GetCurrentUserUseCase {

    private final UserRepository userRepository;
    private final SubscriptionRepository subscriptionRepository;

    @Override
    @Transactional(readOnly = true)
    public UserResult getCurrentUser(UUID userId) {
        User user = userRepository.findByIdAndDeletedAtIsNull(userId)
                .orElseThrow(() -> new CustomException(ErrorCode.NOT_FOUND));

        String plan = subscriptionRepository.findByUserId(userId)
                .map(sub -> sub.isPremium() ? "PREMIUM" : "FREE")
                .orElse("FREE");

        return new UserResult(user.getId(), user.getEmail(), user.getName(), plan);
    }
}
