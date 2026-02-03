package com.dearmi.backend.infrastructure.batch;

import com.dearmi.backend.domain.subscription.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

/**
 * 만료된 프리미엄 구독을 FREE 플랜으로 다운그레이드하는 배치 작업.
 * 매일 새벽 1시 실행. expires_at < now() AND plan = 'PREMIUM' 대상.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class SubscriptionExpireJob {

    private final SubscriptionRepository subscriptionRepository;
    private final SubscriptionHistoryRepository subscriptionHistoryRepository;

    @Scheduled(cron = "0 0 1 * * *", zone = "Asia/Seoul")
    @Transactional
    public void expireSubscriptions() {
        LocalDateTime now = LocalDateTime.now();
        List<Subscription> expired = subscriptionRepository.findExpiredPremiumSubscriptions(now);

        if (expired.isEmpty()) {
            return;
        }

        log.info("[SubscriptionExpireJob] 만료 대상 구독 수: {}", expired.size());

        for (Subscription subscription : expired) {
            subscription.expireToFree();
            subscriptionRepository.save(subscription);

            subscriptionHistoryRepository.save(
                    SubscriptionHistory.ofEvent(
                            subscription.getUserId(),
                            SubscriptionEventType.EXPIRED,
                            SubscriptionPlan.FREE.name(),
                            null, null));
        }

        log.info("[SubscriptionExpireJob] {}건 만료 처리 완료", expired.size());
    }
}
