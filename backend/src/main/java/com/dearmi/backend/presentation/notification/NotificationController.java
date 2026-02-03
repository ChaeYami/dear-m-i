package com.dearmi.backend.presentation.notification;

import com.dearmi.backend.application.notification.usecase.GetNotificationSettingUseCase;
import com.dearmi.backend.application.notification.usecase.UpdateFcmTokenUseCase;
import com.dearmi.backend.application.notification.usecase.UpdateNotificationSettingUseCase;
import com.dearmi.backend.common.response.ApiResponse;
import com.dearmi.backend.infrastructure.security.AuthenticatedUserId;
import com.dearmi.backend.presentation.notification.dto.FcmTokenRequest;
import com.dearmi.backend.presentation.notification.dto.NotificationSettingResponse;
import com.dearmi.backend.presentation.notification.dto.UpdateSettingRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final UpdateFcmTokenUseCase updateFcmTokenUseCase;
    private final GetNotificationSettingUseCase getNotificationSettingUseCase;
    private final UpdateNotificationSettingUseCase updateNotificationSettingUseCase;

    /** POST /api/v1/notifications/token — FCM 토큰 등록/갱신 */
    @PostMapping("/token")
    public ApiResponse<Void> updateToken(
            @AuthenticatedUserId UUID userId,
            @Valid @RequestBody FcmTokenRequest request
    ) {
        updateFcmTokenUseCase.updateToken(userId, request.fcmToken());
        return ApiResponse.success();
    }

    /** GET /api/v1/notifications/settings — 알림 설정 조회 */
    @GetMapping("/settings")
    public ApiResponse<NotificationSettingResponse> getSettings(
            @AuthenticatedUserId UUID userId
    ) {
        return ApiResponse.success(
                NotificationSettingResponse.from(getNotificationSettingUseCase.getSetting(userId))
        );
    }

    /** PUT /api/v1/notifications/settings — 알림 설정 변경 */
    @PutMapping("/settings")
    public ApiResponse<NotificationSettingResponse> updateSettings(
            @AuthenticatedUserId UUID userId,
            @Valid @RequestBody UpdateSettingRequest request
    ) {
        return ApiResponse.success(
                NotificationSettingResponse.from(
                        updateNotificationSettingUseCase.updateSetting(
                                userId, request.enabled(), request.dayBefore(), request.dayOf()
                        )
                )
        );
    }
}
