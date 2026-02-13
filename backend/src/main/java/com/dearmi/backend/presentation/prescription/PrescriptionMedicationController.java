package com.dearmi.backend.presentation.prescription;

import com.dearmi.backend.application.prescription.usecase.GetPrescriptionMedDetailUseCase;
import com.dearmi.backend.application.prescription.usecase.RefreshMedicationDrugInfoUseCase;
import com.dearmi.backend.common.response.ApiResponse;
import com.dearmi.backend.infrastructure.security.AuthenticatedUserId;
import com.dearmi.backend.presentation.prescription.dto.MedicationDetailResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/prescription-medications")
@RequiredArgsConstructor
public class PrescriptionMedicationController {

    private final GetPrescriptionMedDetailUseCase getMedicationDetailUseCase;
    private final RefreshMedicationDrugInfoUseCase refreshMedicationDrugInfoUseCase;

    /** GET /api/v1/prescription-medications/{id} — 약품 상세 (e약은요 정보 포함) */
    @GetMapping("/{id}")
    public ApiResponse<MedicationDetailResponse> getDetail(
            @AuthenticatedUserId UUID userId,
            @PathVariable UUID id
    ) {
        return ApiResponse.success(
                MedicationDetailResponse.from(getMedicationDetailUseCase.getDetail(userId, id))
        );
    }

    /** POST /api/v1/prescription-medications/{id}/refresh-drug-info — 약품 정보 강제 재조회 */
    @PostMapping("/{id}/refresh-drug-info")
    @ResponseStatus(HttpStatus.ACCEPTED)
    public void refreshDrugInfo(
            @AuthenticatedUserId UUID userId,
            @PathVariable UUID id
    ) {
        refreshMedicationDrugInfoUseCase.refresh(userId, id);
    }
}
