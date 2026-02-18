package com.dearmi.backend.presentation.record;

import com.dearmi.backend.application.record.dto.CreateRecordCommand;
import com.dearmi.backend.application.record.dto.RecordTimelineResult;
import com.dearmi.backend.application.record.dto.UpdateRecordCommand;
import com.dearmi.backend.application.record.usecase.CreateRecordUseCase;
import com.dearmi.backend.application.record.usecase.DeleteRecordUseCase;
import com.dearmi.backend.application.record.usecase.GetRecordDetailUseCase;
import com.dearmi.backend.application.record.usecase.GetRecordTimelineUseCase;
import com.dearmi.backend.application.record.usecase.UpdateRecordUseCase;
import com.dearmi.backend.common.response.ApiResponse;
import com.dearmi.backend.infrastructure.security.AuthenticatedUserId;
import com.dearmi.backend.presentation.record.dto.CreateRecordRequest;
import com.dearmi.backend.presentation.record.dto.RecordResponse;
import com.dearmi.backend.presentation.record.dto.RecordTimelineResponse;
import com.dearmi.backend.presentation.record.dto.UpdateRecordRequest;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/records")
@RequiredArgsConstructor
@Validated
public class RecordController {

    private final CreateRecordUseCase createRecordUseCase;
    private final UpdateRecordUseCase updateRecordUseCase;
    private final GetRecordDetailUseCase getRecordDetailUseCase;
    private final GetRecordTimelineUseCase getRecordTimelineUseCase;
    private final DeleteRecordUseCase deleteRecordUseCase;

    /** GET /api/v1/records?page=0&size=20 — 타임라인 (createdAt DESC, 페이지네이션) */
    @GetMapping
    public ApiResponse<RecordTimelineResponse> getTimeline(
            @AuthenticatedUserId UUID userId,
            @RequestParam(defaultValue = "0") @Min(0) int page,
            @RequestParam(defaultValue = "20") @Min(1) @Max(100) int size
    ) {
        RecordTimelineResult result = getRecordTimelineUseCase.getTimeline(userId, page, size);
        return ApiResponse.success(RecordTimelineResponse.from(result));
    }

    /** POST /api/v1/records */
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<RecordResponse> create(
            @AuthenticatedUserId UUID userId,
            @Valid @RequestBody CreateRecordRequest request
    ) {
        CreateRecordCommand command = new CreateRecordCommand(
                userId,
                request.scheduleId(),
                request.emotionScore(),
                request.content(),
                request.tags(),
                request.consultedAt()
        );
        return ApiResponse.success(RecordResponse.from(createRecordUseCase.create(command)));
    }

    /** GET /api/v1/records/{recordId} */
    @GetMapping("/{recordId}")
    public ApiResponse<RecordResponse> getDetail(
            @AuthenticatedUserId UUID userId,
            @PathVariable UUID recordId
    ) {
        return ApiResponse.success(RecordResponse.from(getRecordDetailUseCase.getDetail(userId, recordId)));
    }

    /** PUT /api/v1/records/{recordId} */
    @PutMapping("/{recordId}")
    public ApiResponse<RecordResponse> update(
            @AuthenticatedUserId UUID userId,
            @PathVariable UUID recordId,
            @Valid @RequestBody UpdateRecordRequest request
    ) {
        UpdateRecordCommand command = new UpdateRecordCommand(
                userId,
                recordId,
                request.emotionScore(),
                request.content(),
                request.tags(),
                request.consultedAt()
        );
        return ApiResponse.success(RecordResponse.from(updateRecordUseCase.update(command)));
    }

    /** DELETE /api/v1/records/{recordId} */
    @DeleteMapping("/{recordId}")
    public ApiResponse<Void> delete(
            @AuthenticatedUserId UUID userId,
            @PathVariable UUID recordId
    ) {
        deleteRecordUseCase.delete(userId, recordId);
        return ApiResponse.success();
    }
}
