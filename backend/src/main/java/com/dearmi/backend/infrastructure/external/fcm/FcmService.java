package com.dearmi.backend.infrastructure.external.fcm;

import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.client.RestClient;

import java.util.HashMap;
import java.util.Map;

/**
 * Expo Push Service 클라이언트.
 *
 * 클래스명은 호출 측 호환성을 위해 유지 — 실제로는 Firebase 가 아닌 Expo Push API 를 사용.
 * 토큰 형식: `ExponentPushToken[xxxxxxxxxxxxxxxxxxx]` (iOS/Android 공통).
 * Expo 가 내부적으로 APNs/FCM 분배하므로 백엔드는 단일 HTTP 엔드포인트만 호출한다.
 *
 * apnsCategoryId 가 지정되면 Expo `categoryId` 필드로 전달 — iOS 시스템이 액션 버튼 렌더,
 * Android 는 expo-notifications 가 categoryIdentifier 매칭으로 로컬 알림 재빌드.
 */
@Slf4j
@Component
public class FcmService {

    private static final String EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";

    private final RestClient restClient = RestClient.builder()
            .baseUrl(EXPO_PUSH_URL)
            .defaultHeader("Accept", MediaType.APPLICATION_JSON_VALUE)
            .defaultHeader("Accept-Encoding", "gzip, deflate")
            .defaultHeader("Content-Type", MediaType.APPLICATION_JSON_VALUE)
            .build();

    public void sendNotification(String fcmToken, String title, String body, Map<String, String> data) {
        sendNotification(fcmToken, title, body, data, null);
    }

    /**
     * Expo Push 알림 발송. 실패해도 예외를 던지지 않음 — 알림 실패가 핵심 기능을 막으면 안 됨.
     *
     * @param fcmToken       Expo Push 토큰 (ExponentPushToken[...])
     * @param apnsCategoryId 액션 버튼 그룹 식별자 (예: MEDICATION_REMINDER).
     *                       클라이언트의 setNotificationCategoryAsync identifier 와 매칭.
     */
    public void sendNotification(
            String fcmToken,
            String title,
            String body,
            Map<String, String> data,
            String apnsCategoryId
    ) {
        if (!StringUtils.hasText(fcmToken)) {
            log.debug("Expo Push 토큰 없음 — 발송 건너뜀: title={}", title);
            return;
        }

        String tokenPreview = fcmToken.length() > 24
                ? fcmToken.substring(0, 24) + "..."
                : fcmToken;

        try {
            Map<String, Object> payload = new HashMap<>();
            payload.put("to", fcmToken);
            payload.put("title", title);
            payload.put("body", body);
            payload.put("sound", "default");
            payload.put("priority", "high");
            if (data != null && !data.isEmpty()) {
                payload.put("data", data);
            }
            if (StringUtils.hasText(apnsCategoryId)) {
                // iOS: 시스템이 액션 버튼 렌더. Android: expo-notifications 가 카테고리 매칭으로 재빌드.
                payload.put("categoryId", apnsCategoryId);
            }

            Map<?, ?> response = restClient.post()
                    .body(payload)
                    .retrieve()
                    .body(Map.class);

            log.debug("Expo Push 발송 성공: title={}, token={}, response={}",
                    title, tokenPreview, response);
        } catch (Exception e) {
            log.warn("Expo Push 발송 실패 (무시): token={}, title={}, error={}",
                    tokenPreview, title, e.getMessage());
        }
    }
}
