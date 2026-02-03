package com.dearmi.backend.presentation.search.dto;

import com.dearmi.backend.application.search.dto.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public record SearchResponse(
        List<RecordItem> records,
        long recordTotal,
        List<CheckinItem> checkins,
        long checkinTotal,
        List<PrepNoteItem> prepNotes,
        long prepNoteTotal
) {
    public record RecordItem(
            UUID id,
            UUID scheduleId,
            Short emotionScore,
            String content,
            List<String> tags,
            LocalDateTime createdAt
    ) {}

    public record CheckinItem(
            UUID id,
            LocalDate checkedAt,
            Short emotionScore,
            String memo,
            LocalDateTime createdAt
    ) {}

    public record PrepNoteItem(
            UUID id,
            UUID scheduleId,
            String content,
            LocalDateTime createdAt
    ) {}

    public static SearchResponse from(SearchResult result) {
        List<RecordItem> records = result.records().stream()
                .map(r -> new RecordItem(r.id(), r.scheduleId(), r.emotionScore(),
                        r.content(), r.tags(), r.createdAt()))
                .toList();

        List<CheckinItem> checkins = result.checkins().stream()
                .map(c -> new CheckinItem(c.id(), c.checkedAt(), c.emotionScore(),
                        c.memo(), c.createdAt()))
                .toList();

        List<PrepNoteItem> prepNotes = result.prepNotes().stream()
                .map(p -> new PrepNoteItem(p.id(), p.scheduleId(), p.content(), p.createdAt()))
                .toList();

        return new SearchResponse(
                records, result.recordTotal(),
                checkins, result.checkinTotal(),
                prepNotes, result.prepNoteTotal()
        );
    }
}
