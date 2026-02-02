package com.dearmi.backend.domain.payment;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface PaymentTempRepository {

    PaymentTemp save(PaymentTemp paymentTemp);

    Optional<PaymentTemp> findByOrderId(String orderId);

    /** 30분 초과 PENDING 건 삭제 (배치 정리용) */
    List<PaymentTemp> findStalePendingPayments(LocalDateTime before);

    void delete(PaymentTemp paymentTemp);

    void deleteByCreatedAtBefore(LocalDateTime before);
}
