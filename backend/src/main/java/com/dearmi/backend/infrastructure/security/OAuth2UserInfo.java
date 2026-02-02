package com.dearmi.backend.infrastructure.security;

import java.util.Map;

/**
 * OAuth2/OIDC 프로바이더별 사용자 속성 추상화
 */
public abstract class OAuth2UserInfo {

    protected final Map<String, Object> attributes;

    protected OAuth2UserInfo(Map<String, Object> attributes) {
        this.attributes = attributes;
    }

    public abstract String getProvider();

    public abstract String getProviderId();

    public abstract String getEmail();

    public abstract String getName();

    public static OAuth2UserInfo of(String registrationId, Map<String, Object> attributes) {
        return switch (registrationId.toLowerCase()) {
            case "google" -> new GoogleOAuth2UserInfo(attributes);
            case "apple"  -> new AppleOAuth2UserInfo(attributes);
            default -> throw new IllegalArgumentException("지원하지 않는 OAuth2 프로바이더: " + registrationId);
        };
    }
}
