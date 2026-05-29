package com.dearmi.backend.application.druginfo.service;

import com.dearmi.backend.application.druginfo.dto.DrugInfoDto;
import com.dearmi.backend.application.druginfo.port.DrugInfoPort;
import com.dearmi.backend.domain.druginfo.DrugRegion;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.EnumMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

/**
 * region 별 약품 정보 조회 라우터.
 * 등록된 모든 {@link DrugInfoPort} 빈을 {@link DrugRegion} → port 로 매핑해두고,
 * 처방전/복약 일정의 region 에 맞는 구현체로 분기한다.
 *
 * <p>소비자(서비스)는 {@code DrugInfoPort} 를 직접 주입하지 말고 이 라우터를 경유할 것.
 * 두 번째 port 빈(OpenFDA US)이 추가되면 직접 주입이 ambiguous 해지기 때문.
 */
@Slf4j
@Component
public class DrugInfoRouter {

    private final Map<DrugRegion, DrugInfoPort> portsByRegion;

    public DrugInfoRouter(List<DrugInfoPort> ports) {
        this.portsByRegion = new EnumMap<>(DrugRegion.class);
        for (DrugInfoPort port : ports) {
            DrugInfoPort prev = portsByRegion.put(port.region(), port);
            if (prev != null) {
                throw new IllegalStateException(
                        "동일 region 에 DrugInfoPort 가 둘 이상: region=" + port.region()
                                + ", " + prev.getClass().getSimpleName()
                                + " vs " + port.getClass().getSimpleName());
            }
        }
        log.info("DrugInfoRouter 초기화: 등록된 region={}", portsByRegion.keySet());
    }

    /**
     * region 에 맞는 port 로 약품명 조회.
     * 해당 region 구현체가 없으면 Optional.empty() (서비스 중단 방지).
     */
    public Optional<DrugInfoDto> searchByName(String drugName, DrugRegion region) {
        DrugInfoPort port = portsByRegion.get(region);
        if (port == null) {
            log.warn("지원하지 않는 약품 정보 region: {}", region);
            return Optional.empty();
        }
        return port.searchByName(drugName);
    }
}
