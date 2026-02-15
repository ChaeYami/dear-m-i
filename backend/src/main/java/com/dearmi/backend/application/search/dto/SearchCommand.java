package com.dearmi.backend.application.search.dto;

import java.util.List;
import java.util.Set;
import java.util.UUID;

public record SearchCommand(
        UUID userId,
        String keyword,          // null/blank → 전체 범위 조회
        Set<SearchType> types,   // 검색 대상 도메인
        List<String> tags,       // 체크인 트리거 태그 필터 (null/empty → 무시)
        int page,
        int size
) {}
