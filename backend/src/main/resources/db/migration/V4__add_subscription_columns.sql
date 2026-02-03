-- ============================================================
-- V4: 구독 관련 컬럼 추가 및 스키마 보강
-- ============================================================

-- subscriptions: 결제 제공자, 거래 ID, 자동 갱신 여부 추가
ALTER TABLE subscriptions
    ADD COLUMN IF NOT EXISTS payment_provider        VARCHAR(20),
    ADD COLUMN IF NOT EXISTS original_transaction_id VARCHAR(500),
    ADD COLUMN IF NOT EXISTS auto_renew              BOOLEAN NOT NULL DEFAULT TRUE;

-- subscription_histories: 이벤트 타입, 결제 제공자, 결제 금액 추가
ALTER TABLE subscription_histories
    ADD COLUMN IF NOT EXISTS event            VARCHAR(50),
    ADD COLUMN IF NOT EXISTS payment_provider VARCHAR(20),
    ADD COLUMN IF NOT EXISTS amount           INTEGER;

-- payments_temp: 플랜 타입 추가
ALTER TABLE payments_temp
    ADD COLUMN IF NOT EXISTS plan_type VARCHAR(20);

-- payments_temp: order_id UNIQUE 제약 추가 (없는 경우에만)
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'payments_temp_order_id_key'
          AND conrelid = 'payments_temp'::regclass
    ) THEN
        ALTER TABLE payments_temp ADD CONSTRAINT payments_temp_order_id_key UNIQUE (order_id);
    END IF;
END $$;
