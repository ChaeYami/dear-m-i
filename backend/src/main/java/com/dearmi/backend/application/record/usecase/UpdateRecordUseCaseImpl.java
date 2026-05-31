package com.dearmi.backend.application.record.usecase;

import com.dearmi.backend.application.record.dto.RecordResult;
import com.dearmi.backend.application.record.dto.UpdateRecordCommand;
import com.dearmi.backend.common.exception.CustomException;
import com.dearmi.backend.common.exception.ErrorCode;
import com.dearmi.backend.domain.record.CounselingRecord;
import com.dearmi.backend.domain.record.CounselingRecordRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class UpdateRecordUseCaseImpl implements UpdateRecordUseCase {

    private final CounselingRecordRepository counselingRecordRepository;

    @Override
    @Transactional
    public RecordResult update(UpdateRecordCommand command) {
        CounselingRecord record = counselingRecordRepository
                .findByIdAndUserIdAndDeletedAtIsNull(command.recordId(), command.userId())
                .orElseThrow(() -> new CustomException(ErrorCode.NOT_FOUND));

        record.update(command.emotionScore(), command.content(), command.tags(), command.consultedAt(),
                command.sections(), command.visitSatisfaction());
        return RecordResult.from(counselingRecordRepository.save(record));
    }
}
