package com.dearmi.backend.domain.prescription;

import com.dearmi.backend.common.entity.BaseTimeEntity;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "prescriptions")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor(access = AccessLevel.PRIVATE)
@Builder
public class Prescription extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(columnDefinition = "uuid", updatable = false, nullable = false)
    private UUID id;

    @Column(name = "user_id", nullable = false, columnDefinition = "uuid")
    private UUID userId;

    /** hospital_schedules 소프트 삭제 시 애플리케이션에서 NULL 처리 (⑤ 원칙) */
    @Column(name = "schedule_id", columnDefinition = "uuid")
    private UUID scheduleId;

    @Column(name = "s3_key", length = 500)
    private String s3Key;

    @Column(name = "hospital_name", length = 200)
    private String hospitalName;

    @Column(name = "ocr_raw_text", columnDefinition = "text")
    private String ocrRawText;

    @Column(name = "ocr_status", length = 20, nullable = false)
    @Builder.Default
    private String ocrStatus = OcrStatus.PENDING.name();

    @Column(name = "prescribed_at")
    private LocalDate prescribedAt;

    public void detachSchedule() {
        this.scheduleId = null;
    }

    public void updateFromOcr(String hospitalName, LocalDate prescribedAt) {
        if (hospitalName != null && !hospitalName.isBlank()) this.hospitalName = hospitalName;
        if (prescribedAt != null) this.prescribedAt = prescribedAt;
    }

    public void completeOcr(String rawText) {
        this.ocrRawText = rawText;
        this.ocrStatus = OcrStatus.COMPLETED.name();
    }

    public void failOcr() {
        this.ocrStatus = OcrStatus.FAILED.name();
    }

    public void startOcr() {
        this.ocrStatus = OcrStatus.PROCESSING.name();
    }

    /** 재시도: 상태를 PENDING 으로 초기화 (이전 rawText/medications 는 호출 전에 삭제할 것) */
    public void resetForRetry() {
        this.ocrStatus = OcrStatus.PENDING.name();
        this.ocrRawText = null;
    }
}
