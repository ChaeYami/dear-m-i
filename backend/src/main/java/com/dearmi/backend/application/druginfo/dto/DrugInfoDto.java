package com.dearmi.backend.application.druginfo.dto;

public record DrugInfoDto(
        String drugName,
        String effect,
        String usage,
        String caution,
        String manufacturer,
        /** 품목기준코드 — 약학정보원 상세 링크용 */
        String itemSeq
) {}
