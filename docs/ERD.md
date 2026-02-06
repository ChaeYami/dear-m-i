# DearMI — Entity Relationship Diagram

> V1 ~ V11 마이그레이션 기준 전체 DB 스키마
>
> 공통 컬럼(`created_at`, `updated_at`)은 모든 테이블에 존재하나 가독성을 위해 생략.
> `deleted_at`은 소프트 삭제 대상 테이블만 별도 표기.

## 1. 진료 도메인 (일정 · 상담 · 준비 메모)

```mermaid
erDiagram
    users {
        UUID id PK
        VARCHAR email UK
        VARCHAR name
        VARCHAR oauth_provider
        VARCHAR oauth_provider_id
        VARCHAR fcm_token
        VARCHAR preferred_locale "default ko"
        TIMESTAMP deleted_at
    }

    hospital_schedules {
        UUID id PK
        UUID user_id FK
        VARCHAR hospital_name
        TIMESTAMP scheduled_at
        TEXT memo
        VARCHAR status "SCHEDULED"
        TIMESTAMP deleted_at
    }

    counseling_records {
        UUID id PK
        UUID user_id FK
        UUID schedule_id FK "SET NULL"
        SMALLINT emotion_score "1-10"
        TEXT content "AES-256-GCM"
        VARCHAR tags "JSON array"
        TIMESTAMP deleted_at
    }

    prep_notes {
        UUID id PK
        UUID user_id FK
        UUID schedule_id FK "SET NULL"
        TEXT content
        TIMESTAMP deleted_at
    }

    daily_checkins {
        UUID id PK
        UUID user_id FK
        DATE checked_at "UQ user+date"
        SMALLINT emotion_score "1-10"
        TEXT memo
        VARCHAR trigger_tags
        DECIMAL sleep_hours
        BOOLEAN took_medication
        TIMESTAMP deleted_at
    }

    users ||--o{ hospital_schedules : "has"
    users ||--o{ counseling_records : "has"
    users ||--o{ prep_notes : "has"
    users ||--o{ daily_checkins : "has"
    hospital_schedules ||--o{ counseling_records : "schedule_id"
    hospital_schedules ||--o{ prep_notes : "schedule_id"
```

## 2. 처방 · 복약 도메인

```mermaid
erDiagram
    users {
        UUID id PK
    }

    prescriptions {
        UUID id PK
        UUID user_id FK
        UUID schedule_id FK "SET NULL"
        VARCHAR s3_key
        TEXT ocr_raw_text
        VARCHAR ocr_status "PENDING"
        DATE prescribed_at
        TIMESTAMP deleted_at
    }

    prescription_medications {
        UUID id PK
        UUID prescription_id FK "CASCADE"
        VARCHAR drug_name
        VARCHAR drug_code
        VARCHAR dosage
        VARCHAR directions
        SMALLINT days
        TEXT drug_effect
        TEXT drug_caution
        VARCHAR manufacturer
        TIMESTAMP drug_info_fetched_at
    }

    medication_schedules {
        UUID id PK
        UUID user_id FK
        UUID prescription_id FK "SET NULL"
        UUID prescription_medication_id FK "SET NULL"
        VARCHAR drug_name
        VARCHAR drug_category "nullable, V11"
        VARCHAR dosage
        SMALLINT times_per_day
        DATE start_date
        DATE end_date
        BOOLEAN morning
        BOOLEAN afternoon
        BOOLEAN evening
        BOOLEAN bedtime
        TIME morning_time
        TIME afternoon_time
        TIME evening_time
        TIME bedtime_time
        TIMESTAMP deleted_at
    }

    medication_logs {
        UUID id PK
        UUID medication_schedule_id FK "CASCADE"
        UUID user_id FK
        TIMESTAMP taken_at "nullable"
        VARCHAR status "TAKEN SKIPPED MISSED"
        DATE log_date "UQ sched+date+slot"
        VARCHAR time_slot "MORNING etc"
    }

    users ||--o{ prescriptions : "has"
    users ||--o{ medication_schedules : "has"
    users ||--o{ medication_logs : "has"
    prescriptions ||--o{ prescription_medications : "CASCADE"
    prescriptions ||--o{ medication_schedules : "prescription_id"
    prescription_medications ||--o{ medication_schedules : "pmed_id"
    medication_schedules ||--o{ medication_logs : "CASCADE"
```

## 3. 인증 · 구독 · 결제 · 시스템

```mermaid
erDiagram
    users {
        UUID id PK
    }

    refresh_tokens {
        UUID id PK
        UUID user_id FK "UK"
        VARCHAR token_hash
        TIMESTAMP expires_at
    }

    notification_settings {
        UUID id PK
        UUID user_id FK "UK"
        BOOLEAN enabled "default true"
        BOOLEAN day_before "default true"
        BOOLEAN day_of "default true"
        BOOLEAN checkin_enabled "default true"
        TIME checkin_time "default 21:00"
        BOOLEAN med_enabled "default true"
    }

    subscriptions {
        UUID id PK
        UUID user_id FK "UK"
        VARCHAR plan "FREE or PREMIUM"
        TIMESTAMP started_at
        TIMESTAMP expires_at
        VARCHAR payment_provider
        VARCHAR original_transaction_id
        BOOLEAN auto_renew "default true"
    }

    subscription_histories {
        UUID id PK
        UUID user_id FK
        VARCHAR plan
        TIMESTAMP started_at
        TIMESTAMP ended_at
        VARCHAR payment_method
        VARCHAR event
        VARCHAR payment_provider
        INTEGER amount
    }

    payments_temp {
        UUID id PK
        UUID user_id FK
        VARCHAR payment_key
        VARCHAR order_id "UK"
        INTEGER amount
        VARCHAR status "PENDING"
        VARCHAR plan_type
    }

    audit_logs {
        UUID id PK
        UUID user_id "nullable"
        VARCHAR action
        VARCHAR resource_type
        UUID resource_id
        VARCHAR ip_address
    }

    export_jobs {
        UUID id PK
        UUID user_id FK
        VARCHAR status "PENDING"
        VARCHAR s3_key
        TIMESTAMP expires_at
    }

    app_versions {
        UUID id PK
        VARCHAR platform "ios android"
        VARCHAR min_version
        VARCHAR latest_version
        BOOLEAN force_update
        TEXT update_message_ko
        TEXT update_message_en
    }

    users ||--|| refresh_tokens : "1:1"
    users ||--|| notification_settings : "1:1"
    users ||--|| subscriptions : "1:1"
    users ||--o{ subscription_histories : "has"
    users ||--o{ payments_temp : "has"
    users ||--o{ export_jobs : "has"
```

## FK 삭제 정책 요약

| 삭제 대상 | 연관 테이블 | 정책 |
|---|---|---|
| `hospital_schedules` | `counseling_records.schedule_id` | `SET NULL` |
| `hospital_schedules` | `prescriptions.schedule_id` | `SET NULL` |
| `hospital_schedules` | `prep_notes.schedule_id` | `SET NULL` |
| `prescriptions` | `prescription_medications` | `CASCADE` |
| `prescriptions` | `medication_schedules.prescription_id` | `SET NULL` |
| `prescription_medications` | `medication_schedules.prescription_medication_id` | `SET NULL` |
| `medication_schedules` | `medication_logs` | `CASCADE` |
