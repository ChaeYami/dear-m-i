package com.dearmi.backend.domain.prepnote;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

/**
 * 정신과 진료 준비 메모 구조화 섹션.
 * Free-form content 와 별개로 항목별 입력을 담는다 — Jackson 으로 JSONB serialize.
 */
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.ALWAYS)
public class PrepNoteSections {

    /** 지난 진료 이후 기분 변화 */
    @Builder.Default
    private String moodChanges = "";

    /** 약 부작용 / 복용 누락 */
    @Builder.Default
    private String sideEffects = "";

    /** 수면 / 식욕 / 에너지 */
    @Builder.Default
    private String sleepAppetite = "";

    /** 새 증상 (불안발작, 강박, 환각 등) */
    @Builder.Default
    private String newSymptoms = "";

    /** 의사에게 물어볼 것 (질문 뱅크 + 자유 입력) */
    @Builder.Default
    private List<String> questions = new ArrayList<>();

    /** 자해/자살 사고 — 민감 정보, 별도 토글로만 입력 */
    @Builder.Default
    private String selfHarmThoughts = "";
}
