package com.dearmi.backend.application.medication.usecase;

import com.dearmi.backend.application.medication.dto.MedicationScheduleResult;
import com.dearmi.backend.domain.medication.MedicationScheduleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ListMedicationSchedulesUseCaseImpl implements ListMedicationSchedulesUseCase {

    private final MedicationScheduleRepository medicationScheduleRepository;

    @Override
    @Transactional(readOnly = true)
    public List<MedicationScheduleResult> listAll(UUID userId) {
        return medicationScheduleRepository.findByUserIdAndDeletedAtIsNull(userId).stream()
                .map(MedicationScheduleResult::from)
                .toList();
    }
}
