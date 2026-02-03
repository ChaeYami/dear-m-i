package com.dearmi.backend.application.search.dto;

import java.util.Set;
import java.util.UUID;

public record SearchCommand(
        UUID userId,
        String keyword,          // null/blank → 전체 범위 조회
        Set<SearchType> types,   // 검색 대상 도메인
        int page,
        int size
) {}
