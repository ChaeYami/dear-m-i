package com.dearmi.backend.infrastructure.persistence;

import com.dearmi.backend.domain.payment.PaymentStatus;
import com.dearmi.backend.domain.payment.PaymentTemp;
import com.dearmi.backend.domain.payment.PaymentTempRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
@RequiredArgsConstructor
public class PaymentTempRepositoryImpl implements PaymentTempRepository {

    private final PaymentTempJpaRepository jpa;

    @Override
    public PaymentTemp save(PaymentTemp paymentTemp) {
        return jpa.save(paymentTemp);
    }

    @Override
    public Optional<PaymentTemp> findByOrderId(String orderId) {
        return jpa.findByOrderId(orderId);
    }

    @Override
    public List<PaymentTemp> findStalePendingPayments(LocalDateTime before) {
        return jpa.findByStatusAndCreatedAtBefore(PaymentStatus.PENDING.name(), before);
    }

    @Override
    public void delete(PaymentTemp paymentTemp) {
        jpa.delete(paymentTemp);
    }

    @Override
    public void deleteByCreatedAtBefore(LocalDateTime before) {
        jpa.deleteByCreatedAtBefore(before);
    }
}
