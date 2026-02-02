package com.dearmi.backend.domain.checkin;

import com.dearmi.backend.common.entity.BaseTimeEntity;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
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

    @Column(columnDefinition = "text")
    private String memo;

    public void update(Short emotionScore, String memo) {
        this.emotionScore = emotionScore;
        this.memo = memo;
    }
}
