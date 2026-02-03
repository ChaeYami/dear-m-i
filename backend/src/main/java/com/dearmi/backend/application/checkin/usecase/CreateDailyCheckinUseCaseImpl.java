package com.dearmi.backend.application.checkin.usecase;

import com.dearmi.backend.application.checkin.dto.CheckinResult;
import com.dearmi.backend.application.checkin.dto.CreateCheckinCommand;
import com.dearmi.backend.common.exception.CustomException;
import com.dearmi.backend.common.exception.ErrorCode;
import com.dearmi.backend.domain.checkin.DailyCheckin;
import com.dearmi.backend.domain.checkin.DailyCheckinRepository;
import com.dearmi.backend.domain.subscription.SubscriptionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;

@Service
@RequiredArgsConstructor
public class CreateDailyCheckinUseCaseImpl implements CreateDailyCheckinUseCase {

    private static final int FREE_MEMO_MAX_LENGTH = 100;

    private final DailyCheckinRepository dailyCheckinRepository;
    private final SubscriptionRepository subscriptionRepository;

    @Override
    @Transactional
    public CheckinResult createOrUpdate(CreateCheckinCommand command) {
        // 무료 플랜 memo 100자 제한
        if (command.memo() != null && command.memo().length() > FREE_MEMO_MAX_LENGTH) {
            boolean isPremium = subscriptionRepository.findByUserId(command.userId())
                    .map(s -> s.isPremium())
                    .orElse(false);
            if (!isPremium) {
                throw new CustomException(ErrorCode.CONTENT_LIMIT_EXCEEDED, FREE_MEMO_MAX_LENGTH);
            }
        }

        LocalDate today = LocalDate.now();

        // UPSERT: 오늘 기록 있으면 UPDATE
        return dailyCheckinRepository.findByUserIdAndCheckedAt(command.userId(), today)
                .map(existing -> {
                    existing.update(
                            command.emotionScore(),
                            command.triggerTags(),
                            command.memo(),
                            command.sleepHours(),
                            command.tookMedication()
                    );
                    return CheckinResult.from(dailyCheckinRepository.save(existing));
                })
                .orElseGet(() -> {
                    DailyCheckin checkin = DailyCheckin.builder()
                            .userId(command.userId())
                            .checkedAt(today)
                            .emotionScore(command.emotionScore())
                            .triggerTags(command.triggerTags())
                            .memo(command.memo())
                            .sleepHours(command.sleepHours())
                            .tookMedication(command.tookMedication())
                            .build();
                    return CheckinResult.from(dailyCheckinRepository.save(checkin));
                });
    }
}
