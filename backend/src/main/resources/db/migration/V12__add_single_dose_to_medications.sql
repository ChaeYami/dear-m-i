-- 1회 투여량 필드 추가 (처방전 약품명에서 분리)
-- prescription_medications: OCR 파싱 결과 저장
ALTER TABLE prescription_medications
    ADD COLUMN single_dose VARCHAR(100);

-- medication_schedules: 수기 입력 및 OCR 연동 저장
ALTER TABLE medication_schedules
    ADD COLUMN single_dose VARCHAR(100);
