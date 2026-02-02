package com.dearmi.backend.application.record.usecase;

import com.dearmi.backend.common.exception.CustomException;
import com.dearmi.backend.common.exception.ErrorCode;
import com.dearmi.backend.domain.counseling.CounselingRecord;
import com.dearmi.backend.domain.counseling.CounselingRecordRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class DeleteRecordUseCaseImpl implements DeleteRecordUseCase {

    private final CounselingRecordRepository counselingRecordRepository;

    @Override
    @Transactional
    public void delete(UUID userId, UUID recordId) {
        CounselingRecord record = counselingRecordRepository
                .findByIdAndUserIdAndDeletedAtIsNull(recordId, userId)
                .orElseThrow(() -> new CustomException(ErrorCode.NOT_FOUND));

        record.softDelete();
        counselingRecordRepository.save(record);
    }
}
