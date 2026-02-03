-- ============================================================
-- V5: daily_checkins 컬럼 추가 (trigger_tags, sleep_hours, took_medication)
--     + UNIQUE 제약조건 (user_id, checked_at)
-- ============================================================

ALTER TABLE daily_checkins
    ADD COLUMN IF NOT EXISTS trigger_tags  VARCHAR(500),
    ADD COLUMN IF NOT EXISTS sleep_hours   DECIMAL(3,1),
    ADD COLUMN IF NOT EXISTS took_medication BOOLEAN;

-- UPSERT 기준 키: 유저당 하루 1건
ALTER TABLE daily_checkins
    ADD CONSTRAINT uq_daily_checkin_user_date UNIQUE (user_id, checked_at);
