package com.dearmi.backend.application.prescription.dto;

import java.util.List;

public record OcrResult(
        String hospitalName,      // 병원명 (null 가능)
        String prescribedAt,      // 처방일 YYYY-MM-DD (null 가능)
        List<OcrMedicationItem> medications
) {}
