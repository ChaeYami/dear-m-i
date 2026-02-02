package com.dearmi.backend.infrastructure.persistence;

import com.dearmi.backend.domain.user.User;
import com.dearmi.backend.domain.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
@RequiredArgsConstructor
public class UserRepositoryImpl implements UserRepository {

    private final UserJpaRepository jpa;

    @Override
    public User save(User user) {
        return jpa.save(user);
    }

    @Override
    public Optional<User> findById(UUID id) {
        return jpa.findById(id);
    }

    @Override
    public Optional<User> findByIdAndDeletedAtIsNull(UUID id) {
        return jpa.findByIdAndDeletedAtIsNull(id);
    }

    @Override
    public Optional<User> findByEmail(String email) {
        return jpa.findByEmail(email);
    }

    @Override
    public Optional<User> findByOauthProviderAndOauthProviderId(String oauthProvider, String oauthProviderId) {
        return jpa.findByOauthProviderAndOauthProviderId(oauthProvider, oauthProviderId);
    }

    @Override
    public List<User> findHardDeleteCandidates(LocalDateTime cutoff) {
        return jpa.findHardDeleteCandidates(cutoff);
    }

    @Override
    public void delete(User user) {
        jpa.delete(user);
    }
}
