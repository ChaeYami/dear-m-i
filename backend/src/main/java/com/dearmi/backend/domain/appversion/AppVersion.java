package com.dearmi.backend.domain.appversion;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "app_versions")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor(access = AccessLevel.PRIVATE)
@Builder
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

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    /** JPA 표준 라이프사이클 콜백 — 최초 저장 시 생성 시각 설정 (Spring 의존성 없이 순수 JPA 로 처리). */
    @PrePersist
    void onCreate() {
        if (this.createdAt == null) {
            this.createdAt = LocalDateTime.now();
        }
    }
}
