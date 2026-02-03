package com.dearmi.backend.infrastructure.external.druginfo;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

import java.util.List;

/**
 * 약학정보원 getDrugPrdtPrmsnDtlInq04 응답 구조
 * items는 단일 객체 또는 배열일 수 있어 List로 파싱
 */
@JsonIgnoreProperties(ignoreUnknown = true)
public record DrugInfoApiResponse(Body body) {

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record Body(List<Item> items, int totalCount) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record Item(
            @JsonProperty("ITEM_NAME") String itemName,
            @JsonProperty("EE_DOC_DATA") String eeDocData,    // 효능효과
            @JsonProperty("NB_DOC_DATA") String nbDocData,    // 주의사항
            @JsonProperty("UD_DOC_DATA") String udDocData,    // 용법용량
            @JsonProperty("ENTP_NAME") String entpName        // 제조사
    ) {}
}
