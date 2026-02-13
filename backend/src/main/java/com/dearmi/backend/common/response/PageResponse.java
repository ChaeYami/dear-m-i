package com.dearmi.backend.common.response;

import com.dearmi.backend.application.record.dto.PageResult;

import java.util.List;

public record PageResponse<T>(
        List<T> content,
        int page,
        int size,
        long totalElements,
        int totalPages,
        boolean hasNext
) {
    public static <T> PageResponse<T> from(PageResult<T> result) {
        return new PageResponse<>(
                result.content(),
                result.page(),
                result.size(),
                result.totalElements(),
                result.totalPages(),
                result.page() + 1 < result.totalPages()
        );
    }
}
