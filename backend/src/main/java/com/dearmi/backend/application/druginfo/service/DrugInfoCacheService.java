package com.dearmi.backend.application.druginfo.service;

import com.dearmi.backend.application.druginfo.dto.DrugInfoDto;
import com.dearmi.backend.domain.druginfo.DrugRegion;
import com.dearmi.backend.domain.prescription.PrescriptionMedication;
import com.dearmi.backend.domain.prescription.PrescriptionMedicationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
public class DrugInfoCacheService {

    private static final int CACHE_DAYS = 30;

    private final PrescriptionMedicationRepository prescriptionMedicationRepository;
    private final DrugInfoRouter drugInfoRouter;

    /**
     * DB 캐시(30일) 확인 후 없으면 region 에 맞는 약품 허가정보 API 호출
     *
     * @return 약품 정보. API 실패 시 Optional.empty()
     */
    public Optional<DrugInfoDto> searchWithCache(String drugName, DrugRegion region) {
        if (drugName == null || drugName.isBlank()) return Optional.empty();

        LocalDateTime threshold = LocalDateTime.now().minusDays(CACHE_DAYS);
        Optional<PrescriptionMedication> cached =
                prescriptionMedicationRepository.findCachedByDrugName(drugName, threshold);

        if (cached.isPresent()) {
            PrescriptionMedication med = cached.get();
            log.debug("약품 정보 캐시 히트: drugName={}", drugName);
            return Optional.of(new DrugInfoDto(
                    med.getDrugName(),
                    med.getDrugEffect(),
                    null,
                    med.getDrugCaution(),
                    med.getManufacturer(),
                    null
            ));
        }

        log.debug("약품 정보 API 조회: drugName={}, region={}", drugName, region);
        return drugInfoRouter.searchByName(drugName, region);
    }
}
