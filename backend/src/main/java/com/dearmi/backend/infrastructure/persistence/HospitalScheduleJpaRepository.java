package com.dearmi.backend.infrastructure.persistence;

import com.dearmi.backend.domain.hospital.HospitalSchedule;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface HospitalScheduleJpaRepository extends JpaRepository<HospitalSchedule, UUID> {

    Optional<HospitalSchedule> findByIdAndUserIdAndDeletedAtIsNull(UUID id, UUID userId);

    List<HospitalSchedule> findByUserIdAndDeletedAtIsNullOrderByScheduledAtDesc(UUID userId);
}
