package com.dearmi.backend.presentation.appversion;

import com.dearmi.backend.application.appversion.usecase.CheckAppVersionUseCase;
import com.dearmi.backend.common.response.ApiResponse;
import com.dearmi.backend.presentation.appversion.dto.AppVersionResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/app")
@RequiredArgsConstructor
public class AppVersionController {

    private final CheckAppVersionUseCase checkAppVersionUseCase;

    /**
     * 앱 버전 체크 (③ 원칙)
     * - SplashScreen 시작 시 호출
     * - forceUpdate: true → 앱 진행 불가, 스토어 이동
     */
    @GetMapping("/version")
    public ResponseEntity<ApiResponse<AppVersionResponse>> checkVersion(
            @RequestParam String platform,
            @RequestParam String currentVersion
    ) {
        var result = checkAppVersionUseCase.check(platform, currentVersion);
        return ResponseEntity.ok(ApiResponse.success(AppVersionResponse.from(result)));
    }
}
