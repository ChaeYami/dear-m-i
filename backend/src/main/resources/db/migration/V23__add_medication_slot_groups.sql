-- medication_slot_groups: 사용자 정의 복약 그룹 (아침약, 점심약 등)
CREATE TABLE medication_slot_groups (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID        NOT NULL REFERENCES users(id),
    group_name  VARCHAR(50) NOT NULL,
    deleted_at  TIMESTAMP,
    created_at  TIMESTAMP   NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_slot_groups_user ON medication_slot_groups(user_id)
    WHERE deleted_at IS NULL;

-- medication_schedules에 per-slot 그룹 연결 컬럼 추가
ALTER TABLE medication_schedules
    ADD COLUMN morning_group_id   UUID REFERENCES medication_slot_groups(id),
    ADD COLUMN afternoon_group_id UUID REFERENCES medication_slot_groups(id),
    ADD COLUMN evening_group_id   UUID REFERENCES medication_slot_groups(id),
    ADD COLUMN bedtime_group_id   UUID REFERENCES medication_slot_groups(id);
