package com.dearmi.backend.presentation.dailynote;

import com.dearmi.backend.application.dailynote.dto.CreateDailyNoteCommand;
import com.dearmi.backend.application.dailynote.usecase.CreateDailyNoteUseCase;
import com.dearmi.backend.application.dailynote.usecase.DeleteDailyNoteUseCase;
import com.dearmi.backend.application.dailynote.usecase.GetDailyNotesUseCase;
import com.dearmi.backend.common.response.ApiResponse;
import com.dearmi.backend.domain.dailynote.NoteType;
import com.dearmi.backend.infrastructure.security.AuthenticatedUserId;
import com.dearmi.backend.presentation.dailynote.dto.CreateDailyNoteRequest;
import com.dearmi.backend.presentation.dailynote.dto.DailyNoteResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/daily-notes")
@RequiredArgsConstructor
public class DailyNoteController {

    private final CreateDailyNoteUseCase createDailyNoteUseCase;
    private final GetDailyNotesUseCase getDailyNotesUseCase;
    private final DeleteDailyNoteUseCase deleteDailyNoteUseCase;

    /** POST /api/v1/daily-notes — 스레드 메모 작성 */
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<DailyNoteResponse> create(
            @AuthenticatedUserId UUID userId,
            @Valid @RequestBody CreateDailyNoteRequest request
    ) {
        return ApiResponse.success(DailyNoteResponse.from(
                createDailyNoteUseCase.create(new CreateDailyNoteCommand(
                        userId, request.body(), request.noteType(), request.noteDate()
                ))
        ));
    }

    /** GET /api/v1/daily-notes?startDate=&endDate=&noteType= — 목록 조회 */
    @GetMapping
    public ApiResponse<List<DailyNoteResponse>> getList(
            @AuthenticatedUserId UUID userId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam(required = false) NoteType noteType
    ) {
        return ApiResponse.success(
                getDailyNotesUseCase.getList(userId, startDate, endDate, noteType)
                        .stream()
                        .map(DailyNoteResponse::from)
                        .toList()
        );
    }

    /** DELETE /api/v1/daily-notes/{id} — 소프트 딜리트 */
    @DeleteMapping("/{id}")
    public ApiResponse<Void> delete(
            @AuthenticatedUserId UUID userId,
            @PathVariable UUID id
    ) {
        deleteDailyNoteUseCase.delete(userId, id);
        return ApiResponse.success();
    }
}
