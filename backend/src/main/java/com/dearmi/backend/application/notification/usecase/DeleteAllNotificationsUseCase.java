package com.dearmi.backend.application.notification.usecase;

import java.util.UUID;

public interface DeleteAllNotificationsUseCase {
    /** 해당 유저의 모든 알림을 소프트 삭제. 반환값은 업데이트된 행 수. */
    int deleteAll(UUID userId);
}
