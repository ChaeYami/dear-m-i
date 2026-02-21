package com.dearmi.backend.presentation.subscription;

import com.dearmi.backend.application.subscription.usecase.HandleAppleNotificationUseCase;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

/**
 * POST /api/v1/webhooks/apple
 * Apple Server-to-Server Notifications 수신 엔드포인트.
 * Apple 이 구독 갱신/만료/환불/취소 이벤트를 이 URL 로 전송.
 */
@RestController
@RequestMapping("/api/v1/webhooks")
@RequiredArgsConstructor
public class AppleNotificationController {

    private final HandleAppleNotificationUseCase handleAppleNotificationUseCase;

    @PostMapping("/apple")
    public void handleAppleNotification(@RequestBody Map<String, String> body) {
        String signedPayload = body.get("signedPayload");
        if (signedPayload == null || signedPayload.isBlank()) {
            return;
        }
        handleAppleNotificationUseCase.handle(signedPayload);
    }
}
