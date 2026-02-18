-- ============================================================
-- V17: 매분 복약 알림 잡(NotificationScheduler.sendMedicationReminders) 용 partial index
--
-- findDueForMinute 가 OR 조건으로 4개 시간 컬럼을 비교하므로
-- 각 슬롯별 partial index 를 만들어 매분 풀스캔 비용을 제거한다.
-- (실제 실행계획에선 PostgreSQL 이 BitmapOr 로 4개 인덱스를 합쳐 사용)
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_medication_schedules_morning_time
    ON medication_schedules (morning_time)
    WHERE deleted_at IS NULL AND morning = TRUE;

CREATE INDEX IF NOT EXISTS idx_medication_schedules_afternoon_time
    ON medication_schedules (afternoon_time)
    WHERE deleted_at IS NULL AND afternoon = TRUE;

CREATE INDEX IF NOT EXISTS idx_medication_schedules_evening_time
    ON medication_schedules (evening_time)
    WHERE deleted_at IS NULL AND evening = TRUE;

CREATE INDEX IF NOT EXISTS idx_medication_schedules_bedtime_time
    ON medication_schedules (bedtime_time)
    WHERE deleted_at IS NULL AND bedtime = TRUE;

-- 체크인 리마인더 (notification_settings.checkin_time = :now) 용 인덱스
CREATE INDEX IF NOT EXISTS idx_notification_settings_checkin_time
    ON notification_settings (checkin_time)
    WHERE checkin_enabled = TRUE;
