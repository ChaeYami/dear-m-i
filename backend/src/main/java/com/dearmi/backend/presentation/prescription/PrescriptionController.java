package com.dearmi.backend.presentation.prescription;

import com.dearmi.backend.application.prescription.dto.CreatePrescriptionCommand;
import com.dearmi.backend.application.prescription.dto.GenerateUploadUrlCommand;
import com.dearmi.backend.application.prescription.dto.UpdateMedicationsCommand;
import com.dearmi.backend.application.prescription.usecase.CreatePrescriptionUseCase;
import com.dearmi.backend.application.prescription.usecase.DeletePrescriptionUseCase;
import com.dearmi.backend.application.prescription.usecase.GenerateUploadUrlUseCase;
import com.dearmi.backend.application.prescription.usecase.GetPrescriptionDetailUseCase;
import com.dearmi.backend.application.prescription.usecase.GetPrescriptionListUseCase;
import com.dearmi.backend.application.prescription.usecase.RetryOcrUseCase;
import com.dearmi.backend.application.prescription.usecase.UpdateMedicationsUseCase;
import com.dearmi.backend.common.response.ApiResponse;
import com.dearmi.backend.common.response.PageResponse;
import com.dearmi.backend.infrastructure.aspect.Audited;
import com.dearmi.backend.infrastructure.security.AuthenticatedUserId;
import com.dearmi.backend.presentation.prescription.dto.CreatePrescriptionRequest;
import com.dearmi.backend.presentation.prescription.dto.CreatePrescriptionResponse;
import com.dearmi.backend.presentation.prescription.dto.PresignedUrlRequest;
import com.dearmi.backend.presentation.prescription.dto.PresignedUrlResponse;
import com.dearmi.backend.presentation.prescription.dto.PrescriptionDetailResponse;
import com.dearmi.backend.presentation.prescription.dto.UpdateMedicationsRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/prescriptions")
@RequiredArgsConstructor
public class PrescriptionController {

    private final GenerateUploadUrlUseCase generateUploadUrlUseCase;
    private final CreatePrescriptionUseCase createPrescriptionUseCase;
    private final GetPrescriptionListUseCase getPrescriptionListUseCase;
    private final GetPrescriptionDetailUseCase getPrescriptionDetailUseCase;
    private final UpdateMedicationsUseCase updateMedicationsUseCase;
    private final DeletePrescriptionUseCase deletePrescriptionUseCase;
    private final RetryOcrUseCase retryOcrUseCase;

    /** POST /api/v1/prescriptions/presigned-url — S3 업로드용 PUT Presigned URL 발급 */
    @PostMapping("/presigned-url")
    public ApiResponse<PresignedUrlResponse> generatePresignedUrl(
            @AuthenticatedUserId UUID userId,
            @Valid @RequestBody PresignedUrlRequest request
    ) {
        GenerateUploadUrlCommand command =
                new GenerateUploadUrlCommand(userId, request.fileName(), request.contentType());
        return ApiResponse.success(PresignedUrlResponse.from(generateUploadUrlUseCase.generate(command)));
    }

    /** GET /api/v1/prescriptions?page=&size= — 처방전 목록 페이징 조회 */
    @GetMapping
    public ApiResponse<PageResponse<PrescriptionDetailResponse>> getList(
            @AuthenticatedUserId UUID userId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        return ApiResponse.success(
                PageResponse.from(
                        getPrescriptionListUseCase.getList(userId, page, size)
                                .map(PrescriptionDetailResponse::from)
                )
        );
    }

    /** POST /api/v1/prescriptions — 처방전 저장 + 비동기 OCR 시작 */
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<CreatePrescriptionResponse> create(
            @AuthenticatedUserId UUID userId,
            @Valid @RequestBody CreatePrescriptionRequest request
    ) {
        CreatePrescriptionCommand command = new CreatePrescriptionCommand(
                userId, request.s3Key(), request.scheduleId(), request.prescribedAt()
        );
        UUID prescriptionId = createPrescriptionUseCase.create(command);
        return ApiResponse.success(new CreatePrescriptionResponse(prescriptionId));
    }

    /** GET /api/v1/prescriptions/{id} — 처방전 상세 조회 (audit_logs 자동 기록) */
    @GetMapping("/{id}")
    @Audited(action = "PRESCRIPTION_VIEW", resourceType = "PRESCRIPTION")
    public ApiResponse<PrescriptionDetailResponse> getDetail(
            @AuthenticatedUserId UUID userId,
            @PathVariable UUID id
    ) {
        return ApiResponse.success(
                PrescriptionDetailResponse.from(getPrescriptionDetailUseCase.getDetail(userId, id))
        );
    }

    /** DELETE /api/v1/prescriptions/{id} — 처방전 삭제 (약품 cascade + S3 이미지 삭제) */
    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(
            @AuthenticatedUserId UUID userId,
            @PathVariable UUID id
    ) {
        deletePrescriptionUseCase.delete(userId, id);
    }

    /** POST /api/v1/prescriptions/{id}/retry-ocr — OCR 재시도 (FAILED 상태에서만 의미 있음) */
    @PostMapping("/{id}/retry-ocr")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void retryOcr(
            @AuthenticatedUserId UUID userId,
            @PathVariable UUID id
    ) {
        retryOcrUseCase.retry(userId, id);
    }

    /** PUT /api/v1/prescriptions/{id}/medications — 약품 목록 수동 수정 (전체 교체) */
    @PutMapping("/{id}/medications")
    public ApiResponse<PrescriptionDetailResponse> updateMedications(
            @AuthenticatedUserId UUID userId,
            @PathVariable UUID id,
            @Valid @RequestBody UpdateMedicationsRequest request
    ) {
        UpdateMedicationsCommand command = new UpdateMedicationsCommand(
                userId, id,
                request.hospitalName(),
                request.prescribedAt(),
                request.medications().stream()
                        .map(m -> new UpdateMedicationsCommand.MedicationItem(
                                m.drugName(), m.dosage(), m.singleDose(), m.directions(), m.days()))
                        .toList()
        );
        return ApiResponse.success(
                PrescriptionDetailResponse.from(updateMedicationsUseCase.update(command))
        );
    }
}
