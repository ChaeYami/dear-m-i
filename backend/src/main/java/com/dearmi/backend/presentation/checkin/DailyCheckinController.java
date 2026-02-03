package com.dearmi.backend.presentation.checkin;

import com.dearmi.backend.application.checkin.dto.CreateCheckinCommand;
import com.dearmi.backend.application.checkin.usecase.CreateDailyCheckinUseCase;
import com.dearmi.backend.application.checkin.usecase.GetCheckinHistoryUseCase;
import com.dearmi.backend.application.checkin.usecase.GetCheckinSummaryUseCase;
import com.dearmi.backend.application.checkin.usecase.GetTodayCheckinUseCase;
import com.dearmi.backend.common.response.ApiResponse;
import com.dearmi.backend.infrastructure.security.AuthenticatedUserId;
import com.dearmi.backend.presentation.checkin.dto.*;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/checkins")
@RequiredArgsConstructor
public class DailyCheckinController {

    private final CreateDailyCheckinUseCase createDailyCheckinUseCase;
    private final GetCheckinHistoryUseCase getCheckinHistoryUseCase;
    private final GetCheckinSummaryUseCase getCheckinSummaryUseCase;
    private final GetTodayCheckinUseCase getTodayCheckinUseCase;

    /** POST /api/v1/checkins — 오늘 체크인 등록/수정 (UPSERT) */
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<CheckinResponse> createOrUpdate(
            @AuthenticatedUserId UUID userId,
            @Valid @RequestBody CreateCheckinRequest request
    ) {
        CreateCheckinCommand command = new CreateCheckinCommand(
                userId,
                request.emotionScore(),
                request.triggerTags(),
                request.memo(),
                request.sleepHours(),
                request.tookMedication()
        );
        return ApiResponse.success(
                CheckinResponse.from(createDailyCheckinUseCase.createOrUpdate(command)));
    }

    /** GET /api/v1/checkins?startDate=&endDate= — 체크인 목록 (무료는 30일 강제) */
    @GetMapping
    public ApiResponse<CheckinHistoryResponse> getHistory(
            @AuthenticatedUserId UUID userId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate
    ) {
        return ApiResponse.success(
                CheckinHistoryResponse.from(
                        getCheckinHistoryUseCase.getHistory(userId, startDate, endDate)));
    }

    /** GET /api/v1/checkins/summary — 최근 7일 요약 */
    @GetMapping("/summary")
    public ApiResponse<CheckinSummaryResponse> getSummary(
            @AuthenticatedUserId UUID userId
    ) {
        return ApiResponse.success(
                CheckinSummaryResponse.from(getCheckinSummaryUseCase.getSummary(userId)));
    }

    /** GET /api/v1/checkins/today — 오늘 체크인 여부 + 내용 */
    @GetMapping("/today")
    public ApiResponse<TodayCheckinResponse> getToday(
            @AuthenticatedUserId UUID userId
    ) {
        return ApiResponse.success(
                getTodayCheckinUseCase.getToday(userId)
                        .map(TodayCheckinResponse::of)
                        .orElse(TodayCheckinResponse.notCheckedIn()));
    }
}
