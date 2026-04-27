package com.dearmi.backend.application.auth.usecase;

import com.dearmi.backend.application.auth.dto.AppleIdentityClaims;
import com.dearmi.backend.application.auth.dto.AppleNativeLoginCommand;
import com.dearmi.backend.application.auth.dto.AuthTokenResult;
import com.dearmi.backend.application.auth.dto.OAuthLoginCommand;
import com.dearmi.backend.application.auth.port.AppleIdentityTokenVerifier;
import com.dearmi.backend.common.exception.CustomException;
import com.dearmi.backend.common.exception.ErrorCode;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

@Service
@RequiredArgsConstructor
public class AppleNativeLoginUseCaseImpl implements AppleNativeLoginUseCase {

    private static final String PROVIDER_APPLE = "apple";

    private final AppleIdentityTokenVerifier appleIdentityTokenVerifier;
    private final LoginUseCase loginUseCase;

    @Override
    public AuthTokenResult login(AppleNativeLoginCommand command) {
        if (command == null || !StringUtils.hasText(command.identityToken())) {
            throw new CustomException(ErrorCode.INVALID_REQUEST);
        }

        AppleIdentityClaims claims = appleIdentityTokenVerifier.verify(command.identityToken());

        // 최초 로그인 시 앱이 보낸 fullName/email 을 우선, 없으면 identityToken 의 email claim 사용
        String email = StringUtils.hasText(command.email()) ? command.email() : claims.email();
        String name = StringUtils.hasText(command.fullName()) ? command.fullName() : null;

        return loginUseCase.login(new OAuthLoginCommand(PROVIDER_APPLE, claims.sub(), email, name));
    }
}
