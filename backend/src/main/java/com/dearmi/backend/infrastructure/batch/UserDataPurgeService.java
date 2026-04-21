package com.dearmi.backend.infrastructure.batch;

import com.dearmi.backend.infrastructure.external.s3.S3Service;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

/**
 * 탈퇴 30일 경과 유저의 모든 데이터를 영구 삭제.
 *
 * <p>FK 의존성 순서대로 자식 → 부모 순으로 삭제. audit_logs 는 컴플라이언스 차원에서 보존하되
 * user_id 만 NULL 처리하여 익명화한다.
 *
 * <p>도메인 Repository 인터페이스를 우회하고 EntityManager 로 native delete 를 쓰는 이유:
 * 모든 Repository 에 hardDeleteByUserId 를 추가하는 비용 대비 정리 잡 1군데에서만 쓰이므로
 * 인프라 레이어 잡 안에서 SQL 응집도가 더 높다. 그 대신 호출 경로를 이 서비스로 단일화한다.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class UserDataPurgeService {

    @PersistenceContext
    private EntityManager em;

    private final S3Service s3Service;

    @Transactional
    public void purge(UUID userId) {
        log.info("[UserDataPurge] start userId={}", userId);

        // 1) S3: 유저 prefix 하위 모든 오브젝트 (예외시 DB 정리는 계속)
        try {
            int p = s3Service.deleteAllByPrefix("prescriptions/" + userId + "/");
            int e = s3Service.deleteAllByPrefix("exports/" + userId + "/");
            int b = s3Service.deleteAllByPrefix("backups/" + userId + "/");
            log.info("[UserDataPurge] S3 deleted userId={} prescriptions={} exports={} backups={}",
                    userId, p, e, b);
        } catch (Exception ex) {
            log.error("[UserDataPurge] S3 cleanup failed userId={} — DB 정리는 계속 진행", userId, ex);
        }

        // 2) DB: FK 의존성 순서대로 자식 → 부모
        //    (medication_logs / prescription_medications 는 FK CASCADE 가 걸려 있지만 명시 삭제로 의도 표현)
        exec("DELETE FROM medication_logs WHERE user_id = :uid", userId);
        exec("DELETE FROM prescription_medications WHERE prescription_id IN " +
                "(SELECT id FROM prescriptions WHERE user_id = :uid)", userId);
        exec("DELETE FROM medication_schedules WHERE user_id = :uid", userId);
        exec("DELETE FROM prescriptions WHERE user_id = :uid", userId);
        exec("DELETE FROM prep_notes WHERE user_id = :uid", userId);
        exec("DELETE FROM counseling_records WHERE user_id = :uid", userId);
        exec("DELETE FROM daily_checkins WHERE user_id = :uid", userId);
        exec("DELETE FROM hospital_schedules WHERE user_id = :uid", userId);
        exec("DELETE FROM notifications WHERE user_id = :uid", userId);
        exec("DELETE FROM notification_settings WHERE user_id = :uid", userId);
        exec("DELETE FROM subscription_histories WHERE user_id = :uid", userId);
        exec("DELETE FROM subscriptions WHERE user_id = :uid", userId);
        exec("DELETE FROM export_jobs WHERE user_id = :uid", userId);
        exec("DELETE FROM refresh_tokens WHERE user_id = :uid", userId);

        // audit_logs: user_id NULL 처리 (행 자체는 보존)
        exec("UPDATE audit_logs SET user_id = NULL WHERE user_id = :uid", userId);

        // 마지막: users
        exec("DELETE FROM users WHERE id = :uid", userId);

        log.info("[UserDataPurge] done userId={}", userId);
    }

    private void exec(String sql, UUID userId) {
        int affected = em.createNativeQuery(sql).setParameter("uid", userId).executeUpdate();
        if (affected > 0) {
            log.debug("[UserDataPurge] {} rows affected: {}", affected, sql);
        }
    }
}
