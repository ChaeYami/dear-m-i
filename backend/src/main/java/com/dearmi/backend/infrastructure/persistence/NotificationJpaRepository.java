package com.dearmi.backend.infrastructure.persistence;

import com.dearmi.backend.domain.notification.Notification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface NotificationJpaRepository extends JpaRepository<Notification, UUID> {

    Optional<Notification> findByIdAndUserIdAndDeletedAtIsNull(UUID id, UUID userId);

    @Query(value = "SELECT * FROM notifications " +
                   "WHERE user_id = :userId AND deleted_at IS NULL " +
                   "ORDER BY created_at DESC " +
                   "OFFSET :offset LIMIT :size",
            nativeQuery = true)
    List<Notification> findPageByUserId(@Param("userId") UUID userId,
                                        @Param("offset") int offset,
                                        @Param("size") int size);

    @Query("SELECT COUNT(n) FROM Notification n " +
           "WHERE n.userId = :userId AND n.deletedAt IS NULL")
    long countByUserId(@Param("userId") UUID userId);

    @Query("SELECT COUNT(n) FROM Notification n " +
           "WHERE n.userId = :userId AND n.readAt IS NULL AND n.deletedAt IS NULL")
    long countUnreadByUserId(@Param("userId") UUID userId);

    @Modifying
    @Query("UPDATE Notification n SET n.readAt = :now " +
           "WHERE n.userId = :userId AND n.readAt IS NULL AND n.deletedAt IS NULL")
    int markAllReadByUserId(@Param("userId") UUID userId, @Param("now") LocalDateTime now);

    @Modifying
    @Query("UPDATE Notification n SET n.deletedAt = :now " +
           "WHERE n.userId = :userId AND n.deletedAt IS NULL")
    int softDeleteAllByUserId(@Param("userId") UUID userId, @Param("now") LocalDateTime now);

    @Modifying
    @Query("UPDATE Notification n SET n.resourceId = NULL " +
           "WHERE n.resourceId = :resourceId")
    int clearResourceId(@Param("resourceId") UUID resourceId);
}
