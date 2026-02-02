package com.dearmi.backend.application.prescription.port;

import com.dearmi.backend.application.prescription.dto.OcrMedicationItem;

import java.util.List;

public interface PrescriptionOcrPort {

    /**
     * S3 키로부터 이미지를 읽어 Claude Vision API로 처방전 OCR 분석
     *
     * @param s3Key S3 오브젝트 키
     * @return 추출된 약품 목록
     * @throws com.dearmi.backend.common.exception.PrescriptionOcrException OCR 실패 시
     */
    List<OcrMedicationItem> analyze(String s3Key);
}
