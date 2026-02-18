-- ============================================================
-- V20: side_effect_logs — 약 부작용 빠른 기록
-- 다음 진료 prep_note 작성 시 이 테이블에서 최근 항목을 조회해 미리 채울 수 있다.
-- medication_schedule_id 는 nullable: 어떤 약인지 모르고 증상만 빠르게 적을 수 있어야 함.
-- ============================================================

CREATE TABLE side_effect_logs (
    id                       UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id                  UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    medication_schedule_id   UUID,        -- nullable; 일정 삭제 시 SET NULL (애플리케이션에서 처리)
    occurred_at              TIMESTAMP   NOT NULL,
    symptom                  TEXT        NOT NULL,
    severity                 SMALLINT,    -- 1~5 (선택)
    notes                    TEXT,
    created_at               TIMESTAMP   NOT NULL,
    updated_at               TIMESTAMP   NOT NULL,
    deleted_at               TIMESTAMP,
    CONSTRAINT side_effect_logs_severity_range
        CHECK (severity IS NULL OR (severity BETWEEN 1 AND 5))
);

-- 유저별 최신순 조회
CREATE INDEX idx_side_effect_logs_user_occurred
    ON side_effect_logs (user_id, occurred_at DESC)
    WHERE deleted_at IS NULL;

-- 특정 약 부작용 조회
CREATE INDEX idx_side_effect_logs_medication
    ON side_effect_logs (medication_schedule_id)
    WHERE medication_schedule_id IS NOT NULL AND deleted_at IS NULL;
