package com.dearmi.backend.presentation.medication;

import com.dearmi.backend.application.medication.usecase.GetMedicationDetailUseCase;
import com.dearmi.backend.common.response.ApiResponse;
import com.dearmi.backend.infrastructure.security.AuthenticatedUserId;
import com.dearmi.backend.presentation.medication.dto.MedicationDetailResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/medications")
@RequiredArgsConstructor
public class MedicationController {

    private final GetMedicationDetailUseCase getMedicationDetailUseCase;

    /** GET /api/v1/medications/{id} — 약품 상세 + 약학정보원 데이터 */
    @GetMapping("/{id}")
    public ApiResponse<MedicationDetailResponse> getDetail(
            @AuthenticatedUserId UUID userId,
            @PathVariable UUID id
    ) {
        return ApiResponse.success(
                MedicationDetailResponse.from(getMedicationDetailUseCase.getDetail(userId, id))
        );
    }
}
