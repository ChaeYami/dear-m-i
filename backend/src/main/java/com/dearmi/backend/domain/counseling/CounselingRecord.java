package com.dearmi.backend.domain.counseling;

import com.dearmi.backend.common.entity.BaseTimeEntity;
import com.dearmi.backend.common.converter.AesEncryptionConverter;
import com.dearmi.backend.common.converter.TagsJsonConverter;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "counseling_records")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor(access = AccessLevel.PRIVATE)
@Builder
public class CounselingRecord extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(columnDefinition = "uuid", updatable = false, nullable = false)
    private UUID id;

    @Column(name = "user_id", nullable = false, columnDefinition = "uuid")
    private UUID userId;

    /** hospital_schedules 소프트 삭제 시 애플리케이션에서 NULL 처리 (⑤ 원칙) */
    @Column(name = "schedule_id", columnDefinition = "uuid")
    private UUID scheduleId;

    @Column(name = "emotion_score")
    private Short emotionScore;

    /** AES-256-GCM 암호화 저장 */
    @Convert(converter = AesEncryptionConverter.class)
    @Column(columnDefinition = "text")
    private String content;

    /** JSON 배열로 DB 저장: ["스트레스","불안"] */
    @Convert(converter = TagsJsonConverter.class)
    @Column(length = 500)
    private List<String> tags;

    /** 진료/상담을 받은 날짜 (일정 미연결 기록에서 사용). 일정 연결 시 일정 날짜가 우선. */
    @Column(name = "consulted_at")
    private LocalDate consultedAt;

    /** 정신과 특화 구조화 섹션 — 자세한 키 구조는 RecordSections 참고. */
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb")
    @Builder.Default
    private RecordSections sections = new RecordSections();

    /** 진료 후 만족도 (1-10). emotion_score 와 분리 — 진료 자체에 대한 평가. */
    @Column(name = "visit_satisfaction")
    private Short visitSatisfaction;

    public void detachSchedule() {
        this.scheduleId = null;
    }

    public void update(Short emotionScore, String content, List<String> tags, LocalDate consultedAt,
                       RecordSections sections, Short visitSatisfaction) {
        this.emotionScore = emotionScore;
        this.content = content;
        this.tags = tags;
        this.consultedAt = consultedAt;
        if (sections != null) this.sections = sections;
        this.visitSatisfaction = visitSatisfaction;
    }
}
