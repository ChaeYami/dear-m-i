package com.dearmi.backend.presentation.medication;

import com.dearmi.backend.application.medication.usecase.BulkCheckGroupMedicationUseCase;
import com.dearmi.backend.application.medication.usecase.CreateSlotGroupUseCase;
import com.dearmi.backend.application.medication.usecase.DeleteSlotGroupUseCase;
import com.dearmi.backend.application.medication.usecase.ListSlotGroupsUseCase;
import com.dearmi.backend.common.response.ApiResponse;
import com.dearmi.backend.domain.medication.MedicationLogStatus;
import com.dearmi.backend.domain.medication.TimeSlot;
import com.dearmi.backend.infrastructure.security.AuthenticatedUserId;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/medication-slot-groups")
@RequiredArgsConstructor
public class MedicationSlotGroupController {

    private final CreateSlotGroupUseCase createSlotGroupUseCase;
    private final ListSlotGroupsUseCase listSlotGroupsUseCase;
    private final DeleteSlotGroupUseCase deleteSlotGroupUseCase;
    private final BulkCheckGroupMedicationUseCase bulkCheckGroupMedicationUseCase;

    record CreateRequest(@NotBlank @Size(max = 50) String groupName) {}
    record GroupResponse(UUID id, String groupName) {}
    record BulkCheckRequest(@NotNull TimeSlot timeSlot, @NotNull LocalDate logDate, @NotNull MedicationLogStatus status) {}

    /** GET /api/v1/medication-slot-groups — 사용자 그룹 목록 */
    @GetMapping
    public ApiResponse<List<GroupResponse>> list(@AuthenticatedUserId UUID userId) {
        return ApiResponse.success(
                listSlotGroupsUseCase.list(userId).stream()
                        .map(r -> new GroupResponse(r.id(), r.groupName()))
                        .toList()
        );
    }

    /** POST /api/v1/medication-slot-groups — 그룹 생성 */
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<GroupResponse> create(
            @AuthenticatedUserId UUID userId,
            @Valid @RequestBody CreateRequest request
    ) {
        var result = createSlotGroupUseCase.create(userId, request.groupName());
        return ApiResponse.success(new GroupResponse(result.id(), result.groupName()));
    }

    /** DELETE /api/v1/medication-slot-groups/{id} — 그룹 삭제 */
    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(
            @AuthenticatedUserId UUID userId,
            @PathVariable UUID id
    ) {
        deleteSlotGroupUseCase.delete(userId, id);
    }

    /** POST /api/v1/medication-slot-groups/{id}/logs — 그룹 전체 일괄 복약 체크 (알림 액션 버튼 연동) */
    @PostMapping("/{id}/logs")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void bulkCheck(
            @AuthenticatedUserId UUID userId,
            @PathVariable UUID id,
            @Valid @RequestBody BulkCheckRequest request
    ) {
        bulkCheckGroupMedicationUseCase.bulkCheck(userId, id, request.timeSlot(), request.logDate(), request.status());
    }
}
