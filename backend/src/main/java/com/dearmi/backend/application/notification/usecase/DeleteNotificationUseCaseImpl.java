package com.dearmi.backend.application.notification.usecase;

import com.dearmi.backend.common.exception.CustomException;
import com.dearmi.backend.common.exception.ErrorCode;
import com.dearmi.backend.domain.notification.Notification;
import com.dearmi.backend.domain.notification.NotificationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class DeleteNotificationUseCaseImpl implements DeleteNotificationUseCase {

    private final NotificationRepository notificationRepository;

    @Override
    @Transactional
    public void delete(UUID userId, UUID notificationId) {
        Notification notification = notificationRepository
                .findByIdAndUserIdAndDeletedAtIsNull(notificationId, userId)
                .orElseThrow(() -> new CustomException(ErrorCode.NOT_FOUND));
        notification.markDeleted();
        notificationRepository.save(notification);
    }
}
