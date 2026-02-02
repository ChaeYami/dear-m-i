package com.dearmi.backend.infrastructure.persistence;

import com.dearmi.backend.domain.audit.AuditLog;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface AuditLogJpaRepository extends JpaRepository<AuditLog, UUID> {
}
