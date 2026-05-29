-- ============================================================
-- V25: 약품 정보 지역(region) 라우팅 지원 — 글로벌화 1차 (KR/US)
--   - prescriptions / medication_schedules 에 region 컬럼 추가 (기존 행은 기본값 'KR' 로 backfill)
--   - medication_schedules.item_seq 확장: OpenFDA set_id(36자 UUID) 수용 위해 VARCHAR(20) → VARCHAR(64)
--     (KR 품목기준코드는 9자리라 기존 데이터 영향 없음)
-- ============================================================

ALTER TABLE prescriptions
    ADD COLUMN IF NOT EXISTS region VARCHAR(2) NOT NULL DEFAULT 'KR';

ALTER TABLE medication_schedules
    ADD COLUMN IF NOT EXISTS region VARCHAR(2) NOT NULL DEFAULT 'KR';

ALTER TABLE medication_schedules
    ALTER COLUMN item_seq TYPE VARCHAR(64);
