package com.dearmi.backend.infrastructure.persistence;

import com.dearmi.backend.domain.notification.Notification;
import com.dearmi.backend.domain.notification.NotificationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
@RequiredArgsConstructor
public class NotificationRepositoryImpl implements NotificationRepository {

    private final NotificationJpaRepository jpa;

    @Override
    public Notification save(Notification notification) {
        return jpa.save(notification);
    }

    @Override
    public Optional<Notification> findByIdAndUserIdAndDeletedAtIsNull(UUID id, UUID userId) {
        return jpa.findByIdAndUserIdAndDeletedAtIsNull(id, userId);
    }

    @Override
    public List<Notification> findPageByUserId(UUID userId, int offset, int size) {
        return jpa.findPageByUserId(userId, offset, size);
    }

    @Override
    public long countByUserId(UUID userId) {
        return jpa.countByUserId(userId);
    }

    @Override
    public long countUnreadByUserId(UUID userId) {
        return jpa.countUnreadByUserId(userId);
    }

    @Override
    public int markAllReadByUserId(UUID userId) {
        return jpa.markAllReadByUserId(userId, LocalDateTime.now());
    }

    @Override
    public int clearResourceId(UUID resourceId) {
        return jpa.clearResourceId(resourceId);
    }
}
