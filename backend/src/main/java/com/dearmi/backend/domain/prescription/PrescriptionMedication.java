package com.dearmi.backend.domain.prescription;

import com.dearmi.backend.common.entity.BaseTimestampEntity;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "prescription_medications")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor(access = AccessLevel.PRIVATE)
@Builder
public class PrescriptionMedication extends BaseTimestampEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(columnDefinition = "uuid", updatable = false, nullable = false)
    private UUID id;

    @Column(name = "prescription_id", nullable = false, columnDefinition = "uuid")
    private UUID prescriptionId;

    @Column(name = "drug_name", length = 200)
    private String drugName;

    @Column(name = "drug_code", length = 100)
    private String drugCode;

    @Column(length = 100)
    private String dosage;

    @Column(length = 300)
    private String directions;

    private Short days;

    @Column(name = "drug_effect", columnDefinition = "text")
    private String drugEffect;

    @Column(name = "drug_caution", columnDefinition = "text")
    private String drugCaution;

    @Column(length = 200)
    private String manufacturer;

    @Column(name = "drug_info_fetched_at")
    private LocalDateTime drugInfoFetchedAt;

    public void updateDrugInfo(String drugEffect, String drugCaution, String manufacturer) {
        this.drugEffect = drugEffect;
        this.drugCaution = drugCaution;
        this.manufacturer = manufacturer;
        this.drugInfoFetchedAt = LocalDateTime.now();
    }
}
