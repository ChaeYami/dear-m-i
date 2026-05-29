package com.dearmi.backend.domain.druginfo;

/**
 * 약품 정보 제공 지역(허가 관할).
 * 처방전 로케일에 따라 약품 정보 조회 소스를 라우팅하는 데 사용.
 * - KR: 식약처 의약품 제품 허가정보 API (한국)
 * - US: OpenFDA Drug Label API + RxNorm (미국/영어)
 */
public enum DrugRegion {
    KR,
    US;

    /**
     * 앱 로케일/언어 코드 → 약품 정보 지역.
     * en* → US, 그 외(ko 포함 비대상 로케일) → KR (기본/게이팅).
     */
    public static DrugRegion fromLocale(String locale) {
        if (locale == null || locale.isBlank()) return KR;
        return locale.toLowerCase().startsWith("en") ? US : KR;
    }
}
