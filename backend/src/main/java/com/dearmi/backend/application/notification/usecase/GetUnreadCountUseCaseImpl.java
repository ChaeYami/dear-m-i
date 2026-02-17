package com.dearmi.backend.application.notification.usecase;

import com.dearmi.backend.domain.notification.NotificationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class GetUnreadCountUseCaseImpl implements GetUnreadCountUseCase {

    private final NotificationRepository notificationRepository;

    @Override
    @Transactional(readOnly = true)
    public long getUnreadCount(UUID userId) {
        return notificationRepository.countUnreadByUserId(userId);
    }
}
