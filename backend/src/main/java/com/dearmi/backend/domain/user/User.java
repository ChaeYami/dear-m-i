package com.dearmi.backend.domain.user;

import com.dearmi.backend.common.entity.BaseTimeEntity;
import jakarta.persistence.*;
import lombok.*;

import java.util.UUID;

@Entity
@Table(name = "users")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor(access = AccessLevel.PRIVATE)
@Builder
public class User extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(columnDefinition = "uuid", updatable = false, nullable = false)
    private UUID id;

    @Column(length = 255, unique = true)
    private String email;

    @Column(length = 100)
    private String name;

    @Column(name = "oauth_provider", length = 20)
    private String oauthProvider;

    @Column(name = "oauth_provider_id", length = 255)
    private String oauthProviderId;

    @Column(name = "fcm_token", length = 500)
    private String fcmToken;

    @Builder.Default
    @Column(name = "preferred_locale", length = 5)
    private String preferredLocale = "ko";

    public void updateFcmToken(String fcmToken) {
        this.fcmToken = fcmToken;
    }

    /**
     * 같은 이메일의 기존 유저에게 새 OAuth provider 연결.
     * Google / Apple 모두 이메일 소유권을 검증하므로 auto-link 안전.
     */
    public void linkOAuthProvider(String provider, String providerId) {
        this.oauthProvider = provider;
        this.oauthProviderId = providerId;
    }

    public void updateName(String name) {
        this.name = name;
    }

    public void updatePreferredLocale(String preferredLocale) {
        this.preferredLocale = preferredLocale;
    }

    /**
     * 탈퇴 처리 — PII 즉시 익명화 + softDelete.
     * 30일 유예 기간 동안 row 는 유지되지만 식별 정보는 모두 제거된다.
     * email 은 unique 제약 회피를 위해 placeholder 로 치환한다.
     */
    public void withdraw() {
        this.email = "withdrawn-" + this.id + "@dearmi.local";
        this.name = null;
        this.oauthProvider = null;
        this.oauthProviderId = null;
        this.fcmToken = null;
        softDelete();
    }
}
