package com.dearmi.backend.presentation.auth;

import com.dearmi.backend.application.auth.dto.AuthTokenResult;
import com.dearmi.backend.application.auth.dto.TokenRefreshCommand;
import com.dearmi.backend.application.auth.dto.UserResult;
import com.dearmi.backend.application.auth.usecase.GetCurrentUserUseCase;
import com.dearmi.backend.application.auth.usecase.LogoutUseCase;
import com.dearmi.backend.application.auth.usecase.TokenRefreshUseCase;
import com.dearmi.backend.application.auth.usecase.WithdrawUseCase;
import com.dearmi.backend.common.response.ApiResponse;
import com.dearmi.backend.infrastructure.security.AuthenticatedUserId;
import com.dearmi.backend.presentation.auth.dto.AuthTokenResponse;
import com.dearmi.backend.presentation.auth.dto.TokenRefreshRequest;
import com.dearmi.backend.presentation.auth.dto.UserResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthController {

    private final TokenRefreshUseCase tokenRefreshUseCase;
    private final LogoutUseCase logoutUseCase;
    private final GetCurrentUserUseCase getCurrentUserUseCase;
    private final WithdrawUseCase withdrawUseCase;

    /**
     * Refresh Token으로 새 Access/Refresh Token 발급 (Rotation)
     * - 공개 엔드포인트 (JWT 불필요)
     */
    @PostMapping("/refresh")
    public ResponseEntity<ApiResponse<AuthTokenResponse>> refresh(
            @RequestBody @Valid TokenRefreshRequest request) {
        AuthTokenResult result = tokenRefreshUseCase.refresh(new TokenRefreshCommand(request.refreshToken()));
        return ResponseEntity.ok(ApiResponse.success(
                new AuthTokenResponse(result.accessToken(), result.refreshToken())));
    }

    /**
     * 로그아웃 — refresh_tokens 테이블에서 해당 userId 토큰 삭제
     * - JWT 인증 필요
     */
    @PostMapping("/logout")
    public ResponseEntity<ApiResponse<Void>> logout(@AuthenticatedUserId UUID userId) {
        logoutUseCase.logout(userId);
        return ResponseEntity.ok(ApiResponse.success());
    }

    /**
     * 현재 로그인한 사용자 정보 반환
     * - JWT 인증 필요
     */
    @GetMapping("/me")
    public ResponseEntity<ApiResponse<UserResponse>> me(@AuthenticatedUserId UUID userId) {
        UserResult result = getCurrentUserUseCase.getCurrentUser(userId);
        return ResponseEntity.ok(ApiResponse.success(
                new UserResponse(result.userId(), result.email(), result.name(), result.plan())));
    }

    /**
     * 회원 탈퇴 (원칙 ⑥)
     * - PII 익명화 + soft delete
     * - refresh_tokens 즉시 삭제 → 동일 토큰으로 재요청 시 401
     * - 30일 후 HardDeleteWithdrawnUsersJob 이 row 와 S3 객체 영구 삭제
     */
    @DeleteMapping("/me")
    public ResponseEntity<ApiResponse<Void>> withdraw(@AuthenticatedUserId UUID userId) {
        withdrawUseCase.withdraw(userId);
        return ResponseEntity.ok(ApiResponse.success());
    }
}
