-- ============================================================
-- V10: notifications — 발송된 알림 히스토리
-- 기존 notification_settings 는 사용자 선호 설정이고, 이 테이블은 실제 발송 기록
-- resource_id: hospital_schedules 또는 medication_schedules 참조 (타입별 해석)
--   해당 리소스 삭제 시 SET NULL 처리 (V1/V5 패턴과 동일) — 히스토리 자체는 보존
-- title_key / body_key: i18n 메시지 키 (messages_{ko,en}.properties 와 동일)
-- title_params / body_params: JSONB 배열, 클라이언트가 앱 언어로 해석
-- ============================================================

CREATE TABLE notifications (
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type            VARCHAR(20) NOT NULL,
    title_key       VARCHAR(200) NOT NULL,
    title_params    JSONB       NOT NULL DEFAULT '[]'::jsonb,
    body_key        VARCHAR(200) NOT NULL,
    body_params     JSONB       NOT NULL DEFAULT '[]'::jsonb,
    resource_id     UUID,
    time_slot       VARCHAR(20),
    read_at         TIMESTAMP,
    created_at      TIMESTAMP   NOT NULL,
    updated_at      TIMESTAMP   NOT NULL,
    deleted_at      TIMESTAMP
);

-- 리스트 조회: 유저별 최신순
CREATE INDEX idx_notifications_user_created
    ON notifications (user_id, created_at DESC)
    WHERE deleted_at IS NULL;

-- unread count: 유저별 + 읽음 여부
CREATE INDEX idx_notifications_user_unread
    ON notifications (user_id)
    WHERE read_at IS NULL AND deleted_at IS NULL;

-- 리소스 역참조 (삭제 시 SET NULL 용)
CREATE INDEX idx_notifications_resource
    ON notifications (resource_id)
    WHERE resource_id IS NOT NULL;
