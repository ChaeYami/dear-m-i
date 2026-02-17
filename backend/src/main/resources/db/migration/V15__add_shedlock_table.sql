-- ============================================================
-- V15: shedlock — 멀티 인스턴스 (ECS 다중 태스크) 환경에서
--      @Scheduled 메서드가 한 cron tick 에 한 번만 실행되도록
--      분산 락을 저장. ShedLock 5.x 표준 스키마.
-- ============================================================

CREATE TABLE shedlock (
    name        VARCHAR(64)   NOT NULL,
    lock_until  TIMESTAMP     NOT NULL,
    locked_at   TIMESTAMP     NOT NULL,
    locked_by   VARCHAR(255)  NOT NULL,
    PRIMARY KEY (name)
);
