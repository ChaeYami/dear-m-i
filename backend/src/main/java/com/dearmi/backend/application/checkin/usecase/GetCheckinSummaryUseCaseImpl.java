package com.dearmi.backend.application.checkin.usecase;

import com.dearmi.backend.application.checkin.dto.CheckinSummaryResult;
import com.dearmi.backend.domain.checkin.DailyCheckin;
import com.dearmi.backend.domain.checkin.DailyCheckinRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class GetCheckinSummaryUseCaseImpl implements GetCheckinSummaryUseCase {

    private static final int SUMMARY_DAYS = 7;

    private final DailyCheckinRepository dailyCheckinRepository;

    @Override
    @Transactional(readOnly = true)
    public CheckinSummaryResult getSummary(UUID userId) {
        LocalDate today = LocalDate.now();
        LocalDate weekAgo = today.minusDays(SUMMARY_DAYS - 1);

        List<DailyCheckin> checkins = dailyCheckinRepository
                .findByUserIdAndCheckedAtBetweenOrderByCheckedAtDesc(userId, weekAgo, today);

        if (checkins.isEmpty()) {
            return new CheckinSummaryResult(null, null, null, List.of(), 0);
        }

        // 평균 감정 점수
        BigDecimal avgEmotion = checkins.stream()
                .filter(c -> c.getEmotionScore() != null)
                .map(c -> BigDecimal.valueOf(c.getEmotionScore()))
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        long emotionCount = checkins.stream().filter(c -> c.getEmotionScore() != null).count();
        BigDecimal averageEmotionScore = emotionCount > 0
                ? avgEmotion.divide(BigDecimal.valueOf(emotionCount), 1, RoundingMode.HALF_UP)
                : null;

        // 평균 수면 시간
        BigDecimal avgSleep = checkins.stream()
                .filter(c -> c.getSleepHours() != null)
                .map(DailyCheckin::getSleepHours)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        long sleepCount = checkins.stream().filter(c -> c.getSleepHours() != null).count();
        BigDecimal averageSleepHours = sleepCount > 0
                ? avgSleep.divide(BigDecimal.valueOf(sleepCount), 1, RoundingMode.HALF_UP)
                : null;

        // 복약률
        long medRecorded = checkins.stream().filter(c -> c.getTookMedication() != null).count();
        long medTaken = checkins.stream()
                .filter(c -> Boolean.TRUE.equals(c.getTookMedication())).count();
        Integer medicationRate = medRecorded > 0
                ? (int) Math.round((double) medTaken / medRecorded * 100)
                : null;

        // Top 3 trigger tags
        Map<String, Long> tagCounts = checkins.stream()
                .filter(c -> c.getTriggerTags() != null)
                .flatMap(c -> c.getTriggerTags().stream())
                .collect(Collectors.groupingBy(tag -> tag, Collectors.counting()));

        List<String> topTriggerTags = tagCounts.entrySet().stream()
                .sorted(Map.Entry.<String, Long>comparingByValue().reversed())
                .limit(3)
                .map(Map.Entry::getKey)
                .toList();

        return new CheckinSummaryResult(
                averageEmotionScore,
                averageSleepHours,
                medicationRate,
                topTriggerTags,
                checkins.size()
        );
    }
}
