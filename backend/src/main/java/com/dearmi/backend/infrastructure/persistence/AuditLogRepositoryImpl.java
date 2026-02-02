package com.dearmi.backend.infrastructure.persistence;

import com.dearmi.backend.domain.audit.AuditLog;
import com.dearmi.backend.domain.audit.AuditLogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;

@Repository
@RequiredArgsConstructor
public class AuditLogRepositoryImpl implements AuditLogRepository {

    private final AuditLogJpaRepository jpa;

    @Override
    public AuditLog save(AuditLog auditLog) {
        return jpa.save(auditLog);
    }
}
