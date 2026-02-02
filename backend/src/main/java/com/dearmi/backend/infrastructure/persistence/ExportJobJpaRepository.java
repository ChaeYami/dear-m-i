package com.dearmi.backend.infrastructure.persistence;

import com.dearmi.backend.domain.export.ExportJob;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ExportJobJpaRepository extends JpaRepository<ExportJob, UUID> {

    Optional<ExportJob> findByIdAndUserId(UUID id, UUID userId);

    List<ExportJob> findByUserId(UUID userId);
}
