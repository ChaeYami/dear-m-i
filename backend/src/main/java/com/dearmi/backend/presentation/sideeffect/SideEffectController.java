package com.dearmi.backend.presentation.sideeffect;

import com.dearmi.backend.application.sideeffect.dto.CreateSideEffectCommand;
import com.dearmi.backend.application.sideeffect.dto.UpdateSideEffectCommand;
import com.dearmi.backend.application.sideeffect.usecase.SideEffectUseCase;
import com.dearmi.backend.common.response.ApiResponse;
import com.dearmi.backend.infrastructure.security.AuthenticatedUserId;
import com.dearmi.backend.presentation.sideeffect.dto.CreateSideEffectRequest;
import com.dearmi.backend.presentation.sideeffect.dto.SideEffectLogResponse;
import com.dearmi.backend.presentation.sideeffect.dto.UpdateSideEffectRequest;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/side-effects")
@RequiredArgsConstructor
@Validated
public class SideEffectController {

    private final SideEffectUseCase sideEffectUseCase;

    /** GET /api/v1/side-effects?page=&size=  — 최신순 페이지 */
    @GetMapping
    public ApiResponse<List<SideEffectLogResponse>> getList(
            @AuthenticatedUserId UUID userId,
            @RequestParam(defaultValue = "0") @Min(0) int page,
            @RequestParam(defaultValue = "20") @Min(1) @Max(100) int size
    ) {
        return ApiResponse.success(
                sideEffectUseCase.getList(userId, page, size).stream()
                        .map(SideEffectLogResponse::from)
                        .toList()
        );
    }

    /** GET /api/v1/side-effects/since?since=ISO  — prep note 자동 첨부용 */
    @GetMapping("/since")
    public ApiResponse<List<SideEffectLogResponse>> getSince(
            @AuthenticatedUserId UUID userId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime since
    ) {
        return ApiResponse.success(
                sideEffectUseCase.getSince(userId, since).stream()
                        .map(SideEffectLogResponse::from)
                        .toList()
        );
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<SideEffectLogResponse> create(
            @AuthenticatedUserId UUID userId,
            @Valid @RequestBody CreateSideEffectRequest request
    ) {
        return ApiResponse.success(SideEffectLogResponse.from(
                sideEffectUseCase.create(new CreateSideEffectCommand(
                        userId,
                        request.medicationScheduleId(),
                        request.occurredAt(),
                        request.symptom(),
                        request.severity(),
                        request.notes()
                ))
        ));
    }

    @PutMapping("/{id}")
    public ApiResponse<SideEffectLogResponse> update(
            @AuthenticatedUserId UUID userId,
            @PathVariable UUID id,
            @Valid @RequestBody UpdateSideEffectRequest request
    ) {
        return ApiResponse.success(SideEffectLogResponse.from(
                sideEffectUseCase.update(new UpdateSideEffectCommand(
                        userId,
                        id,
                        request.medicationScheduleId(),
                        request.occurredAt(),
                        request.symptom(),
                        request.severity(),
                        request.notes()
                ))
        ));
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(
            @AuthenticatedUserId UUID userId,
            @PathVariable UUID id
    ) {
        sideEffectUseCase.delete(userId, id);
    }
}
