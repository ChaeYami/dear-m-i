package com.dearmi.backend.domain.export;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ExportJobRepository {

    ExportJob save(ExportJob exportJob);

    Optional<ExportJob> findByIdAndUserId(UUID id, UUID userId);

    List<ExportJob> findByUserId(UUID userId);
}
