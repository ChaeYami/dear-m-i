package com.dearmi.backend.application.search.dto;

import java.util.List;

public record SearchResult(
        List<RecordSearchResult> records,
        long recordTotal,
        List<CheckinSearchResult> checkins,
        long checkinTotal,
        List<PrepNoteSearchResult> prepNotes,
        long prepNoteTotal
) {}
