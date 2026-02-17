package com.dearmi.backend.application.notification.usecase;

import com.dearmi.backend.application.notification.dto.NotificationResult;
import com.dearmi.backend.application.record.dto.PageResult;
import com.dearmi.backend.domain.notification.Notification;
import com.dearmi.backend.domain.notification.NotificationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class GetNotificationsUseCaseImpl implements GetNotificationsUseCase {

    private final NotificationRepository notificationRepository;

    @Override
    @Transactional(readOnly = true)
    public PageResult<NotificationResult> getNotifications(UUID userId, int page, int size) {
        int offset = page * size;
        List<Notification> notifications = notificationRepository.findPageByUserId(userId, offset, size);
        long total = notificationRepository.countByUserId(userId);

        List<NotificationResult> content = notifications.stream()
                .map(NotificationResult::from)
                .toList();

        return PageResult.of(content, page, size, total);
    }
}
