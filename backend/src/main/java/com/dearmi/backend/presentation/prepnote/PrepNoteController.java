package com.dearmi.backend.presentation.prepnote;

import com.dearmi.backend.application.prepnote.dto.CreatePrepNoteCommand;
import com.dearmi.backend.application.prepnote.dto.UpdatePrepNoteCommand;
import com.dearmi.backend.application.prepnote.usecase.*;
import com.dearmi.backend.common.response.ApiResponse;
import com.dearmi.backend.infrastructure.security.AuthenticatedUserId;
import com.dearmi.backend.presentation.prepnote.dto.CreatePrepNoteRequest;
import com.dearmi.backend.presentation.prepnote.dto.PrepNoteResponse;
import com.dearmi.backend.presentation.prepnote.dto.UpdatePrepNoteRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/prep-notes")
@RequiredArgsConstructor
public class PrepNoteController {

    private final CreatePrepNoteUseCase createPrepNoteUseCase;
    private final UpdatePrepNoteUseCase updatePrepNoteUseCase;
    private final DeletePrepNoteUseCase deletePrepNoteUseCase;
    private final GetPrepNotesUseCase getPrepNotesUseCase;

    /**
     * GET /api/v1/prep-notes?scheduleId=
     * 준비 메모 목록 (scheduleId 있으면 해당 일정만, 없으면 전체)
     */
    @GetMapping
    public ResponseEntity<ApiResponse<List<PrepNoteResponse>>> getList(
            @AuthenticatedUserId UUID userId,
            @RequestParam(required = false) UUID scheduleId) {

        List<PrepNoteResponse> response = getPrepNotesUseCase.getList(userId, scheduleId)
                .stream()
                .map(PrepNoteResponse::from)
                .toList();
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    /**
     * POST /api/v1/prep-notes
     * 준비 메모 작성
     */
    @PostMapping
    public ResponseEntity<ApiResponse<PrepNoteResponse>> create(
            @AuthenticatedUserId UUID userId,
            @RequestBody @Valid CreatePrepNoteRequest request) {

        PrepNoteResponse response = PrepNoteResponse.from(
                createPrepNoteUseCase.create(
                        new CreatePrepNoteCommand(userId, request.scheduleId(), request.content(), request.sections())));

        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(response));
    }

    /**
     * PUT /api/v1/prep-notes/{id}
     * 준비 메모 수정 (본인 것만)
     */
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<PrepNoteResponse>> update(
            @AuthenticatedUserId UUID userId,
            @PathVariable UUID id,
            @RequestBody @Valid UpdatePrepNoteRequest request) {

        PrepNoteResponse response = PrepNoteResponse.from(
                updatePrepNoteUseCase.update(
                        new UpdatePrepNoteCommand(userId, id, request.content(), request.sections())));

        return ResponseEntity.ok(ApiResponse.success(response));
    }

    /**
     * DELETE /api/v1/prep-notes/{id}
     * 준비 메모 소프트 딜리트 (본인 것만)
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(
            @AuthenticatedUserId UUID userId,
            @PathVariable UUID id) {

        deletePrepNoteUseCase.delete(userId, id);
        return ResponseEntity.ok(ApiResponse.success());
    }
}
