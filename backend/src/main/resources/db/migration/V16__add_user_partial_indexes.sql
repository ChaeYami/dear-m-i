-- ============================================================
-- V16: 활성 row 조회 최적화용 복합 partial index
--
-- 모든 리스트 쿼리는 (user_id = ? AND deleted_at IS NULL ORDER BY created_at DESC) 형태.
-- 기존 단일 컬럼 인덱스로는 정렬/필터를 위해 추가 sort 가 필요했다.
-- partial index 는 deleted_at IS NULL 행만 색인하므로 활성 row 비율이 높을수록 효율적.
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_counseling_records_user_active_created
    ON counseling_records (user_id, created_at DESC)
    WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_prescriptions_user_active_created
    ON prescriptions (user_id, created_at DESC)
    WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_daily_checkins_user_active_checked
    ON daily_checkins (user_id, checked_at DESC)
    WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_prep_notes_user_active_created
    ON prep_notes (user_id, created_at DESC)
    WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_hospital_schedules_user_active_scheduled
    ON hospital_schedules (user_id, scheduled_at DESC)
    WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_medication_schedules_user_active
    ON medication_schedules (user_id, start_date DESC)
    WHERE deleted_at IS NULL;

-- medication_logs 는 soft delete 없음 — UNIQUE (schedule, log_date, time_slot) 가 이미 있다고 가정.
-- 이력 페이지네이션용 단일 인덱스 추가.
CREATE INDEX IF NOT EXISTS idx_medication_logs_user_taken_desc
    ON medication_logs (user_id, taken_at DESC);
