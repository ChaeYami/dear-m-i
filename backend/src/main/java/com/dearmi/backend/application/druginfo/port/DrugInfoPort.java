package com.dearmi.backend.application.druginfo.port;

import com.dearmi.backend.application.druginfo.dto.DrugInfoDto;

import java.util.Optional;

public interface DrugInfoPort {

    /**
     * 약품명으로 약학정보원 API 조회
     * 실패 시 Optional.empty() 반환 (서비스 중단이 처방전 저장을 막으면 안 됨)
     */
    Optional<DrugInfoDto> searchByName(String drugName);
}
