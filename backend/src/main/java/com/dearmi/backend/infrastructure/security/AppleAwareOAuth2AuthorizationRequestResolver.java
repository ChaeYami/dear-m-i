package com.dearmi.backend.infrastructure.security;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.security.oauth2.client.registration.ClientRegistrationRepository;
import org.springframework.security.oauth2.client.web.DefaultOAuth2AuthorizationRequestResolver;
import org.springframework.security.oauth2.client.web.OAuth2AuthorizationRequestResolver;
import org.springframework.security.oauth2.core.endpoint.OAuth2AuthorizationRequest;
import org.springframework.stereotype.Component;

import java.util.HashMap;
import java.util.Map;

/**
 * Apple Sign in with Apple 전용 요구: scope 에 name/email 포함 시 response_mode=form_post 강제.
 * Apple 외 provider (Google) 는 기본 동작 그대로.
 */
@Component
public class AppleAwareOAuth2AuthorizationRequestResolver implements OAuth2AuthorizationRequestResolver {

    private static final String APPLE_REG_ID = "apple";
    private static final String AUTHORIZATION_BASE_URI = "/oauth2/authorization";

    private final OAuth2AuthorizationRequestResolver delegate;

    public AppleAwareOAuth2AuthorizationRequestResolver(ClientRegistrationRepository repo) {
        this.delegate = new DefaultOAuth2AuthorizationRequestResolver(repo, AUTHORIZATION_BASE_URI);
    }

    @Override
    public OAuth2AuthorizationRequest resolve(HttpServletRequest request) {
        return customize(delegate.resolve(request));
    }

    @Override
    public OAuth2AuthorizationRequest resolve(HttpServletRequest request, String clientRegistrationId) {
        return customize(delegate.resolve(request, clientRegistrationId));
    }

    private OAuth2AuthorizationRequest customize(OAuth2AuthorizationRequest req) {
        if (req == null) {
            return null;
        }
        String regId = (String) req.getAttributes().get("registration_id");
        if (!APPLE_REG_ID.equals(regId)) {
            return req;
        }

        Map<String, Object> additional = new HashMap<>(req.getAdditionalParameters());
        additional.put("response_mode", "form_post");

        return OAuth2AuthorizationRequest.from(req)
                .additionalParameters(additional)
                .build();
    }
}
