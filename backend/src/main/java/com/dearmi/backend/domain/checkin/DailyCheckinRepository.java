package com.dearmi.backend.domain.checkin;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface DailyCheckinRepository {

    DailyCheckin save(DailyCheckin checkin);

    Optional<DailyCheckin> findByIdAndUserIdAndDeletedAtIsNull(UUID id, UUID userId);

    Optional<DailyCheckin> findByUserIdAndCheckedAt(UUID userId, LocalDate checkedAt);

    /** 날짜 범위 조회 (startDate 이상, endDate 이하) */
    List<DailyCheckin> findByUserIdAndCheckedAtBetweenOrderByCheckedAtDesc(
            UUID userId, LocalDate startDate, LocalDate endDate);

    List<DailyCheckin> findByUserIdAndDeletedAtIsNullAndCheckedAtAfterOrderByCheckedAtDesc(UUID userId, LocalDate after);

    /** 오늘 체크인 여부 (알림 중복 방지) */
    boolean existsByUserIdAndCheckedAt(UUID userId, LocalDate checkedAt);

    /** 통합 검색: memo LIKE (keyword null이면 전체 범위 조회) */
    List<DailyCheckin> searchByKeyword(UUID userId, String keyword, LocalDate fromDate, int offset, int limit);

    long countByKeyword(UUID userId, String keyword, LocalDate fromDate);

    /** 통합 검색: memo LIKE + trigger_tags 필터 */
    List<DailyCheckin> searchByKeywordAndTags(UUID userId, String keyword, List<String> tags, LocalDate fromDate, int offset, int limit);

    long countByKeywordAndTags(UUID userId, String keyword, List<String> tags, LocalDate fromDate);
}
