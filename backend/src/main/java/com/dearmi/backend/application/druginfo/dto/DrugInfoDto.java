package com.dearmi.backend.application.druginfo.dto;

public record DrugInfoDto(
        String drugName,
        String effect,
        String caution,
        String manufacturer
) {}
