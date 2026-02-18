package com.dearmi.backend.presentation.schedule;

import com.dearmi.backend.application.schedule.dto.CreateScheduleCommand;
import com.dearmi.backend.application.schedule.dto.ScheduleResult;
import com.dearmi.backend.application.schedule.dto.UpdateScheduleCommand;
import com.dearmi.backend.application.schedule.usecase.*;
import com.dearmi.backend.application.schedule.usecase.GetRecentSchedulesUseCase.Direction;
import com.dearmi.backend.common.response.ApiResponse;
import com.dearmi.backend.infrastructure.security.AuthenticatedUserId;
import com.dearmi.backend.presentation.schedule.dto.CreateScheduleRequest;
import com.dearmi.backend.presentation.schedule.dto.ScheduleResponse;
import com.dearmi.backend.presentation.schedule.dto.UpdateScheduleRequest;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/schedules")
@RequiredArgsConstructor
@Validated
public class ScheduleController {

    private final CreateScheduleUseCase createScheduleUseCase;
    private final UpdateScheduleUseCase updateScheduleUseCase;
    private final DeleteScheduleUseCase deleteScheduleUseCase;
    private final GetMonthlySchedulesUseCase getMonthlySchedulesUseCase;
    private final GetScheduleDetailUseCase getScheduleDetailUseCase;
    private final GetRecentSchedulesUseCase getRecentSchedulesUseCase;
    private final GetAllSchedulesUseCase getAllSchedulesUseCase;

    /**
     * GET /api/v1/schedules?year=2026&month=4
     * 월별 일정 목록 조회
     */
    @GetMapping
    public ResponseEntity<ApiResponse<List<ScheduleResponse>>> getMonthly(
            @AuthenticatedUserId UUID userId,
            @RequestParam @Min(2000) @Max(2100) int year,
            @RequestParam @Min(1) @Max(12) int month) {

        List<ScheduleResult> results = getMonthlySchedulesUseCase.getMonthly(userId, year, month);
        List<ScheduleResponse> response = results.stream().map(ScheduleResponse::from).toList();
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    /**
     * POST /api/v1/schedules
     * 일정 생성
     */
    @PostMapping
    public ResponseEntity<ApiResponse<ScheduleResponse>> create(
            @AuthenticatedUserId UUID userId,
            @RequestBody @Valid CreateScheduleRequest request) {

        ScheduleResult result = createScheduleUseCase.create(
                new CreateScheduleCommand(
                        userId,
                        request.hospitalName(),
                        request.scheduledAt(),
                        request.memo()));

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(ScheduleResponse.from(result)));
    }

    /**
     * GET /api/v1/schedules/all
     * 사용자의 전체 일정 (캘린더 없이 목록만 보여주는 "전체" 필터용)
     * scheduledAt DESC 정렬
     */
    @GetMapping("/all")
    public ResponseEntity<ApiResponse<List<ScheduleResponse>>> getAll(
            @AuthenticatedUserId UUID userId) {

        List<ScheduleResult> results = getAllSchedulesUseCase.getAll(userId);
        List<ScheduleResponse> response = results.stream().map(ScheduleResponse::from).toList();
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    /**
     * GET /api/v1/schedules/recent?direction=PAST&limit=10
     * - direction=PAST: 과거 일정 (RecordForm 진료 기록 작성용)
     * - direction=FUTURE: 다가오는 일정 (PrepNoteForm 준비 메모 작성용)
     */
    @GetMapping("/recent")
    public ResponseEntity<ApiResponse<List<ScheduleResponse>>> getRecent(
            @AuthenticatedUserId UUID userId,
            @RequestParam(defaultValue = "PAST") Direction direction,
            @RequestParam(defaultValue = "10") @Min(1) @Max(50) int limit) {

        List<ScheduleResult> results = getRecentSchedulesUseCase.get(userId, direction, limit);
        List<ScheduleResponse> response = results.stream().map(ScheduleResponse::from).toList();
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    /**
     * GET /api/v1/schedules/{id}
     * 일정 상세 조회
     */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<ScheduleResponse>> getDetail(
            @AuthenticatedUserId UUID userId,
            @PathVariable UUID id) {

        ScheduleResult result = getScheduleDetailUseCase.getDetail(userId, id);
        return ResponseEntity.ok(ApiResponse.success(ScheduleResponse.from(result)));
    }

    /**
     * PUT /api/v1/schedules/{id}
     * 일정 수정
     */
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<ScheduleResponse>> update(
            @AuthenticatedUserId UUID userId,
            @PathVariable UUID id,
            @RequestBody @Valid UpdateScheduleRequest request) {

        ScheduleResult result = updateScheduleUseCase.update(
                new UpdateScheduleCommand(
                        userId,
                        id,
                        request.hospitalName(),
                        request.scheduledAt(),
                        request.memo()));

        return ResponseEntity.ok(ApiResponse.success(ScheduleResponse.from(result)));
    }

    /**
     * DELETE /api/v1/schedules/{id}
     * 일정 소프트 딜리트 + ⑤ 원칙 연관 데이터 schedule_id NULL 처리
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(
            @AuthenticatedUserId UUID userId,
            @PathVariable UUID id) {

        deleteScheduleUseCase.delete(userId, id);
        return ResponseEntity.ok(ApiResponse.success());
    }
}
