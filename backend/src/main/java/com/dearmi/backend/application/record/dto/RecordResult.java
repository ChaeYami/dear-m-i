package com.dearmi.backend.application.record.dto;

import com.dearmi.backend.domain.record.CounselingRecord;
import com.dearmi.backend.domain.record.RecordSections;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public record RecordResult(
        UUID id,
        UUID scheduleId,
        Short emotionScore,
        String content,
        List<String> tags,
        LocalDate consultedAt,
        RecordSections sections,
        Short visitSatisfaction,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
    public static RecordResult from(CounselingRecord r) {
        return new RecordResult(
                r.getId(),
                r.getScheduleId(),
                r.getEmotionScore(),
                r.getContent(),
                r.getTags(),
                r.getConsultedAt(),
                r.getSections(),
                r.getVisitSatisfaction(),
                r.getCreatedAt(),
                r.getUpdatedAt()
        );
    }
}
