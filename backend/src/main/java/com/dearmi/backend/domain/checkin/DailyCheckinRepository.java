package com.dearmi.backend.domain.checkin;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface DailyCheckinRepository {

    DailyCheckin save(DailyCheckin checkin);

    Optional<DailyCheckin> findByIdAndUserIdAndDeletedAtIsNull(UUID id, UUID userId);

    Optional<DailyCheckin> findByUserIdAndCheckedAt(UUID userId, LocalDate checkedAt);

    List<DailyCheckin> findByUserIdAndDeletedAtIsNullAndCheckedAtAfterOrderByCheckedAtDesc(UUID userId, LocalDate after);
}
