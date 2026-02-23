package com.dearmi.backend.infrastructure.batch;

import com.dearmi.backend.application.notification.NotificationSender;
import com.dearmi.backend.domain.checkin.DailyCheckinRepository;
import com.dearmi.backend.domain.hospital.HospitalSchedule;
import com.dearmi.backend.domain.hospital.HospitalScheduleRepository;
import com.dearmi.backend.domain.medication.MedicationSchedule;
import com.dearmi.backend.domain.medication.MedicationScheduleRepository;
import com.dearmi.backend.domain.medication.MedicationLogRepository;
import com.dearmi.backend.domain.medication.MedicationSlotGroup;
import com.dearmi.backend.domain.medication.MedicationSlotGroupRepository;
import com.dearmi.backend.domain.medication.TimeSlot;
import com.dearmi.backend.domain.notification.NotificationSetting;
import com.dearmi.backend.domain.notification.NotificationSettingRepository;
import com.dearmi.backend.domain.notification.NotificationType;
import com.dearmi.backend.domain.prepnote.PrepNoteRepository;
import com.dearmi.backend.domain.user.User;
import com.dearmi.backend.domain.user.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import net.javacrumbs.shedlock.spring.annotation.SchedulerLock;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

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
    private final MedicationSlotGroupRepository slotGroupRepository;
    private final DailyCheckinRepository dailyCheckinRepository;
    private final PrepNoteRepository prepNoteRepository;
    private final UserRepository userRepository;
    private final NotificationSender notificationSender;

    // ──────────────────────────────────────────────────────────────────────────
    // 병원 일정 알림 (매일 오전 9시)
    // ──────────────────────────────────────────────────────────────────────────

    @Scheduled(cron = "0 0 9 * * *", zone = "Asia/Seoul")
    @SchedulerLock(
            name = "sendScheduleNotifications",
            lockAtMostFor = "PT5M",      // 최대 5분간 잠금 (태스크가 죽어도 5분 뒤에는 락 해제)
            lockAtLeastFor = "PT1M"       // 최소 1분 — 짧은 재시작 중 중복 실행 방지
    )
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
    @SchedulerLock(
            name = "sendCheckinReminders",
            lockAtMostFor = "PT50S",     // cron 주기(1분) 보다 짧게 — 다음 tick 전에 반드시 락 해제
            lockAtLeastFor = "PT50S"     // 한 tick 당 한 인스턴스만 실행
    )
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
    @SchedulerLock(
            name = "sendMedicationReminders",
            lockAtMostFor = "PT50S",
            lockAtLeastFor = "PT50S"
    )
    public void sendMedicationReminders() {
        LocalTime now   = LocalTime.now(SEOUL).truncatedTo(ChronoUnit.MINUTES);
        LocalDate today = LocalDate.now(SEOUL);

        // 활성 일정 풀스캔 → 분 정확히 매치되는 일정만 가져오는 due-only 쿼리.
        // partial index (V17) 가 (slot_time) WHERE slot=true AND deleted_at IS NULL 구조로 색인.
        List<MedicationSchedule> schedules = medicationScheduleRepository.findDueForMinute(today, now);
        if (schedules.isEmpty()) return;

        // 그룹 번들: key=(userId, groupId, slot) → 약품 목록
        record GroupKey(UUID userId, UUID groupId, TimeSlot slot) {}
        Map<GroupKey, List<MedicationSchedule>> bundled = new LinkedHashMap<>();

        for (MedicationSchedule schedule : schedules) {
            Optional<NotificationSetting> settingOpt =
                    notificationSettingRepository.findByUserId(schedule.getUserId());
            if (settingOpt.isEmpty() || !Boolean.TRUE.equals(settingOpt.get().getMedEnabled())) continue;

            Optional<User> userOpt = userRepository.findByIdAndDeletedAtIsNull(schedule.getUserId());
            if (userOpt.isEmpty()) continue;
            User user = userOpt.get();

            for (TimeSlot slot : TimeSlot.values()) {
                if (!isSlotEnabled(schedule, slot)) continue;
                LocalTime slotTime = getSlotTime(schedule, slot);
                if (slotTime == null || !slotTime.truncatedTo(ChronoUnit.MINUTES).equals(now)) continue;
                if (medicationLogRepository.existsByMedicationScheduleIdAndLogDateAndTimeSlot(
                        schedule.getId(), today, slot.name())) continue;

                UUID groupId = schedule.getGroupId(slot);
                if (groupId != null) {
                    bundled.computeIfAbsent(new GroupKey(schedule.getUserId(), groupId, slot),
                            k -> new ArrayList<>()).add(schedule);
                } else {
                    sendIndividualMedNotification(schedule, slot, today, user);
                }
            }
        }

        // 그룹 번들 알림 발송
        for (Map.Entry<GroupKey, List<MedicationSchedule>> entry : bundled.entrySet()) {
            GroupKey key = entry.getKey();
            Optional<User> userOpt = userRepository.findByIdAndDeletedAtIsNull(key.userId());
            if (userOpt.isEmpty()) continue;
            User user = userOpt.get();

            String groupName = slotGroupRepository
                    .findByIdAndUserIdAndDeletedAtIsNull(key.groupId(), key.userId())
                    .map(MedicationSlotGroup::getGroupName)
                    .orElse(key.slot().name());
            List<String> drugNames = entry.getValue().stream()
                    .map(MedicationSchedule::getDrugName)
                    .collect(Collectors.toList());
            String drugList = String.join(", ", drugNames);

            log.debug("그룹 복약 알림 발송: userId={}, group={}, drugs={}", key.userId(), groupName, drugList);
            Locale locale = toLocale(user.getPreferredLocale());
            notificationSender.sendAndLog(
                    user.getId(),
                    NotificationType.MEDICATION,
                    "notification.medication.group.reminder.title",
                    List.of(groupName),
                    "notification.medication.group.reminder.body",
                    List.of(drugList),
                    null,
                    key.slot().name(),
                    user.getFcmToken(),
                    locale,
                    Map.of(
                            "groupId",  key.groupId().toString(),
                            "timeSlot", key.slot().name(),
                            "logDate",  today.toString(),
                            "type",     "MEDICATION_GROUP"
                    )
            );
        }
    }

    private boolean isSlotEnabled(MedicationSchedule s, TimeSlot slot) {
        return Boolean.TRUE.equals(switch (slot) {
            case MORNING   -> s.getMorning();
            case AFTERNOON -> s.getAfternoon();
            case EVENING   -> s.getEvening();
            case BEDTIME   -> s.getBedtime();
        });
    }

    private LocalTime getSlotTime(MedicationSchedule s, TimeSlot slot) {
        return switch (slot) {
            case MORNING   -> s.getMorningTime();
            case AFTERNOON -> s.getAfternoonTime();
            case EVENING   -> s.getEveningTime();
            case BEDTIME   -> s.getBedtimeTime();
        };
    }

    private void sendIndividualMedNotification(MedicationSchedule schedule, TimeSlot slot,
                                                LocalDate today, User user) {
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
