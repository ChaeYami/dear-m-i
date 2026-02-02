package com.dearmi.backend.domain.counseling;

import com.dearmi.backend.common.entity.BaseTimeEntity;
import jakarta.persistence.*;
import lombok.*;

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

    @Column(columnDefinition = "text")
    private String content;

    @Column(length = 500)
    private String tags;

    public void detachSchedule() {
        this.scheduleId = null;
    }

    public void update(Short emotionScore, String content, String tags) {
        this.emotionScore = emotionScore;
        this.content = content;
        this.tags = tags;
    }
}
