package com.dearmi.backend.infrastructure.persistence;

import com.dearmi.backend.domain.dailynote.DailyNote;
import com.dearmi.backend.domain.dailynote.DailyNoteRepository;
import com.dearmi.backend.domain.dailynote.NoteType;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
@RequiredArgsConstructor
public class DailyNoteRepositoryImpl implements DailyNoteRepository {

    private final DailyNoteJpaRepository jpa;

    @Override
    public DailyNote save(DailyNote note) {
        return jpa.save(note);
    }

    @Override
    public Optional<DailyNote> findByIdAndUserIdAndDeletedAtIsNull(UUID id, UUID userId) {
        return jpa.findByIdAndUserIdAndDeletedAtIsNull(id, userId);
    }

    @Override
    public List<DailyNote> findByUserId(UUID userId, LocalDate startDate, LocalDate endDate, NoteType noteType) {
        // PostgreSQL cannot infer type of bare null params in JPQL IS NULL checks,
        // so we substitute sentinel values instead of passing null.
        LocalDate effectiveStart = startDate != null ? startDate : LocalDate.of(2000, 1, 1);
        LocalDate effectiveEnd = endDate != null ? endDate : LocalDate.now();
        return jpa.findByUserIdFiltered(userId, effectiveStart, effectiveEnd, noteType);
    }

    @Override
    public List<DailyNote> findByUsedInPrepNoteId(UUID prepNoteId) {
        return jpa.findByUsedInPrepNoteId(prepNoteId);
    }

    @Override
    public List<DailyNote> findAllByIdInAndUserId(List<UUID> ids, UUID userId) {
        if (ids == null || ids.isEmpty()) return List.of();
        return jpa.findAllByIdInAndUserId(ids, userId);
    }
}
