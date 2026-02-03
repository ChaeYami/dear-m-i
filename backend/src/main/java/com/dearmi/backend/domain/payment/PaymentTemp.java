package com.dearmi.backend.domain.payment;

import com.dearmi.backend.common.entity.BaseTimestampEntity;
import jakarta.persistence.*;
import lombok.*;

import java.util.UUID;

@Entity
@Table(name = "payments_temp")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor(access = AccessLevel.PRIVATE)
@Builder
public class PaymentTemp extends BaseTimestampEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(columnDefinition = "uuid", updatable = false, nullable = false)
    private UUID id;

    @Column(name = "user_id", nullable = false, columnDefinition = "uuid")
    private UUID userId;

    @Column(name = "payment_key", length = 200)
    private String paymentKey;

    @Column(name = "order_id", length = 200, unique = true)
    private String orderId;

    private Integer amount;

    @Column(name = "plan_type", length = 20)
    private String planType;

    @Column(length = 20, nullable = false)
    @Builder.Default
    private String status = PaymentStatus.PENDING.name();

    public void complete(String paymentKey) {
        this.paymentKey = paymentKey;
        this.status = PaymentStatus.COMPLETED.name();
    }

    public void fail() {
        this.status = PaymentStatus.FAILED.name();
    }
}
