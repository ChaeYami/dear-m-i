package com.dearmi.backend.presentation.medication;

import com.dearmi.backend.application.medication.dto.CheckMedicationCommand;
import com.dearmi.backend.application.medication.dto.CreateMedicationScheduleCommand;
import com.dearmi.backend.application.medication.dto.UpdateMedicationScheduleCommand;
import com.dearmi.backend.application.medication.usecase.*;
import com.dearmi.backend.common.response.ApiResponse;
import com.dearmi.backend.infrastructure.security.AuthenticatedUserId;
import com.dearmi.backend.presentation.medication.dto.*;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/medication-schedules")
@RequiredArgsConstructor
public class MedicationScheduleController {

    private final GetTodayMedicationUseCase getTodayMedicationUseCase;
    private final CreateMedicationScheduleUseCase createMedicationScheduleUseCase;
    private final UpdateMedicationScheduleUseCase updateMedicationScheduleUseCase;
    private final DeleteMedicationScheduleUseCase deleteMedicationScheduleUseCase;
    private final CheckMedicationUseCase checkMedicationUseCase;
    private final GetMedicationHistoryUseCase getMedicationHistoryUseCase;
    private final GetMedicationStatsUseCase getMedicationStatsUseCase;

    /** GET /api/v1/medication-schedules — 오늘 복약 현황 (활성 일정 + 각 시간대 로그 상태) */
    @GetMapping
    public ApiResponse<TodayMedicationResponse> getToday(
            @AuthenticatedUserId UUID userId
    ) {
        return ApiResponse.success(
                TodayMedicationResponse.from(getTodayMedicationUseCase.getToday(userId))
        );
    }

    /** POST /api/v1/medication-schedules — 복약 일정 등록 */
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<MedicationScheduleResponse> create(
            @AuthenticatedUserId UUID userId,
            @Valid @RequestBody CreateMedicationScheduleRequest request
    ) {
        CreateMedicationScheduleCommand command = new CreateMedicationScheduleCommand(
                userId,
                request.prescriptionMedicationId(),
                request.drugName(),
                request.dosage(),
                request.timesPerDay(),
                request.startDate(),
                request.endDate(),
                request.morning(),
                request.afternoon(),
                request.evening(),
                request.bedtime(),
                request.morningTime(),
                request.afternoonTime(),
                request.eveningTime(),
                request.bedtimeTime()
        );
        return ApiResponse.success(
                MedicationScheduleResponse.from(createMedicationScheduleUseCase.create(command))
        );
    }

    /** PUT /api/v1/medication-schedules/{id} — 복약 일정 수정 */
    @PutMapping("/{id}")
    public ApiResponse<MedicationScheduleResponse> update(
            @AuthenticatedUserId UUID userId,
            @PathVariable UUID id,
            @Valid @RequestBody UpdateMedicationScheduleRequest request
    ) {
        UpdateMedicationScheduleCommand command = new UpdateMedicationScheduleCommand(
                userId, id,
                request.drugName(),
                request.dosage(),
                request.timesPerDay(),
                request.startDate(),
                request.endDate(),
                request.morning(),
                request.afternoon(),
                request.evening(),
                request.bedtime(),
                request.morningTime(),
                request.afternoonTime(),
                request.eveningTime(),
                request.bedtimeTime()
        );
        return ApiResponse.success(
                MedicationScheduleResponse.from(updateMedicationScheduleUseCase.update(command))
        );
    }

    /** DELETE /api/v1/medication-schedules/{id} — 복약 일정 삭제 (logs CASCADE) */
    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(
            @AuthenticatedUserId UUID userId,
            @PathVariable UUID id
    ) {
        deleteMedicationScheduleUseCase.delete(userId, id);
    }

    /** POST /api/v1/medication-schedules/{id}/logs — 복약 체크 (TAKEN/SKIPPED), UPSERT */
    @PostMapping("/{id}/logs")
    public ApiResponse<MedicationLogResponse> check(
            @AuthenticatedUserId UUID userId,
            @PathVariable UUID id,
            @Valid @RequestBody CheckMedicationRequest request
    ) {
        CheckMedicationCommand command = new CheckMedicationCommand(
                userId, id,
                request.logDate(),
                request.timeSlot(),
                request.status()
        );
        return ApiResponse.success(
                MedicationLogResponse.from(checkMedicationUseCase.check(command))
        );
    }

    /** GET /api/v1/medication-schedules/logs?startDate=&endDate= — 복약 이력 (무료 30일 강제) */
    @GetMapping("/logs")
    public ApiResponse<MedicationHistoryResponse> getHistory(
            @AuthenticatedUserId UUID userId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate
    ) {
        return ApiResponse.success(
                MedicationHistoryResponse.from(getMedicationHistoryUseCase.getHistory(userId, startDate, endDate))
        );
    }

    /** GET /api/v1/medication-schedules/stats?startDate=&endDate= — 복약 완료율 통계 */
    @GetMapping("/stats")
    public ApiResponse<MedicationStatsResponse> getStats(
            @AuthenticatedUserId UUID userId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate
    ) {
        return ApiResponse.success(
                MedicationStatsResponse.from(getMedicationStatsUseCase.getStats(userId, startDate, endDate))
        );
    }
}
