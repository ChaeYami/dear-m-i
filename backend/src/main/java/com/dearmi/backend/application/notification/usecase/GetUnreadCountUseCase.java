package com.dearmi.backend.application.notification.usecase;

import java.util.UUID;

public interface GetUnreadCountUseCase {
    long getUnreadCount(UUID userId);
}
