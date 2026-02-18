package com.dearmi.backend.record;

import com.dearmi.backend.application.record.dto.CreateRecordCommand;
import com.dearmi.backend.application.record.usecase.CreateRecordUseCaseImpl;
import com.dearmi.backend.common.exception.CustomException;
import com.dearmi.backend.common.exception.ErrorCode;
import com.dearmi.backend.domain.counseling.CounselingRecord;
import com.dearmi.backend.domain.counseling.CounselingRecordRepository;
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
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CreateRecordPlanLimitTest {

    @Mock private CounselingRecordRepository counselingRecordRepository;
    @Mock private SubscriptionRepository subscriptionRepository;

    @InjectMocks
    private CreateRecordUseCaseImpl createRecordUseCase;

    private static final String LONG_CONTENT = "가".repeat(201); // 201자

    @Test
    @DisplayName("FREE 플랜: content 200자 초과 시 CONTENT_LIMIT_EXCEEDED")
    void free_plan_201_chars_throws_content_limit_exceeded() {
        UUID userId = UUID.randomUUID();
        when(subscriptionRepository.findByUserId(userId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> createRecordUseCase.create(
                new CreateRecordCommand(userId, null, (short) 5, LONG_CONTENT, List.of(), null, null, null)))
                .isInstanceOf(CustomException.class)
                .satisfies(ex -> assertThat(((CustomException) ex).getErrorCode())
                        .isEqualTo(ErrorCode.CONTENT_LIMIT_EXCEEDED.getCode()));

        verifyNoInteractions(counselingRecordRepository);
    }

    @Test
    @DisplayName("FREE 플랜: content 200자 이하는 정상 저장")
    void free_plan_200_chars_allowed() {
        UUID userId = UUID.randomUUID();
        String content200 = "가".repeat(200);
        when(counselingRecordRepository.save(any()))
                .thenAnswer(inv -> inv.getArgument(0));

        createRecordUseCase.create(
                new CreateRecordCommand(userId, null, (short) 5, content200, List.of(), null, null, null));

        verify(counselingRecordRepository).save(any());
        verifyNoInteractions(subscriptionRepository); // 200자 이하는 플랜 체크 안 함
    }

    @Test
    @DisplayName("PREMIUM 플랜: content 200자 초과도 저장 가능")
    void premium_plan_201_chars_allowed() {
        UUID userId = UUID.randomUUID();
        Subscription premium = Subscription.builder().userId(userId).build();
        premium.upgradeToPremium(java.time.LocalDateTime.now(), java.time.LocalDateTime.now().plusYears(1));
        when(subscriptionRepository.findByUserId(userId)).thenReturn(Optional.of(premium));
        when(counselingRecordRepository.save(any()))
                .thenAnswer(inv -> inv.getArgument(0));

        createRecordUseCase.create(
                new CreateRecordCommand(userId, null, (short) 5, LONG_CONTENT, List.of(), null, null, null));

        verify(counselingRecordRepository).save(any());
    }

    @Test
    @DisplayName("content가 null이면 플랜 체크 없이 저장")
    void null_content_skips_plan_check() {
        UUID userId = UUID.randomUUID();
        when(counselingRecordRepository.save(any()))
                .thenAnswer(inv -> inv.getArgument(0));

        createRecordUseCase.create(
                new CreateRecordCommand(userId, null, (short) 5, null, List.of(), null, null, null));

        verify(counselingRecordRepository).save(any());
        verifyNoInteractions(subscriptionRepository);
    }
}
