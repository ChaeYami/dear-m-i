package com.dearmi.backend.application.notification.usecase;

import java.util.UUID;

public interface UpdateFcmTokenUseCase {
    void updateToken(UUID userId, String fcmToken);
}
