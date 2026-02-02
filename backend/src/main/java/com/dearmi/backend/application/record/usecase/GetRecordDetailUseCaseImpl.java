package com.dearmi.backend.application.record.usecase;

import com.dearmi.backend.application.record.dto.RecordResult;
import com.dearmi.backend.common.exception.CustomException;
import com.dearmi.backend.common.exception.ErrorCode;
import com.dearmi.backend.domain.counseling.CounselingRecordRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class GetRecordDetailUseCaseImpl implements GetRecordDetailUseCase {

    private final CounselingRecordRepository counselingRecordRepository;

    @Override
    @Transactional(readOnly = true)
    public RecordResult getDetail(UUID userId, UUID recordId) {
        return counselingRecordRepository
                .findByIdAndUserIdAndDeletedAtIsNull(recordId, userId)
                .map(RecordResult::from)
                .orElseThrow(() -> new CustomException(ErrorCode.NOT_FOUND));
    }
}
