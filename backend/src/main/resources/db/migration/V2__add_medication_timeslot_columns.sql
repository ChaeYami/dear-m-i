-- ============================================================
-- V2: 복약 일정 시간대 컬럼 + 복약 로그 날짜/시간대 컬럼 추가
-- ============================================================

-- medication_schedules: 시간대별 복약 설정 컬럼 추가
ALTER TABLE medication_schedules
    ADD COLUMN prescription_medication_id UUID REFERENCES prescription_medications(id) ON DELETE SET NULL,
    ADD COLUMN morning        BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN afternoon      BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN evening        BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN bedtime        BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN morning_time   TIME,
    ADD COLUMN afternoon_time TIME,
    ADD COLUMN evening_time   TIME,
    ADD COLUMN bedtime_time   TIME;

CREATE INDEX idx_medication_schedules_prescription_medication_id
    ON medication_schedules(prescription_medication_id);

-- medication_logs: taken_at nullable 허용 (SKIPPED 상태는 실제 복약 시각 없음)
ALTER TABLE medication_logs
    ALTER COLUMN taken_at DROP NOT NULL;

-- medication_logs: 날짜 + 시간대 컬럼 추가 (UPSERT 기준)
ALTER TABLE medication_logs
    ADD COLUMN log_date  DATE        NOT NULL DEFAULT CURRENT_DATE,
    ADD COLUMN time_slot VARCHAR(20) NOT NULL DEFAULT 'MORNING';

-- 같은 일정 + 날짜 + 시간대 중복 방지 (UPSERT 기준 키)
ALTER TABLE medication_logs
    ADD CONSTRAINT uq_medication_log_slot
        UNIQUE (medication_schedule_id, log_date, time_slot);

CREATE INDEX idx_medication_logs_log_date ON medication_logs(log_date);
