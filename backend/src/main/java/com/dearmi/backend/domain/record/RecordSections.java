package com.dearmi.backend.domain.record;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * 정신과 진료 기록 구조화 섹션 — Jackson 으로 JSONB serialize.
 * content (free-form 회고) 와 별개로 항목별 입력을 담는다.
 */
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.ALWAYS)
public class RecordSections {

    /** 진단명 / 평가 */
    @Builder.Default
    private String diagnosis = "";

    /** 처방 변화 (약 증감, 추가, 중단 등) */
    @Builder.Default
    private String rxChanges = "";

    /** 다음 약속까지 할 일 / 의사 권고 */
    @Builder.Default
    private String nextSteps = "";

    /** 오늘 의사가 강조한 한 마디 / 핵심 takeaway */
    @Builder.Default
    private String keyTakeaway = "";
}
