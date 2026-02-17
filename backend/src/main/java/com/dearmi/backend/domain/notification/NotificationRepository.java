package com.dearmi.backend.domain.notification;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface NotificationRepository {

    Notification save(Notification notification);

    Optional<Notification> findByIdAndUserIdAndDeletedAtIsNull(UUID id, UUID userId);

    List<Notification> findPageByUserId(UUID userId, int offset, int size);

    long countByUserId(UUID userId);

    long countUnreadByUserId(UUID userId);

    /** 해당 유저의 안 읽은 알림을 모두 읽음 처리. 반환값은 업데이트된 행 수. */
    int markAllReadByUserId(UUID userId);

    /** 리소스 삭제 시 역참조를 SET NULL. */
    int clearResourceId(UUID resourceId);
}
