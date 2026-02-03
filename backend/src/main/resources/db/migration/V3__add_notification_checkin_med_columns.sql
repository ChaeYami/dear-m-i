-- ============================================================
-- V3: notification_settings 에 체크인·복약 알림 컬럼 추가
-- ============================================================

ALTER TABLE notification_settings
    ADD COLUMN IF NOT EXISTS checkin_enabled BOOLEAN DEFAULT TRUE,
    ADD COLUMN IF NOT EXISTS checkin_time    TIME    DEFAULT '21:00',
    ADD COLUMN IF NOT EXISTS med_enabled     BOOLEAN DEFAULT TRUE;
