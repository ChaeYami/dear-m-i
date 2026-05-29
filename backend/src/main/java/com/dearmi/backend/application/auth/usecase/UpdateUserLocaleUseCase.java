package com.dearmi.backend.application.auth.usecase;

import java.util.UUID;

public interface UpdateUserLocaleUseCase {

    /**
     * 사용자 선호 로케일 갱신.
     * 약품 정보 지역(region) 라우팅 및 푸시 알림 다국어화의 단일 출처.
     *
     * @param locale 앱 언어 코드 (ko/en). 비대상 로케일은 KR 로 게이팅.
     */
    void updateLocale(UUID userId, String locale);
}
