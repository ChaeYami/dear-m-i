package com.dearmi.backend.domain.checkin;

import com.dearmi.backend.common.converter.TagsJsonConverter;
import com.dearmi.backend.common.entity.BaseTimeEntity;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "daily_checkins")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor(access = AccessLevel.PRIVATE)
@Builder
public class DailyCheckin extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(columnDefinition = "uuid", updatable = false, nullable = false)
    private UUID id;

    @Column(name = "user_id", nullable = false, columnDefinition = "uuid")
    private UUID userId;

    @Column(name = "checked_at", nullable = false)
    private LocalDate checkedAt;

    @Column(name = "emotion_score")
    private Short emotionScore;

    @Column(name = "trigger_tags", length = 500)
    @Convert(converter = TagsJsonConverter.class)
    private List<String> triggerTags;

    @Column(columnDefinition = "text")
    private String memo;

    @Column(name = "sleep_hours", precision = 3, scale = 1)
    private BigDecimal sleepHours;

    @Column(name = "took_medication")
    private Boolean tookMedication;

    public void update(Short emotionScore, List<String> triggerTags,
                       String memo, BigDecimal sleepHours, Boolean tookMedication) {
        this.emotionScore = emotionScore;
        this.triggerTags = triggerTags;
        this.memo = memo;
        this.sleepHours = sleepHours;
        this.tookMedication = tookMedication;
    }
}
