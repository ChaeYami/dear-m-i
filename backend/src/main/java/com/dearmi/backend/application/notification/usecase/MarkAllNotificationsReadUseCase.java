package com.dearmi.backend.application.notification.usecase;

import java.util.UUID;

public interface MarkAllNotificationsReadUseCase {
    /** 해당 유저의 모든 안 읽은 알림을 읽음 처리. 반환값은 업데이트된 행 수. */
    int markAllRead(UUID userId);
}
