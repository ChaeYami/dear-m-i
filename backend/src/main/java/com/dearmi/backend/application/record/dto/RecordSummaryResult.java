package com.dearmi.backend.application.record.dto;

import com.dearmi.backend.domain.counseling.CounselingRecord;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

/** 타임라인 목록용 요약 DTO */
public record RecordSummaryResult(
        UUID id,
        UUID scheduleId,
        String hospitalName,        // 연결된 일정의 병원명 (없으면 null)
        Short emotionScore,
        String content,             // 본문 (긴 경우 카드에서 잘라서 표시)
        List<String> tags,
        LocalDate consultedAt,      // 일정 미연결 기록의 진료 날짜
        LocalDateTime createdAt
) {
    public static RecordSummaryResult of(CounselingRecord r, String hospitalName) {
        return new RecordSummaryResult(
                r.getId(),
                r.getScheduleId(),
                hospitalName,
                r.getEmotionScore(),
                r.getContent(),
                r.getTags(),
                r.getConsultedAt(),
                r.getCreatedAt()
        );
    }
}
