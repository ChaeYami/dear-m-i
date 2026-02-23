package com.dearmi.backend.domain.dailynote;

import com.dearmi.backend.common.entity.BaseTimeEntity;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "daily_notes")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor(access = AccessLevel.PRIVATE)
@Builder
public class DailyNote extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(columnDefinition = "uuid", updatable = false, nullable = false)
    private UUID id;

    @Column(name = "user_id", nullable = false, columnDefinition = "uuid")
    private UUID userId;

    @Column(columnDefinition = "text", nullable = false)
    private String body;

    @Enumerated(EnumType.STRING)
    @Column(name = "note_type", nullable = false, length = 20)
    private NoteType noteType;

    @Column(name = "note_date", nullable = false)
    private LocalDate noteDate;

    /** PrepNote 작성 시 선택되면 채워짐 (nullable) */
    @Column(name = "used_in_prep_note_id", columnDefinition = "uuid")
    private UUID usedInPrepNoteId;

    public void markUsedInPrepNote(UUID prepNoteId) {
        this.usedInPrepNoteId = prepNoteId;
    }

    public void clearPrepNoteLink() {
        this.usedInPrepNoteId = null;
    }
}
