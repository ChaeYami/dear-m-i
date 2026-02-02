package com.dearmi.backend.application.prescription.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

/** Claude Vision API가 반환하는 OCR 약품 항목 */
public record OcrMedicationItem(
        @JsonProperty("drugName") String drugName,
        @JsonProperty("dosage") String dosage,
        @JsonProperty("directions") String directions,
        @JsonProperty("days") Short days
) {}
