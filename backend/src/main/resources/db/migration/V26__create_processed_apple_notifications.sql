-- ============================================================
-- V26: processed_apple_notifications — Apple Webhook 멱등성
-- Apple Server-to-Server 알림은 at-least-once 전달이라 동일 알림이 재전송될 수 있다.
-- notification_uuid(알림 고유 ID)를 UNIQUE 로 두고, 처리 전 존재 여부로 중복 처리를 차단한다.
-- ============================================================

CREATE TABLE processed_apple_notifications (
    id                  UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    notification_uuid   VARCHAR(100) NOT NULL,
    created_at          TIMESTAMP    NOT NULL,
    CONSTRAINT uq_processed_apple_notifications_uuid UNIQUE (notification_uuid)
);
