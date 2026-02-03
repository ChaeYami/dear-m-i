package com.dearmi.backend.presentation.auth;

import com.dearmi.backend.application.auth.dto.AuthTokenResult;
import com.dearmi.backend.application.auth.dto.OAuthLoginCommand;
import com.dearmi.backend.application.auth.usecase.LoginUseCase;
import com.dearmi.backend.common.response.ApiResponse;
import com.dearmi.backend.presentation.auth.dto.AuthTokenResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Profile;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * 로컬 개발 전용 — OAuth2 없이 테스트 유저로 JWT 발급
 * local 프로파일에서만 활성화됨
 */
@Profile("local")
@RestController
@RequestMapping("/api/v1/dev")
@RequiredArgsConstructor
public class DevAuthController {

    private final LoginUseCase loginUseCase;

    public record DevLoginRequest(String email, String name) {}

    @PostMapping("/login")
    public ApiResponse<AuthTokenResponse> devLogin(@RequestBody DevLoginRequest request) {
        OAuthLoginCommand command = new OAuthLoginCommand(
                "DEV",
                "dev-" + request.email(),
                request.email(),
                request.name()
        );
        AuthTokenResult result = loginUseCase.login(command);
        return ApiResponse.success(new AuthTokenResponse(result.accessToken(), result.refreshToken()));
    }
}
