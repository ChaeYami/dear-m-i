package com.dearmi.backend.infrastructure.persistence;

import com.dearmi.backend.domain.dailynote.DailyNote;
import com.dearmi.backend.domain.dailynote.NoteType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface DailyNoteJpaRepository extends JpaRepository<DailyNote, UUID> {

    Optional<DailyNote> findByIdAndUserIdAndDeletedAtIsNull(UUID id, UUID userId);

    @Query("""
        SELECT n FROM DailyNote n
        WHERE n.userId = :userId
          AND n.deletedAt IS NULL
          AND (:startDate IS NULL OR n.noteDate >= :startDate)
          AND (:endDate IS NULL OR n.noteDate <= :endDate)
          AND (:noteType IS NULL OR n.noteType = :noteType)
        ORDER BY n.noteDate DESC, n.createdAt DESC
        """)
    List<DailyNote> findByUserIdFiltered(
            @Param("userId") UUID userId,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate,
            @Param("noteType") NoteType noteType
    );

    List<DailyNote> findByUsedInPrepNoteId(UUID prepNoteId);

    @Query("SELECT n FROM DailyNote n WHERE n.id IN :ids AND n.userId = :userId AND n.deletedAt IS NULL")
    List<DailyNote> findAllByIdInAndUserId(@Param("ids") List<UUID> ids, @Param("userId") UUID userId);
}
