-- 토스페이먼츠 웹 결제 dead code 제거에 따른 payments_temp 테이블 정리.
-- iOS App Store IAP + Android Play Billing 만 사용하므로 임시 결제 테이블 불필요.
DROP TABLE IF EXISTS payments_temp;
