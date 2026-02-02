package com.dearmi.backend.domain.appversion;

import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "app_versions")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor(access = AccessLevel.PRIVATE)
@Builder
@EntityListeners(AuditingEntityListener.class)
public class AppVersion {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(columnDefinition = "uuid", updatable = false, nullable = false)
    private UUID id;

    /** ios / android */
    @Column(length = 10, nullable = false)
    private String platform;

    /** 이 버전 미만은 강제 업데이트 */
    @Column(name = "min_version", length = 20, nullable = false)
    private String minVersion;

    @Column(name = "latest_version", length = 20, nullable = false)
    private String latestVersion;

    @Column(name = "force_update", nullable = false)
    @Builder.Default
    private Boolean forceUpdate = false;

    @Column(name = "update_message_ko", columnDefinition = "text")
    private String updateMessageKo;

    @Column(name = "update_message_en", columnDefinition = "text")
    private String updateMessageEn;

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
}
