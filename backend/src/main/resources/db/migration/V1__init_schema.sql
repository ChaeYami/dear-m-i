-- ============================================================
-- V1: DearMI 전체 초기 스키마
-- ⚠️ 이 파일은 배포 후 절대 수정 금지. 변경 시 V2__ 파일 추가.
-- Flyway 관리: spring.jpa.hibernate.ddl-auto=validate
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- 1. users
-- ────────────────────────────────────────────────────────────
CREATE TABLE users (
    id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    email               VARCHAR(255) UNIQUE,
    name                VARCHAR(100),
    oauth_provider      VARCHAR(20),
    oauth_provider_id   VARCHAR(255),
    fcm_token           VARCHAR(500),
    created_at          TIMESTAMP   NOT NULL,
    updated_at          TIMESTAMP   NOT NULL,
    deleted_at          TIMESTAMP
);

-- ────────────────────────────────────────────────────────────
-- 2. hospital_schedules
-- ────────────────────────────────────────────────────────────
CREATE TABLE hospital_schedules (
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID        NOT NULL REFERENCES users(id),
    hospital_name   VARCHAR(200),
    scheduled_at    TIMESTAMP,
    memo            TEXT,
    status          VARCHAR(20) NOT NULL DEFAULT 'SCHEDULED',
    created_at      TIMESTAMP   NOT NULL,
    updated_at      TIMESTAMP   NOT NULL,
    deleted_at      TIMESTAMP
);

-- ────────────────────────────────────────────────────────────
-- 3. counseling_records
--    schedule_id: hospital_schedules 삭제 시 SET NULL (데이터 유지)
-- ────────────────────────────────────────────────────────────
CREATE TABLE counseling_records (
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID        NOT NULL REFERENCES users(id),
    schedule_id     UUID        REFERENCES hospital_schedules(id) ON DELETE SET NULL,
    emotion_score   SMALLINT    CHECK (emotion_score >= 1 AND emotion_score <= 10),
    content         TEXT,
    tags            VARCHAR(500),
    created_at      TIMESTAMP   NOT NULL,
    updated_at      TIMESTAMP   NOT NULL,
    deleted_at      TIMESTAMP
);

-- ────────────────────────────────────────────────────────────
-- 4. daily_checkins
-- ────────────────────────────────────────────────────────────
CREATE TABLE daily_checkins (
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID        NOT NULL REFERENCES users(id),
    checked_at      DATE        NOT NULL,
    emotion_score   SMALLINT    CHECK (emotion_score >= 1 AND emotion_score <= 10),
    memo            TEXT,
    created_at      TIMESTAMP   NOT NULL,
    updated_at      TIMESTAMP   NOT NULL,
    deleted_at      TIMESTAMP
);

-- ────────────────────────────────────────────────────────────
-- 5. prescriptions
--    schedule_id: hospital_schedules 삭제 시 SET NULL (데이터 유지)
-- ────────────────────────────────────────────────────────────
CREATE TABLE prescriptions (
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID        NOT NULL REFERENCES users(id),
    schedule_id     UUID        REFERENCES hospital_schedules(id) ON DELETE SET NULL,
    s3_key          VARCHAR(500),
    ocr_raw_text    TEXT,
    ocr_status      VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    prescribed_at   DATE,
    created_at      TIMESTAMP   NOT NULL,
    updated_at      TIMESTAMP   NOT NULL,
    deleted_at      TIMESTAMP
);

-- ────────────────────────────────────────────────────────────
-- 6. prescription_medications
--    prescription_id: prescriptions 삭제 시 CASCADE 삭제
-- ────────────────────────────────────────────────────────────
CREATE TABLE prescription_medications (
    id                      UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    prescription_id         UUID        NOT NULL REFERENCES prescriptions(id) ON DELETE CASCADE,
    drug_name               VARCHAR(200),
    drug_code               VARCHAR(100),
    dosage                  VARCHAR(100),
    directions              VARCHAR(300),
    days                    SMALLINT,
    drug_effect             TEXT,
    drug_caution            TEXT,
    manufacturer            VARCHAR(200),
    drug_info_fetched_at    TIMESTAMP,
    created_at              TIMESTAMP   NOT NULL,
    updated_at              TIMESTAMP   NOT NULL
);

