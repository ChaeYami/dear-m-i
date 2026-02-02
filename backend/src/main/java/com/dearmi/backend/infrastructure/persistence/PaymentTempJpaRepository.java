package com.dearmi.backend.infrastructure.persistence;

import com.dearmi.backend.domain.payment.PaymentTemp;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface PaymentTempJpaRepository extends JpaRepository<PaymentTemp, UUID> {

    Optional<PaymentTemp> findByOrderId(String orderId);

    /** 30분 초과 PENDING 건 (배치 정리용) */
    List<PaymentTemp> findByStatusAndCreatedAtBefore(String status, LocalDateTime before);

    void deleteByCreatedAtBefore(LocalDateTime before);
}
