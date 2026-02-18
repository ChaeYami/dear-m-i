-- ============================================================
-- V19: counseling_records 에 정신과 진료 기록용 구조화 섹션 + 진료 후 만족도 컬럼 추가
-- sections JSONB:
--   { "diagnosis":"...", "rxChanges":"...", "nextSteps":"...", "keyTakeaway":"..." }
-- visit_satisfaction SMALLINT (1~10): 진료 끝나고 별도로 매기는 만족도 — emotion_score 와 분리
-- ============================================================

ALTER TABLE counseling_records
    ADD COLUMN sections JSONB NOT NULL DEFAULT '{}'::jsonb,
    ADD COLUMN visit_satisfaction SMALLINT;

ALTER TABLE counseling_records
    ADD CONSTRAINT counseling_records_visit_satisfaction_range
    CHECK (visit_satisfaction IS NULL OR (visit_satisfaction BETWEEN 1 AND 10));
