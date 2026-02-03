-- medication_schedules에 약품 상세 정보 캐시 필드 추가
-- 직접 입력한 약도 e약은요 API에서 효능/주의사항을 조회해 저장

ALTER TABLE medication_schedules
    ADD COLUMN drug_effect       TEXT,
    ADD COLUMN drug_caution      TEXT,
    ADD COLUMN manufacturer      VARCHAR(200),
    ADD COLUMN drug_info_fetched_at TIMESTAMP;
