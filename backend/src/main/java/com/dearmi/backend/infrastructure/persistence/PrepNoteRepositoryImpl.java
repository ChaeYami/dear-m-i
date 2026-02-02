package com.dearmi.backend.infrastructure.persistence;

import com.dearmi.backend.domain.prepnote.PrepNote;
import com.dearmi.backend.domain.prepnote.PrepNoteRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
@RequiredArgsConstructor
public class PrepNoteRepositoryImpl implements PrepNoteRepository {

    private final PrepNoteJpaRepository jpa;

    @Override
    public PrepNote save(PrepNote prepNote) {
        return jpa.save(prepNote);
    }

    @Override
    public Optional<PrepNote> findByIdAndUserIdAndDeletedAtIsNull(UUID id, UUID userId) {
        return jpa.findByIdAndUserIdAndDeletedAtIsNull(id, userId);
    }

    @Override
    public List<PrepNote> findByUserIdAndDeletedAtIsNullOrderByCreatedAtDesc(UUID userId) {
        return jpa.findByUserIdAndDeletedAtIsNullOrderByCreatedAtDesc(userId);
    }

    @Override
    public void detachSchedule(UUID scheduleId) {
        jpa.detachSchedule(scheduleId);
    }
}
