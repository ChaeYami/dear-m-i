package com.dearmi.backend.infrastructure.batch;

import com.dearmi.backend.domain.hospital.HospitalSchedule;
import com.dearmi.backend.domain.hospital.HospitalScheduleRepository;
import com.dearmi.backend.domain.notification.NotificationSetting;
import com.dearmi.backend.domain.notification.NotificationSettingRepository;
import com.dearmi.backend.domain.user.User;
import com.dearmi.backend.domain.user.UserRepository;
import com.dearmi.backend.infrastructure.external.fcm.FcmService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;
import java.util.Optional;

/**
 * 병원 일정 D-1 / D-0 푸시 알림 스케줄러
 * 매일 오전 9시 (Asia/Seoul) 실행
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class NotificationScheduler {

    private static final DateTimeFormatter TIME_FMT = DateTimeFormatter.ofPattern("HH:mm");

    private final HospitalScheduleRepository hospitalScheduleRepository;
    private final NotificationSettingRepository notificationSettingRepository;
    private final UserRepository userRepository;
    private final FcmService fcmService;

    @Scheduled(cron = "0 0 9 * * *", zone = "Asia/Seoul")
    public void sendScheduleNotifications() {
        LocalDate today = LocalDate.now();
        log.info("알림 스케줄러 실행: date={}", today);

        sendDayBeforeNotifications(today);
        sendDayOfNotifications(today);
    }

    /** D-1: 내일 예약된 일정 알림 */
    private void sendDayBeforeNotifications(LocalDate today) {
        LocalDate tomorrow = today.plusDays(1);
        LocalDateTime from = tomorrow.atStartOfDay();
        LocalDateTime to   = tomorrow.plusDays(1).atStartOfDay();

        List<HospitalSchedule> schedules =
                hospitalScheduleRepository.findByScheduledAtBetweenAndDeletedAtIsNull(from, to);

        log.info("D-1 알림 대상 일정: {}건", schedules.size());

        for (HospitalSchedule schedule : schedules) {
            Optional<NotificationSetting> settingOpt =
                    notificationSettingRepository.findByUserId(schedule.getUserId());

            if (settingOpt.isEmpty()) continue;
            NotificationSetting setting = settingOpt.get();
            if (!Boolean.TRUE.equals(setting.getEnabled()) || !Boolean.TRUE.equals(setting.getDayBefore())) continue;

            Optional<User> userOpt = userRepository.findByIdAndDeletedAtIsNull(schedule.getUserId());
            if (userOpt.isEmpty()) continue;
            User user = userOpt.get();

            fcmService.sendNotification(
                    user.getFcmToken(),
                    "내일 " + schedule.getHospitalName() + " 예약이 있어요",
                    "잊지 말고 준비하세요!",
                    Map.of("scheduleId", schedule.getId().toString(), "type", "DAY_BEFORE")
            );
        }
    }

    /** D-0: 오늘 예약된 일정 알림 */
    private void sendDayOfNotifications(LocalDate today) {
        LocalDateTime from = today.atStartOfDay();
        LocalDateTime to   = today.plusDays(1).atStartOfDay();

        List<HospitalSchedule> schedules =
                hospitalScheduleRepository.findByScheduledAtBetweenAndDeletedAtIsNull(from, to);

        log.info("D-0 알림 대상 일정: {}건", schedules.size());

        for (HospitalSchedule schedule : schedules) {
            Optional<NotificationSetting> settingOpt =
                    notificationSettingRepository.findByUserId(schedule.getUserId());

            if (settingOpt.isEmpty()) continue;
            NotificationSetting setting = settingOpt.get();
            if (!Boolean.TRUE.equals(setting.getEnabled()) || !Boolean.TRUE.equals(setting.getDayOf())) continue;

            Optional<User> userOpt = userRepository.findByIdAndDeletedAtIsNull(schedule.getUserId());
            if (userOpt.isEmpty()) continue;
            User user = userOpt.get();

            String timeStr = schedule.getScheduledAt().format(TIME_FMT);

            fcmService.sendNotification(
                    user.getFcmToken(),
                    "오늘 " + schedule.getHospitalName() + " 예약이 있어요",
                    timeStr + "에 예약되어 있습니다",
                    Map.of("scheduleId", schedule.getId().toString(), "type", "DAY_OF")
            );
        }
    }
}
