package com.dearmi.backend.presentation.search;

import com.dearmi.backend.application.search.dto.SearchCommand;
import com.dearmi.backend.application.search.dto.SearchResult;
import com.dearmi.backend.application.search.dto.SearchType;
import com.dearmi.backend.application.search.usecase.SearchUseCase;
import com.dearmi.backend.common.response.ApiResponse;
import com.dearmi.backend.infrastructure.security.AuthenticatedUserId;
import com.dearmi.backend.presentation.search.dto.SearchResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.Arrays;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1/search")
@RequiredArgsConstructor
public class SearchController {

    private final SearchUseCase searchUseCase;

    /**
     * 통합 검색
     *
     * @param q     검색어 (null/blank → 전체 범위 조회)
     * @param types 도메인 타입 콤마 구분 (record,checkin,prepnote) — 미지정 시 전체
     * @param page  0-based 페이지 번호 (기본값 0)
     * @param size  페이지 크기 (기본값 20)
     */
    @GetMapping
    public ApiResponse<SearchResponse> search(
            @AuthenticatedUserId UUID userId,
            @RequestParam(required = false) String q,
            @RequestParam(required = false) String types,
            @RequestParam(required = false) List<String> tags,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        Set<SearchType> searchTypes = parseTypes(types);
        SearchCommand command = new SearchCommand(userId, q, searchTypes, tags, page, size);
        SearchResult result = searchUseCase.search(command);
        return ApiResponse.success(SearchResponse.from(result));
    }

    private Set<SearchType> parseTypes(String types) {
        if (types == null || types.isBlank()) {
            return Set.of(SearchType.values());
        }
        return Arrays.stream(types.split(","))
                .map(String::trim)
                .map(String::toUpperCase)
                .map(SearchType::valueOf)
                .collect(Collectors.toSet());
    }
}
