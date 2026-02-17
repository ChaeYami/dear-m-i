package com.dearmi.backend.infrastructure.external.fcm;

import com.google.auth.oauth2.GoogleCredentials;
import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;
import com.google.firebase.messaging.ApnsConfig;
import com.google.firebase.messaging.Aps;
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
     * FCM 푸시 알림 발송
     * 실패해도 예외를 던지지 않음 — 알림 실패가 핵심 기능을 막으면 안 됨
     *
     * @param fcmToken           디바이스 FCM 토큰
     * @param title              알림 제목
     * @param body               알림 본문
     * @param data               추가 데이터 (key-value), null 가능. data 의 `categoryIdentifier` 는
     *                           Android(expo-notifications) 에서 카테고리 매칭에 사용된다.
     * @param apnsCategoryId     iOS 알림 카테고리 식별자 — UNNotificationCategory.identifier.
     *                           null 이면 카테고리 미지정.
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
            Message.Builder builder = Message.builder()
                    .setToken(fcmToken)
                    .setNotification(Notification.builder()
                            .setTitle(title)
                            .setBody(body)
                            .build());

            if (data != null && !data.isEmpty()) {
                builder.putAllData(data);
            }

            if (StringUtils.hasText(apnsCategoryId)) {
                builder.setApnsConfig(
                        ApnsConfig.builder()
                                .setAps(Aps.builder()
                                        .setCategory(apnsCategoryId)
                                        .build())
                                .build()
                );
            }

            String messageId = FirebaseMessaging.getInstance().send(builder.build());
            log.debug("FCM 발송 성공: messageId={}, title={}", messageId, title);
        } catch (Exception e) {
            log.warn("FCM 발송 실패 (무시): fcmToken={}..., title={}, error={}",
                    fcmToken.substring(0, Math.min(10, fcmToken.length())), title, e.getMessage());
        }
    }
}
