package com.dearmi.backend.domain.export;

import com.dearmi.backend.common.entity.BaseTimestampEntity;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "export_jobs")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor(access = AccessLevel.PRIVATE)
@Builder
public class ExportJob extends BaseTimestampEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(columnDefinition = "uuid", updatable = false, nullable = false)
    private UUID id;

    @Column(name = "user_id", nullable = false, columnDefinition = "uuid")
    private UUID userId;

    @Column(length = 20, nullable = false)
    @Builder.Default
    private String status = ExportJobStatus.PENDING.name();

    @Column(name = "s3_key", length = 500)
    private String s3Key;

    @Column(name = "expires_at")
    private LocalDateTime expiresAt;

    public void complete(String s3Key, LocalDateTime expiresAt) {
        this.status = ExportJobStatus.COMPLETED.name();
        this.s3Key = s3Key;
        this.expiresAt = expiresAt;
    }

    public void fail() {
        this.status = ExportJobStatus.FAILED.name();
    }

    public void startProcessing() {
        this.status = ExportJobStatus.PROCESSING.name();
    }
}
