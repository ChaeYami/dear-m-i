package com.dearmi.backend.presentation.notification;

import com.dearmi.backend.application.notification.usecase.DeleteAllNotificationsUseCase;
import com.dearmi.backend.application.notification.usecase.DeleteNotificationUseCase;
import com.dearmi.backend.application.notification.usecase.GetNotificationSettingUseCase;
import com.dearmi.backend.application.notification.usecase.GetNotificationsUseCase;
import com.dearmi.backend.application.notification.usecase.GetUnreadCountUseCase;
import com.dearmi.backend.application.notification.usecase.MarkAllNotificationsReadUseCase;
import com.dearmi.backend.application.notification.usecase.MarkNotificationReadUseCase;
import com.dearmi.backend.application.notification.usecase.UpdateFcmTokenUseCase;
import com.dearmi.backend.application.notification.usecase.UpdateNotificationSettingUseCase;
import com.dearmi.backend.common.response.ApiResponse;
import com.dearmi.backend.common.response.PageResponse;
import com.dearmi.backend.infrastructure.security.AuthenticatedUserId;
import com.dearmi.backend.presentation.notification.dto.FcmTokenRequest;
import com.dearmi.backend.presentation.notification.dto.NotificationResponse;
import com.dearmi.backend.presentation.notification.dto.NotificationSettingResponse;
import com.dearmi.backend.presentation.notification.dto.UnreadCountResponse;
import com.dearmi.backend.presentation.notification.dto.UpdateSettingRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final UpdateFcmTokenUseCase updateFcmTokenUseCase;
    private final GetNotificationSettingUseCase getNotificationSettingUseCase;
    private final UpdateNotificationSettingUseCase updateNotificationSettingUseCase;
    private final GetNotificationsUseCase getNotificationsUseCase;
    private final GetUnreadCountUseCase getUnreadCountUseCase;
    private final MarkNotificationReadUseCase markNotificationReadUseCase;
    private final MarkAllNotificationsReadUseCase markAllNotificationsReadUseCase;
    private final DeleteNotificationUseCase deleteNotificationUseCase;
    private final DeleteAllNotificationsUseCase deleteAllNotificationsUseCase;

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
                                userId, request.enabled(), request.dayBefore(), request.dayOf(), request.medEnabled()
                        )
                )
        );
    }

    /** GET /api/v1/notifications?page=&size= — 알림 히스토리 페이지 조회 (최신순) */
    @GetMapping
    public ApiResponse<PageResponse<NotificationResponse>> getHistory(
            @AuthenticatedUserId UUID userId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        return ApiResponse.success(
                PageResponse.from(
                        getNotificationsUseCase.getNotifications(userId, page, size)
                                .map(NotificationResponse::from)
                )
        );
    }

    /** GET /api/v1/notifications/unread-count — 안 읽은 알림 개수 (벨 인디케이터용) */
    @GetMapping("/unread-count")
    public ApiResponse<UnreadCountResponse> getUnreadCount(
            @AuthenticatedUserId UUID userId
    ) {
        return ApiResponse.success(new UnreadCountResponse(getUnreadCountUseCase.getUnreadCount(userId)));
    }

    /** PATCH /api/v1/notifications/{id}/read — 단일 알림 읽음 처리 */
    @PatchMapping("/{id}/read")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void markRead(
            @AuthenticatedUserId UUID userId,
            @PathVariable UUID id
    ) {
        markNotificationReadUseCase.markRead(userId, id);
    }

    /** PATCH /api/v1/notifications/read-all — 모든 알림 읽음 처리 */
    @PatchMapping("/read-all")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void markAllRead(
            @AuthenticatedUserId UUID userId
    ) {
        markAllNotificationsReadUseCase.markAllRead(userId);
    }

    /** DELETE /api/v1/notifications/{id} — 단일 알림 삭제 (소프트) */
    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteNotification(
            @AuthenticatedUserId UUID userId,
            @PathVariable UUID id
    ) {
        deleteNotificationUseCase.delete(userId, id);
    }

    /** DELETE /api/v1/notifications — 모든 알림 삭제 (소프트) */
    @DeleteMapping
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteAll(
            @AuthenticatedUserId UUID userId
    ) {
        deleteAllNotificationsUseCase.deleteAll(userId);
    }
}
