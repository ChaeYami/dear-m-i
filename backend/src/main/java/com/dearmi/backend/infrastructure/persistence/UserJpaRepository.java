package com.dearmi.backend.infrastructure.persistence;

import com.dearmi.backend.domain.user.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface UserJpaRepository extends JpaRepository<User, UUID> {

    Optional<User> findByIdAndDeletedAtIsNull(UUID id);

    Optional<User> findByEmail(String email);

    Optional<User> findByOauthProviderAndOauthProviderId(String oauthProvider, String oauthProviderId);

    /** 탈퇴 30일 경과 대상 (배치 하드딜리트용) — 호출 측에서 LocalDateTime.now().minusDays(30) 전달 */
    @Query("SELECT u FROM User u WHERE u.deletedAt IS NOT NULL AND u.deletedAt < :cutoff")
    List<User> findHardDeleteCandidates(@Param("cutoff") java.time.LocalDateTime cutoff);
}
