package com.dearmi.backend.application.record.usecase;

import com.dearmi.backend.application.record.dto.CreateRecordCommand;
import com.dearmi.backend.application.record.dto.RecordResult;
import com.dearmi.backend.domain.counseling.CounselingRecord;
import com.dearmi.backend.domain.counseling.CounselingRecordRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class CreateRecordUseCaseImpl implements CreateRecordUseCase {

    private final CounselingRecordRepository counselingRecordRepository;

    @Override
    @Transactional
    public RecordResult create(CreateRecordCommand command) {
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
