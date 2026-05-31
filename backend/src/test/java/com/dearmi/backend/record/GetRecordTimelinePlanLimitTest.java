package com.dearmi.backend.record;

import com.dearmi.backend.application.record.dto.RecordTimelineResult;
import com.dearmi.backend.application.record.usecase.GetRecordTimelineUseCaseImpl;
import com.dearmi.backend.domain.record.CounselingRecordRepository;
import com.dearmi.backend.domain.subscription.Subscription;
import com.dearmi.backend.domain.subscription.SubscriptionRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class GetRecordTimelinePlanLimitTest {

    @Mock private CounselingRecordRepository counselingRecordRepository;
    @Mock private SubscriptionRepository subscriptionRepository;

    @InjectMocks
    private GetRecordTimelineUseCaseImpl getRecordTimelineUseCase;

    @Test
    @DisplayName("FREE 플랜: isLimited=true 이고 날짜 필터 쿼리 사용")
    void free_plan_returns_limited_and_uses_date_filter() {
        UUID userId = UUID.randomUUID();
        when(subscriptionRepository.findByUserId(userId)).thenReturn(Optional.empty());
        when(counselingRecordRepository
                .findByUserIdAndDeletedAtIsNullAndCreatedAtAfterOrderByCreatedAtDesc(
                        eq(userId), any(), anyInt(), anyInt()))
                .thenReturn(List.of());
        when(counselingRecordRepository
                .countByUserIdAndDeletedAtIsNullAndCreatedAtAfter(eq(userId), any()))
                .thenReturn(0L);

        RecordTimelineResult result = getRecordTimelineUseCase.getTimeline(userId, 0, 20);

        assertThat(result.isLimited()).isTrue();
        verify(counselingRecordRepository)
                .findByUserIdAndDeletedAtIsNullAndCreatedAtAfterOrderByCreatedAtDesc(
                        eq(userId), any(), eq(0), eq(20));
        verify(counselingRecordRepository, never())
                .findByUserIdOrderByCreatedAtDesc(any(), anyInt(), anyInt());
    }

    @Test
    @DisplayName("PREMIUM 플랜: isLimited=false 이고 전체 범위 쿼리 사용")
    void premium_plan_returns_not_limited_and_uses_full_query() {
        UUID userId = UUID.randomUUID();
        Subscription premium = Subscription.builder().userId(userId).build();
        premium.upgradeToPremium(java.time.LocalDateTime.now(), java.time.LocalDateTime.now().plusYears(1));
        when(subscriptionRepository.findByUserId(userId)).thenReturn(Optional.of(premium));
        when(counselingRecordRepository.findByUserIdOrderByCreatedAtDesc(userId, 0, 20))
                .thenReturn(List.of());
        when(counselingRecordRepository.countByUserIdAndDeletedAtIsNull(userId)).thenReturn(0L);

        RecordTimelineResult result = getRecordTimelineUseCase.getTimeline(userId, 0, 20);

        assertThat(result.isLimited()).isFalse();
        verify(counselingRecordRepository).findByUserIdOrderByCreatedAtDesc(userId, 0, 20);
        verify(counselingRecordRepository, never())
                .findByUserIdAndDeletedAtIsNullAndCreatedAtAfterOrderByCreatedAtDesc(
                        any(), any(), anyInt(), anyInt());
    }

    @Test
    @DisplayName("페이지네이션 offset 계산: page=2, size=10 → offset=20")
    void pagination_offset_calculation() {
        UUID userId = UUID.randomUUID();
        when(subscriptionRepository.findByUserId(userId)).thenReturn(Optional.empty());
        when(counselingRecordRepository
                .findByUserIdAndDeletedAtIsNullAndCreatedAtAfterOrderByCreatedAtDesc(
                        any(), any(), anyInt(), anyInt()))
                .thenReturn(List.of());
        when(counselingRecordRepository
                .countByUserIdAndDeletedAtIsNullAndCreatedAtAfter(any(), any()))
                .thenReturn(0L);

        getRecordTimelineUseCase.getTimeline(userId, 2, 10);

        verify(counselingRecordRepository)
                .findByUserIdAndDeletedAtIsNullAndCreatedAtAfterOrderByCreatedAtDesc(
                        any(), any(), eq(20), eq(10));
    }
}
