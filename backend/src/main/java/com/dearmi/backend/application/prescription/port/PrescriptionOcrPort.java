package com.dearmi.backend.application.prescription.port;

import com.dearmi.backend.application.prescription.dto.OcrResult;

public interface PrescriptionOcrPort {

    /**
     * S3 키로부터 이미지를 읽어 Gemini Vision API로 처방전 OCR 분석
     *
     * @param s3Key S3 오브젝트 키
     * @return 추출된 처방전 정보 (병원명, 처방일, 약품 목록)
     * @throws com.dearmi.backend.common.exception.PrescriptionOcrException OCR 실패 시
     */
    OcrResult analyze(String s3Key);
}
