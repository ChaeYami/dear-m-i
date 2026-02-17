package com.dearmi.backend.application.notification;

import com.dearmi.backend.domain.notification.Notification;
import com.dearmi.backend.domain.notification.NotificationRepository;
import com.dearmi.backend.domain.notification.NotificationType;
import com.dearmi.backend.infrastructure.external.fcm.FcmService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.MessageSource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;

/**
 * 알림 히스토리 DB 기록 + FCM 발송을 함께 처리.
 *
 * NotificationScheduler 의 4개 발송 지점이 이 서비스를 경유한다.
 * 순서: DB insert (히스토리) → i18n 해석 → FCM push.
 * FCM 발송이 실패해도 히스토리는 남으므로 사용자가 앱에서 확인할 수 있다.
 *
 * MEDICATION 타입의 경우 iOS 액션 버튼(복용/건너뜀)을 위해 APNs category 를 지정한다.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class NotificationSender {

    /** iOS/Android 공통 카테고리 식별자. 클라이언트의 setNotificationCategoryAsync 와 매칭된다. */
    private static final String MEDICATION_CATEGORY = "MEDICATION_REMINDER";

    private final NotificationRepository notificationRepository;
    private final FcmService fcmService;
    private final MessageSource messageSource;

    /**
     * 알림 생성 + 전송.
     *
     * @param userId       수신자
     * @param type         알림 유형
     * @param titleKey     title i18n 키 (예: "notification.medication.reminder.title")
     * @param titleParams  title 보간 파라미터 (순서대로 {0}, {1}, ... 로 매핑)
     * @param bodyKey      body i18n 키
     * @param bodyParams   body 보간 파라미터
     * @param resourceId   연결된 리소스 id (hospital_schedule / medication_schedule). CHECKIN 은 null.
     * @param timeSlot     MEDICATION 전용 슬롯. 그 외에는 null.
     * @param fcmToken     수신자 FCM 토큰 (없으면 push 생략 — 히스토리는 저장)
     * @param locale       push 발송 시 i18n 해석에 사용할 로케일
     * @param pushData     FCM data payload (딥링크용). MEDICATION 의 경우 logDate/categoryIdentifier 가 자동 추가된다.
     */
    @Transactional
    public void sendAndLog(
            UUID userId,
            NotificationType type,
            String titleKey,
            List<String> titleParams,
            String bodyKey,
            List<String> bodyParams,
            UUID resourceId,
            String timeSlot,
            String fcmToken,
            Locale locale,
            Map<String, String> pushData
    ) {
        notificationRepository.save(
                Notification.builder()
                        .userId(userId)
                        .type(type)
                        .titleKey(titleKey)
                        .titleParams(titleParams)
                        .bodyKey(bodyKey)
                        .bodyParams(bodyParams)
                        .resourceId(resourceId)
                        .timeSlot(timeSlot)
                        .build()
        );

        String title = messageSource.getMessage(titleKey, titleParams.toArray(), locale);
        String body = messageSource.getMessage(bodyKey, bodyParams.toArray(), locale);

        // MEDICATION: iOS 액션 버튼용 카테고리 + Android 매칭용 categoryIdentifier
        String apnsCategory = null;
        Map<String, String> finalData = pushData;
        if (type == NotificationType.MEDICATION) {
            apnsCategory = MEDICATION_CATEGORY;
            java.util.HashMap<String, String> enriched = new java.util.HashMap<>(pushData == null ? Map.of() : pushData);
            enriched.put("categoryIdentifier", MEDICATION_CATEGORY);
            finalData = enriched;
        }

        fcmService.sendNotification(fcmToken, title, body, finalData, apnsCategory);
    }
}
