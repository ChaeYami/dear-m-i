package com.dearmi.backend.infrastructure.external.fcm;

import com.google.auth.oauth2.GoogleCredentials;
import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;
import com.google.firebase.messaging.AndroidConfig;
import com.google.firebase.messaging.ApnsConfig;
import com.google.firebase.messaging.Aps;
import com.google.firebase.messaging.ApsAlert;
import com.google.firebase.messaging.FirebaseMessaging;
import com.google.firebase.messaging.Message;
import com.google.firebase.messaging.Notification;
import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.Map;

/**
 * Firebase Cloud Messaging 푸시 알림 클라이언트
 * 초기화: 환경변수 FCM_SERVICE_ACCOUNT_KEY (서비스 계정 JSON 문자열)
 */
@Slf4j
@Component
public class FcmService {

    @Value("${fcm.service-account-key:}")
    private String serviceAccountKey;

    private boolean initialized = false;

    @PostConstruct
    public void init() {
        if (!StringUtils.hasText(serviceAccountKey) || serviceAccountKey.startsWith("REPLACE_ME")) {
            log.warn("FCM 서비스 계정 키가 설정되지 않았습니다. 알림 기능이 비활성화됩니다.");
            return;
        }
        try {
            if (FirebaseApp.getApps().isEmpty()) {
                GoogleCredentials credentials = GoogleCredentials.fromStream(
                        new ByteArrayInputStream(serviceAccountKey.getBytes(StandardCharsets.UTF_8))
                );
                FirebaseOptions options = FirebaseOptions.builder()
                        .setCredentials(credentials)
                        .build();
                FirebaseApp.initializeApp(options);
            }
            initialized = true;
            log.info("Firebase Admin SDK 초기화 완료");
        } catch (IOException e) {
            log.error("Firebase Admin SDK 초기화 실패: {}", e.getMessage());
        }
    }

    public void sendNotification(String fcmToken, String title, String body, Map<String, String> data) {
        sendNotification(fcmToken, title, body, data, null);
    }

    /**
     * FCM 푸시 알림 발송.
     * 실패해도 예외를 던지지 않음 — 알림 실패가 핵심 기능을 막으면 안 됨.
     *
     * apnsCategoryId 가 지정되면 "액션 버튼이 있는 알림" 으로 간주해
     *   - iOS: APNs alert(title/body) + aps.category 로 시스템이 네이티브 액션 버튼 렌더
     *   - Android: data-only 메시지 (top-level notification 블록 없이 title/message 를 data 로 전달)
     *             → expo-notifications 의 FirebaseMessagingService 가 categoryIdentifier 로 로컬 알림 재빌드
     * 카테고리가 없으면 기존 방식(top-level notification) 으로 양 플랫폼 시스템이 직접 렌더.
     */
    public void sendNotification(
            String fcmToken,
            String title,
            String body,
            Map<String, String> data,
            String apnsCategoryId
    ) {
        if (!initialized) {
            log.debug("FCM 미초기화 — 알림 발송 건너뜀: title={}", title);
            return;
        }
        if (!StringUtils.hasText(fcmToken)) {
            log.debug("FCM 토큰 없음 — 알림 발송 건너뜀: title={}", title);
            return;
        }
        try {
            Message.Builder builder = Message.builder().setToken(fcmToken);
            boolean hasActions = StringUtils.hasText(apnsCategoryId);

            if (hasActions) {
                // iOS: APNs alert + category → 시스템이 액션 버튼 렌더
                builder.setApnsConfig(
                        ApnsConfig.builder()
                                .setAps(Aps.builder()
                                        .setAlert(ApsAlert.builder()
                                                .setTitle(title)
                                                .setBody(body)
                                                .build())
                                        .setCategory(apnsCategoryId)
                                        .setSound("default")
                                        .build())
                                .build()
                );

                // Android: data-only 로 가야 expo-notifications 가 카테고리를 적용한다.
                //   top-level notification 블록을 설정하면 시스템이 직접 렌더해 버려 액션이 붙지 않음.
                Map<String, String> dataOnlyData = new HashMap<>();
                if (data != null) dataOnlyData.putAll(data);
                dataOnlyData.put("title", title);
                dataOnlyData.put("message", body);
                dataOnlyData.put("categoryIdentifier", apnsCategoryId);
                builder.putAllData(dataOnlyData);

                builder.setAndroidConfig(
                        AndroidConfig.builder()
                                .setPriority(AndroidConfig.Priority.HIGH)
                                .build()
                );
            } else {
                // 일반 알림: 양 플랫폼 시스템이 직접 렌더 (간단한 경로)
                builder.setNotification(Notification.builder()
                        .setTitle(title)
                        .setBody(body)
                        .build());
                if (data != null && !data.isEmpty()) {
                    builder.putAllData(data);
                }
            }

            String messageId = FirebaseMessaging.getInstance().send(builder.build());
            log.debug("FCM 발송 성공: messageId={}, title={}, hasActions={}", messageId, title, hasActions);
        } catch (Exception e) {
            log.warn("FCM 발송 실패 (무시): fcmToken={}..., title={}, error={}",
                    fcmToken.substring(0, Math.min(10, fcmToken.length())), title, e.getMessage());
        }
    }
}
