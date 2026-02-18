package com.dearmi.backend.medication;

import com.dearmi.backend.application.medication.dto.CreateMedicationScheduleCommand;
import com.dearmi.backend.application.medication.dto.MedicationScheduleResult;
import com.dearmi.backend.application.medication.service.MedicationDrugInfoService;
import com.dearmi.backend.application.medication.usecase.CreateMedicationScheduleUseCaseImpl;
import com.dearmi.backend.common.exception.CustomException;
import com.dearmi.backend.domain.medication.MedicationSchedule;
import com.dearmi.backend.domain.medication.MedicationScheduleRepository;
import com.dearmi.backend.domain.prescription.Prescription;
import com.dearmi.backend.domain.prescription.PrescriptionMedication;
import com.dearmi.backend.domain.prescription.PrescriptionMedicationRepository;
import com.dearmi.backend.domain.prescription.PrescriptionRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CreateMedicationScheduleUseCaseImplTest {

    @Mock private MedicationScheduleRepository medicationScheduleRepository;
    @Mock private PrescriptionMedicationRepository prescriptionMedicationRepository;
    @Mock private PrescriptionRepository prescriptionRepository;
    @Mock private MedicationDrugInfoService medicationDrugInfoService;

    @InjectMocks
    private CreateMedicationScheduleUseCaseImpl createUseCase;

    @Test
    @DisplayName("직접 입력으로 복약 일정을 생성한다")
    void create_manual_success() {
        UUID userId = UUID.randomUUID();
        CreateMedicationScheduleCommand command = new CreateMedicationScheduleCommand(
                userId, null, "아스피린", "100mg", null, null, (short) 1,
                LocalDate.now(), LocalDate.now().plusDays(30),
                true, false, false, false,
                null, null, null, null
        );

        MedicationSchedule saved = MedicationSchedule.builder()
                .userId(userId).drugName("아스피린").dosage("100mg")
                .timesPerDay((short) 1).morning(true)
                .build();
        when(medicationScheduleRepository.save(any())).thenReturn(saved);

        MedicationScheduleResult result = createUseCase.create(command);

        assertThat(result.drugName()).isEqualTo("아스피린");
        assertThat(result.morning()).isTrue();
        verify(medicationScheduleRepository).save(any(MedicationSchedule.class));
        verifyNoInteractions(prescriptionMedicationRepository);
    }

    @Test
    @DisplayName("prescriptionMedicationId로 약품 정보를 pre-fill한다")
    void create_with_prefill_success() {
        UUID userId = UUID.randomUUID();
        UUID pmId = UUID.randomUUID();
        UUID prescriptionId = UUID.randomUUID();

        PrescriptionMedication pm = PrescriptionMedication.builder()
                .prescriptionId(prescriptionId).drugName("세티리진").dosage("10mg")
                .build();
        Prescription prescription = Prescription.builder()
                .userId(userId).s3Key("test.jpg").build();

        when(prescriptionMedicationRepository.findById(pmId)).thenReturn(Optional.of(pm));
        when(prescriptionRepository.findByIdAndUserIdAndDeletedAtIsNull(prescriptionId, userId))
                .thenReturn(Optional.of(prescription));

        MedicationSchedule saved = MedicationSchedule.builder()
                .userId(userId).prescriptionMedicationId(pmId)
                .drugName("세티리진").dosage("10mg").morning(true).build();
        when(medicationScheduleRepository.save(any())).thenReturn(saved);

        // drugName null → pre-fill에서 채워짐
        CreateMedicationScheduleCommand command = new CreateMedicationScheduleCommand(
                userId, pmId, null, null, null, null, null, null, null,
                true, false, false, false, null, null, null, null
        );

        MedicationScheduleResult result = createUseCase.create(command);

        assertThat(result.drugName()).isEqualTo("세티리진");
        assertThat(result.dosage()).isEqualTo("10mg");
    }

    @Test
    @DisplayName("타인의 처방전 약품을 pre-fill하면 404가 발생한다")
    void create_with_other_user_prescription_throws_not_found() {
        UUID userId = UUID.randomUUID();
        UUID anotherUserId = UUID.randomUUID();
        UUID pmId = UUID.randomUUID();
        UUID prescriptionId = UUID.randomUUID();

        PrescriptionMedication pm = PrescriptionMedication.builder()
                .prescriptionId(prescriptionId).drugName("약품").build();

        when(prescriptionMedicationRepository.findById(pmId)).thenReturn(Optional.of(pm));
        when(prescriptionRepository.findByIdAndUserIdAndDeletedAtIsNull(prescriptionId, userId))
                .thenReturn(Optional.empty()); // 타인 소유 → 404

        CreateMedicationScheduleCommand command = new CreateMedicationScheduleCommand(
                userId, pmId, null, null, null, null, null, null, null,
                true, false, false, false, null, null, null, null
        );

        assertThatThrownBy(() -> createUseCase.create(command))
                .isInstanceOf(CustomException.class)
                .hasMessageContaining("찾을 수 없");
    }

    @Test
    @DisplayName("약품명 없이 생성하면 INVALID_REQUEST 예외가 발생한다")
    void create_without_drug_name_throws_invalid_request() {
        UUID userId = UUID.randomUUID();
        CreateMedicationScheduleCommand command = new CreateMedicationScheduleCommand(
                userId, null, null, null, null, null, null, null, null,
                true, false, false, false, null, null, null, null
        );

        assertThatThrownBy(() -> createUseCase.create(command))
                .isInstanceOf(CustomException.class)
                .hasMessageContaining("약품명");
    }
}
