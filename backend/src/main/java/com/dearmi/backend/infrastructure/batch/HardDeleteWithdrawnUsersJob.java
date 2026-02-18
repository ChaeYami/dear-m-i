package com.dearmi.backend.infrastructure.batch;

import com.dearmi.backend.domain.user.User;
import com.dearmi.backend.domain.user.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import net.javacrumbs.shedlock.spring.annotation.SchedulerLock;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.List;

/**
 * 탈퇴 30일 경과 유저의 모든 데이터를 영구 삭제하는 일일 배치.
 * 매일 새벽 3시 (Asia/Seoul) 실행. ShedLock 으로 다중 인스턴스 환경 중복 방지.
 *
 * <p>per-user 트랜잭션으로 분리되어 있어 한 유저 정리 실패가 전체를 멈추지 않는다.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class HardDeleteWithdrawnUsersJob {

    private static final int RETENTION_DAYS = 30;

    private final UserRepository userRepository;
    private final UserDataPurgeService userDataPurgeService;

    @Scheduled(cron = "0 0 3 * * *", zone = "Asia/Seoul")
    @SchedulerLock(
            name = "hardDeleteWithdrawnUsers",
            lockAtMostFor = "PT30M",
            lockAtLeastFor = "PT1M"
    )
    public void run() {
        LocalDateTime cutoff = LocalDateTime.now().minusDays(RETENTION_DAYS);
        List<User> candidates = userRepository.findHardDeleteCandidates(cutoff);

        if (candidates.isEmpty()) {
            log.info("[HardDeleteWithdrawnUsers] no candidates (cutoff={})", cutoff);
            return;
        }

        log.info("[HardDeleteWithdrawnUsers] {} candidates (cutoff={})", candidates.size(), cutoff);

        int success = 0, fail = 0;
        for (User user : candidates) {
            try {
                userDataPurgeService.purge(user.getId());
                success++;
            } catch (Exception e) {
                log.error("[HardDeleteWithdrawnUsers] purge failed userId={}", user.getId(), e);
                fail++;
            }
        }
        log.info("[HardDeleteWithdrawnUsers] done success={} fail={}", success, fail);
    }
}
