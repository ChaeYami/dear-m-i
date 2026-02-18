-- ============================================================
-- V18: prep_notes 에 정신과 진료 준비용 구조화 섹션 컬럼 추가
-- sections JSONB 형태:
--   {
--     "moodChanges": "...",
--     "sideEffects": "...",
--     "sleepAppetite": "...",
--     "newSymptoms": "...",
--     "questions": ["...", "..."],
--     "selfHarmThoughts": "..."
--   }
-- 기존 content 컬럼은 자유 메모/legacy 호환용으로 유지.
-- ============================================================

ALTER TABLE prep_notes
    ADD COLUMN sections JSONB NOT NULL DEFAULT '{}'::jsonb;
