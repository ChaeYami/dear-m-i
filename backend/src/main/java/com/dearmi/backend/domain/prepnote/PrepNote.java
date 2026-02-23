package com.dearmi.backend.domain.prepnote;

import com.dearmi.backend.common.entity.BaseTimeEntity;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "prep_notes")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor(access = AccessLevel.PRIVATE)
@Builder
public class PrepNote extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(columnDefinition = "uuid", updatable = false, nullable = false)
    private UUID id;

    @Column(name = "user_id", nullable = false, columnDefinition = "uuid")
    private UUID userId;

    /** hospital_schedules 소프트 삭제 시 애플리케이션에서 NULL 처리 (⑤ 원칙) */
    @Column(name = "schedule_id", columnDefinition = "uuid")
    private UUID scheduleId;

    @Column(columnDefinition = "text")
    private String content;

    /** 정신과 특화 구조화 섹션 — 자세한 키 구조는 PrepNoteSections 참고. */
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb")
    @Builder.Default
    private PrepNoteSections sections = new PrepNoteSections();

    /** PrepNote 작성 시 선택된 DailyNote ID 목록 */
    @ElementCollection
    @CollectionTable(
            name = "prep_note_linked_notes",
            joinColumns = @JoinColumn(name = "prep_note_id")
    )
    @Column(name = "daily_note_id", columnDefinition = "uuid")
    @Builder.Default
    private List<UUID> linkedNoteIds = new ArrayList<>();

    public void detachSchedule() {
        this.scheduleId = null;
    }

    public void update(String content, PrepNoteSections sections, List<UUID> linkedNoteIds) {
        this.content = content;
        if (sections != null) this.sections = sections;
        if (linkedNoteIds != null) {
            this.linkedNoteIds.clear();
            this.linkedNoteIds.addAll(linkedNoteIds);
        }
    }
}
