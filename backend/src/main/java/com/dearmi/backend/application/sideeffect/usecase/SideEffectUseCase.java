package com.dearmi.backend.application.sideeffect.usecase;

import com.dearmi.backend.application.sideeffect.dto.CreateSideEffectCommand;
import com.dearmi.backend.application.sideeffect.dto.SideEffectLogResult;
import com.dearmi.backend.application.sideeffect.dto.UpdateSideEffectCommand;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

/**
 * 부작용 로그 CRUD + prep note 자동 첨부용 조회.
 * UseCase 가 작아서 단일 인터페이스로 묶음 — Controller 가 직접 의존하는 메서드 단위.
 */
public interface SideEffectUseCase {

    SideEffectLogResult create(CreateSideEffectCommand command);

    SideEffectLogResult update(UpdateSideEffectCommand command);

    void delete(UUID userId, UUID logId);

    /** 페이지 조회 (occurred_at DESC). */
    List<SideEffectLogResult> getList(UUID userId, int page, int size);

    long countAll(UUID userId);

    /** 특정 시점 이후 (prep note 자동 첨부용). */
    List<SideEffectLogResult> getSince(UUID userId, LocalDateTime since);
}
