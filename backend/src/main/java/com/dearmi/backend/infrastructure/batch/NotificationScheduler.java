package com.dearmi.backend.infrastructure.batch;

import com.dearmi.backend.application.notification.NotificationSender;
import com.dearmi.backend.domain.checkin.DailyCheckinRepository;
import com.dearmi.backend.domain.hospital.HospitalSchedule;
import com.dearmi.backend.domain.hospital.HospitalScheduleRepository;
import com.dearmi.backend.domain.medication.MedicationSchedule;
import com.dearmi.backend.domain.medication.MedicationScheduleRepository;
import com.dearmi.backend.domain.medication.MedicationLogRepository;
import com.dearmi.backend.domain.medication.TimeSlot;
import com.dearmi.backend.domain.notification.NotificationSetting;
import com.dearmi.backend.domain.notification.NotificationSettingRepository;
import com.dearmi.backend.domain.notification.NotificationType;
import com.dearmi.backend.domain.prepnote.PrepNoteRepository;
import com.dearmi.backend.domain.user.User;
import com.dearmi.backend.domain.user.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;

/**
 * 병원 일정 D-1/D-0 + 체크인 리마인더 + 복약 알림 스케줄러.
 * 각 발송 지점은 NotificationSender 를 통해 히스토리 저장 후 FCM 푸시를 수행한다.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class NotificationScheduler {

    private static final ZoneId SEOUL = ZoneId.of("Asia/Seoul");
    private static final DateTimeFormatter TIME_FMT = DateTimeFormatter.ofPattern("HH:mm");

    private final HospitalScheduleRepository hospitalScheduleRepository;
    private final NotificationSettingRepository notificationSettingRepository;
    private final MedicationScheduleRepository medicationScheduleRepository;
    private final MedicationLogRepository medicationLogRepository;
    private final DailyCheckinRepository dailyCheckinRepository;
    private final PrepNoteRepository prepNoteRepository;
    private final UserRepository userRepository;
    private final NotificationSender notificationSender;

    // ──────────────────────────────────────────────────────────────────────────
    // 병원 일정 알림 (매일 오전 9시)
    // ──────────────────────────────────────────────────────────────────────────

    @Scheduled(cron = "0 0 9 * * *", zone = "Asia/Seoul")
    public void sendScheduleNotifications() {
        LocalDate today = LocalDate.now(SEOUL);
        log.info("병원 알림 스케줄러 실행: date={}", today);

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

            Locale locale = toLocale(user.getPreferredLocale());
            notificationSender.sendAndLog(
                    user.getId(),
                    NotificationType.DAY_BEFORE,
                    "notification.schedule.day.before.title",
                    List.of(schedule.getHospitalName()),
                    "notification.schedule.day.before.body",
                    List.of(),
                    schedule.getId(),
                    null,
                    user.getFcmToken(),
                    locale,
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

            Locale locale = toLocale(user.getPreferredLocale());
            String timeStr = schedule.getScheduledAt().format(TIME_FMT);
            boolean hasPrepNotes = prepNoteRepository.existsByScheduleIdAndDeletedAtIsNull(schedule.getId());
            String bodyKey = hasPrepNotes
                    ? "notification.schedule.day.of.body.with.prep"
                    : "notification.schedule.day.of.body";

            notificationSender.sendAndLog(
                    user.getId(),
                    NotificationType.DAY_OF,
                    "notification.schedule.day.of.title",
                    List.of(schedule.getHospitalName()),
                    bodyKey,
                    List.of(timeStr),
                    schedule.getId(),
                    null,
                    user.getFcmToken(),
                    locale,
                    Map.of("scheduleId", schedule.getId().toString(), "type", "DAY_OF")
            );
        }
    }

    // ──────────────────────────────────────────────────────────────────────────
    // 체크인 리마인더 (매분 실행 — 유저별 checkin_time 커스텀 지원)
    // ──────────────────────────────────────────────────────────────────────────

    @Scheduled(cron = "0 * * * * *", zone = "Asia/Seoul")
    public void sendCheckinReminders() {
        LocalTime now   = LocalTime.now(SEOUL).truncatedTo(ChronoUnit.MINUTES);
        LocalDate today = LocalDate.now(SEOUL);

        List<NotificationSetting> settings =
                notificationSettingRepository.findCheckinEnabledByCheckinTime(now);

        if (settings.isEmpty()) return;
        log.info("체크인 알림 대상: {}명 (time={})", settings.size(), now);

        for (NotificationSetting setting : settings) {
            if (dailyCheckinRepository.existsByUserIdAndCheckedAt(setting.getUserId(), today)) continue;

            Optional<User> userOpt = userRepository.findByIdAndDeletedAtIsNull(setting.getUserId());
            if (userOpt.isEmpty()) continue;
            User user = userOpt.get();

            Locale locale = toLocale(user.getPreferredLocale());
            notificationSender.sendAndLog(
                    user.getId(),
                    NotificationType.CHECKIN,
                    "notification.checkin.reminder.title",
                    List.of(),
                    "notification.checkin.reminder.body",
                    List.of(),
                    null,
                    null,
                    user.getFcmToken(),
                    locale,
                    Map.of("type", "CHECKIN")
            );
        }
    }

    // ──────────────────────────────────────────────────────────────────────────
    // 복약 알림 (매분 실행 — 시간대별 복약 시각과 현재 시각 비교)
    // ──────────────────────────────────────────────────────────────────────────

    @Scheduled(cron = "0 * * * * *", zone = "Asia/Seoul")
    public void sendMedicationReminders() {
        LocalTime now   = LocalTime.now(SEOUL).truncatedTo(ChronoUnit.MINUTES);
        LocalDate today = LocalDate.now(SEOUL);

        List<MedicationSchedule> schedules = medicationScheduleRepository.findActiveForDate(today);
        if (schedules.isEmpty()) return;

        for (MedicationSchedule schedule : schedules) {
            Optional<NotificationSetting> settingOpt =
                    notificationSettingRepository.findByUserId(schedule.getUserId());
            if (settingOpt.isEmpty() || !Boolean.TRUE.equals(settingOpt.get().getMedEnabled())) continue;

            Optional<User> userOpt = userRepository.findByIdAndDeletedAtIsNull(schedule.getUserId());
            if (userOpt.isEmpty()) continue;
            User user = userOpt.get();

            sendMedSlot(schedule, TimeSlot.MORNING,   schedule.getMorning(),   schedule.getMorningTime(),   now, today, user);
            sendMedSlot(schedule, TimeSlot.AFTERNOON, schedule.getAfternoon(), schedule.getAfternoonTime(), now, today, user);
            sendMedSlot(schedule, TimeSlot.EVENING,   schedule.getEvening(),   schedule.getEveningTime(),   now, today, user);
            sendMedSlot(schedule, TimeSlot.BEDTIME,   schedule.getBedtime(),   schedule.getBedtimeTime(),   now, today, user);
        }
    }

    private void sendMedSlot(MedicationSchedule schedule, TimeSlot slot,
                              Boolean enabled, LocalTime slotTime,
                              LocalTime now, LocalDate today, User user) {
        if (!Boolean.TRUE.equals(enabled)) return;
        if (slotTime == null) return;
        if (!slotTime.truncatedTo(ChronoUnit.MINUTES).equals(now)) return;

        if (medicationLogRepository.existsByMedicationScheduleIdAndLogDateAndTimeSlot(
                schedule.getId(), today, slot.name())) return;

        log.debug("복약 알림 발송: userId={}, drug={}, slot={}", schedule.getUserId(), schedule.getDrugName(), slot);

        Locale locale = toLocale(user.getPreferredLocale());
        notificationSender.sendAndLog(
                user.getId(),
                NotificationType.MEDICATION,
                "notification.medication.reminder.title",
                List.of(schedule.getDrugName()),
                "notification.medication.reminder.body",
                List.of(),
                schedule.getId(),
                slot.name(),
                user.getFcmToken(),
                locale,
                Map.of(
                        "scheduleId", schedule.getId().toString(),
                        "timeSlot",   slot.name(),
                        "logDate",    today.toString(),
                        "type",       "MEDICATION"
                )
        );
    }

    private Locale toLocale(String preferredLocale) {
        if (StringUtils.hasText(preferredLocale) && preferredLocale.startsWith("ko")) {
            return Locale.KOREAN;
        }
        return Locale.ENGLISH;
    }
}
