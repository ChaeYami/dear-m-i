package com.dearmi.backend.application.druginfo.port;

import com.dearmi.backend.application.druginfo.dto.DrugInfoDto;
import com.dearmi.backend.domain.druginfo.DrugRegion;

import java.util.Optional;

public interface DrugInfoPort {

    /**
     * 약품명으로 약품 허가정보 API 조회
     * 실패 시 Optional.empty() 반환 (서비스 중단이 처방전 저장을 막으면 안 됨)
     */
    Optional<DrugInfoDto> searchByName(String drugName);

    /**
     * 이 구현체가 담당하는 약품 정보 지역.
     * {@code DrugInfoRouter} 가 region → port 매핑에 사용.
     */
    DrugRegion region();
}
