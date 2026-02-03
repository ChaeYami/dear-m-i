-- ============================================================
-- V6: users 테이블에 preferred_locale 컬럼 추가 (다국어 알림용)
-- ============================================================

ALTER TABLE users
    ADD COLUMN IF NOT EXISTS preferred_locale VARCHAR(5) DEFAULT 'ko';
