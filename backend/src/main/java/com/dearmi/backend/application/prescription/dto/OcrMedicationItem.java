package com.dearmi.backend.application.prescription.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

/** Gemini Vision API가 반환하는 OCR 약품 항목 */
public record OcrMedicationItem(
        @JsonProperty("drugName") String drugName,      // 약품 기본명 (규격 제외)
        @JsonProperty("dosage") String dosage,           // 용량/규격 (예: 0.125밀리그램)
        @JsonProperty("singleDose") String singleDose,  // 1회 투여량 (예: 1정, 0.5정)
        @JsonProperty("directions") String directions,   // 용법 (예: 1일 2회 식후)
        @JsonProperty("days") Short days
) {}
