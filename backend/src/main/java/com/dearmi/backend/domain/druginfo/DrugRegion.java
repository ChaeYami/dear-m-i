package com.dearmi.backend.domain.druginfo;

/**
 * 약품 정보 제공 지역(허가 관할).
 * 처방전 로케일에 따라 약품 정보 조회 소스를 라우팅하는 데 사용.
 * - KR: 식약처 의약품 제품 허가정보 API (한국)
 * - US: OpenFDA Drug Label API + RxNorm (미국/영어)
 */
public enum DrugRegion {
    KR,
    US
}
