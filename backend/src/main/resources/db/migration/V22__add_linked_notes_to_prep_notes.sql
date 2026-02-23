-- ============================================================
-- V22: PrepNote 와 DailyNote 연결
-- prep_note_linked_notes: PrepNote 작성 시 선택된 DailyNote ID 목록
-- ============================================================

CREATE TABLE prep_note_linked_notes (
    prep_note_id    UUID NOT NULL REFERENCES prep_notes(id) ON DELETE CASCADE,
    daily_note_id   UUID NOT NULL REFERENCES daily_notes(id) ON DELETE CASCADE,
    PRIMARY KEY (prep_note_id, daily_note_id)
);

CREATE INDEX idx_prep_note_linked_notes_prep_note
    ON prep_note_linked_notes (prep_note_id);