-- ────────────────────────────────────────────────────────────
-- 7. medication_schedules
-- ────────────────────────────────────────────────────────────
CREATE TABLE medication_schedules (
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID        NOT NULL REFERENCES users(id),
    prescription_id UUID        REFERENCES prescriptions(id) ON DELETE SET NULL,
    drug_name       VARCHAR(200) NOT NULL,
    dosage          VARCHAR(100),
    times_per_day   SMALLINT,
    start_date      DATE,
    end_date        DATE,
    created_at      TIMESTAMP   NOT NULL,
    updated_at      TIMESTAMP   NOT NULL,
    deleted_at      TIMESTAMP
);

-- ────────────────────────────────────────────────────────────
-- 8. medication_logs
--    medication_schedule_id: medication_schedules 삭제 시 CASCADE 삭제
-- ────────────────────────────────────────────────────────────
CREATE TABLE medication_logs (
    id                      UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    medication_schedule_id  UUID        NOT NULL REFERENCES medication_schedules(id) ON DELETE CASCADE,
    user_id                 UUID        NOT NULL REFERENCES users(id),
    taken_at                TIMESTAMP   NOT NULL,
    status                  VARCHAR(20) NOT NULL DEFAULT 'TAKEN',
    created_at              TIMESTAMP   NOT NULL,
    updated_at              TIMESTAMP   NOT NULL
);

-- ────────────────────────────────────────────────────────────
-- 9. prep_notes (상담 준비 메모)
--    schedule_id: hospital_schedules 삭제 시 SET NULL (데이터 유지)
-- ────────────────────────────────────────────────────────────
CREATE TABLE prep_notes (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID        NOT NULL REFERENCES users(id),
    schedule_id UUID        REFERENCES hospital_schedules(id) ON DELETE SET NULL,
    content     TEXT,
    created_at  TIMESTAMP   NOT NULL,
    updated_at  TIMESTAMP   NOT NULL,
    deleted_at  TIMESTAMP
);

-- ────────────────────────────────────────────────────────────
-- 10. subscriptions (현재 구독 상태 — 사용자당 1행)
-- ────────────────────────────────────────────────────────────
CREATE TABLE subscriptions (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID        NOT NULL UNIQUE REFERENCES users(id),
    plan        VARCHAR(20) NOT NULL DEFAULT 'FREE',
    started_at  TIMESTAMP,
    expires_at  TIMESTAMP,
    created_at  TIMESTAMP   NOT NULL,
    updated_at  TIMESTAMP   NOT NULL
);

-- ────────────────────────────────────────────────────────────
-- 11. subscription_histories (구독 이력)
-- ────────────────────────────────────────────────────────────
CREATE TABLE subscription_histories (
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID        NOT NULL REFERENCES users(id),
    plan            VARCHAR(20) NOT NULL,
    started_at      TIMESTAMP   NOT NULL,
    ended_at        TIMESTAMP,
    payment_method  VARCHAR(50),
    created_at      TIMESTAMP   NOT NULL
);

-- ────────────────────────────────────────────────────────────
-- 12. refresh_tokens (사용자당 1행, Rotation 방식)
--     탈퇴 시 즉시 삭제 (⑥ 원칙)
-- ────────────────────────────────────────────────────────────
CREATE TABLE refresh_tokens (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID        NOT NULL UNIQUE REFERENCES users(id),
    token_hash  VARCHAR(500) NOT NULL,
    expires_at  TIMESTAMP   NOT NULL,
    created_at  TIMESTAMP   NOT NULL,
    updated_at  TIMESTAMP   NOT NULL
);

-- ────────────────────────────────────────────────────────────
-- 13. notification_settings (사용자당 1행)
-- ────────────────────────────────────────────────────────────
CREATE TABLE notification_settings (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID        NOT NULL UNIQUE REFERENCES users(id),
    enabled     BOOLEAN     NOT NULL DEFAULT TRUE,
    day_before  BOOLEAN     NOT NULL DEFAULT TRUE,
    day_of      BOOLEAN     NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMP   NOT NULL,
    updated_at  TIMESTAMP   NOT NULL
);

-- ────────────────────────────────────────────────────────────
-- 14. audit_logs (변경 불가 감사 로그 — user_id는 nullable: 시스템 액션 포함)
-- ────────────────────────────────────────────────────────────
CREATE TABLE audit_logs (
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID,
    action          VARCHAR(100),
    resource_type   VARCHAR(50),
    resource_id     UUID,
    ip_address      VARCHAR(45),
    created_at      TIMESTAMP   NOT NULL
);

