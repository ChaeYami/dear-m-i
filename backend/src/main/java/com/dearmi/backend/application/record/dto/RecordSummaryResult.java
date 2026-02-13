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
        LocalDate consultedAt,      // 카드 표시용 진료일: 직접 기록이면 record.consultedAt,
                                    // 일정 연결이면 일정의 scheduledAt 날짜
        LocalDateTime createdAt
) {
    public static RecordSummaryResult of(CounselingRecord r, String hospitalName, LocalDateTime scheduledAt) {
        // 일정 연결 기록은 일정의 날짜를 진료일로 노출 (record.consultedAt 이 있으면 그 값을 우선)
        LocalDate effectiveConsultedAt = r.getConsultedAt() != null
                ? r.getConsultedAt()
                : (scheduledAt != null ? scheduledAt.toLocalDate() : null);
        return new RecordSummaryResult(
                r.getId(),
                r.getScheduleId(),
                hospitalName,
                r.getEmotionScore(),
                r.getContent(),
                r.getTags(),
                effectiveConsultedAt,
                r.getCreatedAt()
        );
    }
}
