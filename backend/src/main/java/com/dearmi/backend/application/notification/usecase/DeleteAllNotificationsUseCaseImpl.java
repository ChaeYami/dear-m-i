package com.dearmi.backend.application.notification.usecase;

import com.dearmi.backend.domain.notification.NotificationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class DeleteAllNotificationsUseCaseImpl implements DeleteAllNotificationsUseCase {

    private final NotificationRepository notificationRepository;

    @Override
    @Transactional
    public int deleteAll(UUID userId) {
        return notificationRepository.softDeleteAllByUserId(userId);
    }
}
