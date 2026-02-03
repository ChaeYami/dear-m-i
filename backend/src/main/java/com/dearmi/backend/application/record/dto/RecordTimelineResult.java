package com.dearmi.backend.application.record.dto;

import java.util.List;

/**
 * 타임라인 조회 결과.
 * FREE 플랜에서는 isLimited=true 이고 2개월 이내 데이터만 반환된다.
 */
public record RecordTimelineResult(
        List<RecordSummaryResult> content,
        int page,
        int size,
        long totalElements,
        int totalPages,
        boolean isLimited
) {
    public static RecordTimelineResult of(List<RecordSummaryResult> content,
                                          int page, int size,
                                          long totalElements, boolean isLimited) {
        int totalPages = size == 0 ? 0 : (int) Math.ceil((double) totalElements / size);
        return new RecordTimelineResult(content, page, size, totalElements, totalPages, isLimited);
    }
}
