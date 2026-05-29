package com.dearmi.backend.application.prescription.port;

import com.dearmi.backend.application.prescription.dto.OcrResult;
import com.dearmi.backend.domain.druginfo.DrugRegion;

public interface PrescriptionOcrPort {

    /**
     * S3 키로부터 이미지를 읽어 Gemini Vision API로 처방전 OCR 분석
     *
     * @param s3Key  S3 오브젝트 키
     * @param region 처방전 지역 — OCR 프롬프트(한국 처방전 / 영문 Rx 양식)를 분기하는 데 사용
     * @return 추출된 처방전 정보 (병원명, 처방일, 약품 목록)
     * @throws com.dearmi.backend.common.exception.PrescriptionOcrException OCR 실패 시
     */
    OcrResult analyze(String s3Key, DrugRegion region);
}
