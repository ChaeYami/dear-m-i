package com.dearmi.backend.infrastructure.batch;

import com.dearmi.backend.domain.payment.PaymentTempRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

/**
 * 30분 경과한 미완료 payments_temp 건을 정리하는 배치 작업.
 * 매시간 정각 실행. 결제 위변조 방지를 위해 임시 상태를 주기적으로 정리.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class PaymentsTempCleanJob {

    private static final int STALE_THRESHOLD_MINUTES = 30;

    private final PaymentTempRepository paymentTempRepository;

    @Scheduled(cron = "0 0 * * * *", zone = "Asia/Seoul")
    @Transactional
    public void cleanStalePendingPayments() {
        LocalDateTime threshold = LocalDateTime.now().minusMinutes(STALE_THRESHOLD_MINUTES);
        paymentTempRepository.deleteByCreatedAtBefore(threshold);
        log.debug("[PaymentsTempCleanJob] {}분 이전 payments_temp 정리 완료", STALE_THRESHOLD_MINUTES);
    }
}