-- ────────────────────────────────────────────────────────────
-- 15. payments_temp (결제 임시 상태 — 결제 완료 후 삭제)
-- ────────────────────────────────────────────────────────────
CREATE TABLE payments_temp (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID        NOT NULL REFERENCES users(id),
    payment_key VARCHAR(200),
    order_id    VARCHAR(200),
    amount      INTEGER,
    status      VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    created_at  TIMESTAMP   NOT NULL,
    updated_at  TIMESTAMP   NOT NULL
);

-- ────────────────────────────────────────────────────────────
-- 16. export_jobs (PDF 내보내기 — 프리미엄)
-- ────────────────────────────────────────────────────────────
CREATE TABLE export_jobs (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID        NOT NULL REFERENCES users(id),
    status      VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    s3_key      VARCHAR(500),
    expires_at  TIMESTAMP,
    created_at  TIMESTAMP   NOT NULL,
    updated_at  TIMESTAMP   NOT NULL
);

-- ────────────────────────────────────────────────────────────
-- 17. app_versions (강제 업데이트 관리)
-- ────────────────────────────────────────────────────────────
CREATE TABLE app_versions (
    id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    platform            VARCHAR(10) NOT NULL,       -- ios / android
    min_version         VARCHAR(20) NOT NULL,        -- 이 버전 미만 강제 업데이트
    latest_version      VARCHAR(20) NOT NULL,
    force_update        BOOLEAN     NOT NULL DEFAULT FALSE,
    update_message_ko   TEXT,
    update_message_en   TEXT,
    created_at          TIMESTAMP   NOT NULL
);

-- ============================================================
-- 인덱스
-- ============================================================

-- users
CREATE INDEX idx_users_deleted_at               ON users(deleted_at);
CREATE INDEX idx_users_oauth                    ON users(oauth_provider, oauth_provider_id);

-- hospital_schedules
CREATE INDEX idx_hospital_schedules_user_id     ON hospital_schedules(user_id);
CREATE INDEX idx_hospital_schedules_scheduled_at ON hospital_schedules(scheduled_at);
CREATE INDEX idx_hospital_schedules_deleted_at  ON hospital_schedules(deleted_at);

-- counseling_records
CREATE INDEX idx_counseling_records_user_id     ON counseling_records(user_id);
CREATE INDEX idx_counseling_records_deleted_at  ON counseling_records(deleted_at);
CREATE INDEX idx_counseling_records_schedule_id ON counseling_records(schedule_id);

-- daily_checkins
CREATE INDEX idx_daily_checkins_user_id         ON daily_checkins(user_id);
CREATE INDEX idx_daily_checkins_checked_at      ON daily_checkins(checked_at);
CREATE INDEX idx_daily_checkins_deleted_at      ON daily_checkins(deleted_at);

-- prescriptions
CREATE INDEX idx_prescriptions_user_id          ON prescriptions(user_id);
CREATE INDEX idx_prescriptions_ocr_status       ON prescriptions(ocr_status);
CREATE INDEX idx_prescriptions_deleted_at       ON prescriptions(deleted_at);

-- prescription_medications
CREATE INDEX idx_prescription_medications_prescription_id ON prescription_medications(prescription_id);

-- medication_schedules
CREATE INDEX idx_medication_schedules_user_id   ON medication_schedules(user_id);
CREATE INDEX idx_medication_schedules_deleted_at ON medication_schedules(deleted_at);

-- medication_logs
CREATE INDEX idx_medication_logs_user_id        ON medication_logs(user_id);
CREATE INDEX idx_medication_logs_schedule_id    ON medication_logs(medication_schedule_id);
CREATE INDEX idx_medication_logs_taken_at       ON medication_logs(taken_at);

-- prep_notes
CREATE INDEX idx_prep_notes_user_id             ON prep_notes(user_id);
CREATE INDEX idx_prep_notes_deleted_at          ON prep_notes(deleted_at);
CREATE INDEX idx_prep_notes_schedule_id         ON prep_notes(schedule_id);

-- subscription_histories
CREATE INDEX idx_subscription_histories_user_id ON subscription_histories(user_id);

-- audit_logs
CREATE INDEX idx_audit_logs_user_id             ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_created_at          ON audit_logs(created_at);

-- payments_temp
CREATE INDEX idx_payments_temp_user_id          ON payments_temp(user_id);
CREATE INDEX idx_payments_temp_created_at       ON payments_temp(created_at);

-- export_jobs
CREATE INDEX idx_export_jobs_user_id            ON export_jobs(user_id);

-- app_versions
CREATE INDEX idx_app_versions_platform          ON app_versions(platform);
