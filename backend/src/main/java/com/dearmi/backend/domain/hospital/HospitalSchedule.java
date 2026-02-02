package com.dearmi.backend.domain.hospital;

import com.dearmi.backend.common.entity.BaseTimeEntity;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "hospital_schedules")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor(access = AccessLevel.PRIVATE)
@Builder
public class HospitalSchedule extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(columnDefinition = "uuid", updatable = false, nullable = false)
    private UUID id;

    @Column(name = "user_id", nullable = false, columnDefinition = "uuid")
    private UUID userId;

    @Column(name = "hospital_name", length = 200)
    private String hospitalName;

    @Column(name = "scheduled_at")
    private LocalDateTime scheduledAt;

    @Column(columnDefinition = "text")
    private String memo;

    @Column(length = 20, nullable = false)
    @Builder.Default
    private String status = ScheduleStatus.SCHEDULED.name();

    public void cancel() {
        this.status = ScheduleStatus.CANCELLED.name();
    }

    public void complete() {
        this.status = ScheduleStatus.COMPLETED.name();
    }

    public void update(String hospitalName, LocalDateTime scheduledAt, String memo) {
        this.hospitalName = hospitalName;
        this.scheduledAt = scheduledAt;
        this.memo = memo;
    }
}
