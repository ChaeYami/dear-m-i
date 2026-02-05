-- ============================================================
-- V10: counseling_records 에 consulted_at 컬럼 추가
-- 진료/상담을 받은 실제 날짜 (일정 미연결 기록에서 사용)
-- 일정 연결 시 hospital_schedules.scheduled_at 우선
-- ============================================================

ALTER TABLE counseling_records
    ADD COLUMN IF NOT EXISTS consulted_at DATE;

CREATE INDEX IF NOT EXISTS idx_counseling_records_consulted_at
    ON counseling_records(consulted_at);
