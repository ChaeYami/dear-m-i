package com.dearmi.backend.domain.audit;

import java.util.UUID;

public interface AuditLogRepository {

    AuditLog save(AuditLog auditLog);
}
