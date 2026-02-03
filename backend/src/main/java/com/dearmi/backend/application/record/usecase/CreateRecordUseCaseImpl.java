package com.dearmi.backend.application.record.usecase;

import com.dearmi.backend.application.record.dto.CreateRecordCommand;
import com.dearmi.backend.application.record.dto.RecordResult;
import com.dearmi.backend.common.exception.CustomException;
import com.dearmi.backend.common.exception.ErrorCode;
import com.dearmi.backend.domain.counseling.CounselingRecord;
import com.dearmi.backend.domain.counseling.CounselingRecordRepository;
import com.dearmi.backend.domain.subscription.SubscriptionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class CreateRecordUseCaseImpl implements CreateRecordUseCase {

    private static final int FREE_CONTENT_MAX_LENGTH = 200;

    private final CounselingRecordRepository counselingRecordRepository;
    private final SubscriptionRepository subscriptionRepository;

    @Override
    @Transactional
    public RecordResult create(CreateRecordCommand command) {
        // 플랜 체크: FREE 플랜이면 content 200자 제한
        if (command.content() != null && command.content().length() > FREE_CONTENT_MAX_LENGTH) {
            boolean isPremium = subscriptionRepository.findByUserId(command.userId())
                    .map(s -> s.isPremium())
                    .orElse(false);
            if (!isPremium) {
                throw new CustomException(ErrorCode.CONTENT_LIMIT_EXCEEDED, FREE_CONTENT_MAX_LENGTH);
            }
        }

        CounselingRecord record = CounselingRecord.builder()
                .userId(command.userId())
                .scheduleId(command.scheduleId())
                .emotionScore(command.emotionScore())
                .content(command.content())
                .tags(command.tags())
                .build();

        return RecordResult.from(counselingRecordRepository.save(record));
    }
}
