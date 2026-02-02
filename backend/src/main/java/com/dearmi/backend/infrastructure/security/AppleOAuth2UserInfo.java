package com.dearmi.backend.infrastructure.security;

import java.util.Map;

public class AppleOAuth2UserInfo extends OAuth2UserInfo {

    public AppleOAuth2UserInfo(Map<String, Object> attributes) {
        super(attributes);
    }

    @Override
    public String getProvider() {
        return "apple";
    }

    @Override
    public String getProviderId() {
        return (String) attributes.get("sub");
    }

    @Override
    public String getEmail() {
        return (String) attributes.get("email");
    }

    @Override
    public String getName() {
        // Apple은 최초 로그인 시에만 name을 전달하므로 없을 경우 email 사용
        Object name = attributes.get("name");
        return (name != null) ? name.toString() : getEmail();
    }
}
