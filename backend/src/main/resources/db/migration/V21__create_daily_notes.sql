-- ============================================================
-- V21: daily_notes — 하루 중 언제든 짧게 남기는 SNS형 스레드 메모
-- note_type: FEELING / SYMPTOM / QUESTION / SIDE_EFFECT / OTHER
-- used_in_prep_note_id: PrepNote 작성 시 선택된 경우 채워짐 (optional)
-- ============================================================

CREATE TABLE daily_notes (
    id                      UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id                 UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    body                    TEXT        NOT NULL,
    note_type               VARCHAR(20) NOT NULL DEFAULT 'OTHER',
    note_date               DATE        NOT NULL,
    used_in_prep_note_id    UUID        REFERENCES prep_notes(id) ON DELETE SET NULL,
    created_at              TIMESTAMP   NOT NULL,
    updated_at              TIMESTAMP   NOT NULL,
    deleted_at              TIMESTAMP,
    CONSTRAINT daily_notes_note_type_check
        CHECK (note_type IN ('FEELING', 'SYMPTOM', 'QUESTION', 'SIDE_EFFECT', 'OTHER'))
);

-- 유저별 날짜 내림차순 (메인 피드)
CREATE INDEX idx_daily_notes_user_date
    ON daily_notes (user_id, note_date DESC)
    WHERE deleted_at IS NULL;

-- PrepNote 링크 역조회 (PrepNote 삭제 시 used_in_prep_note_id 초기화 추적)
CREATE INDEX idx_daily_notes_prep_note
    ON daily_notes (used_in_prep_note_id)
    WHERE used_in_prep_note_id IS NOT NULL AND deleted_at IS NULL;
