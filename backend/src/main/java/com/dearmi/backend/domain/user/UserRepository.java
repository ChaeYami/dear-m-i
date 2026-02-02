package com.dearmi.backend.domain.user;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * 도메인 계층 UserRepository 인터페이스.
 * Spring 의존성 없음 — 구현은 infrastructure/persistence/ 에서.
 */
public interface UserRepository {

    User save(User user);

    Optional<User> findById(UUID id);

    /** 소프트 딜리트되지 않은 활성 사용자 조회 */
    Optional<User> findByIdAndDeletedAtIsNull(UUID id);

    Optional<User> findByEmail(String email);

    Optional<User> findByOauthProviderAndOauthProviderId(String oauthProvider, String oauthProviderId);

    /** 탈퇴 30일 경과 대상 (배치 하드딜리트용) — cutoff = LocalDateTime.now().minusDays(30) */
    List<User> findHardDeleteCandidates(java.time.LocalDateTime cutoff);

    void delete(User user);
}
