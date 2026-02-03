package com.dearmi.backend.application.checkin.usecase;

import com.dearmi.backend.application.checkin.dto.CheckinResult;
import com.dearmi.backend.domain.checkin.DailyCheckinRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class GetTodayCheckinUseCaseImpl implements GetTodayCheckinUseCase {

    private final DailyCheckinRepository dailyCheckinRepository;

    @Override
    @Transactional(readOnly = true)
    public Optional<CheckinResult> getToday(UUID userId) {
        return dailyCheckinRepository
                .findByUserIdAndCheckedAt(userId, LocalDate.now())
                .map(CheckinResult::from);
    }
}
