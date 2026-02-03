package com.dearmi.backend.infrastructure.external.druginfo;

import com.dearmi.backend.application.druginfo.dto.DrugInfoDto;
import com.dearmi.backend.application.druginfo.port.DrugInfoPort;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;

import java.util.Optional;

/**
 * 의약품개요정보(e약은요) 서비스 클라이언트
 * API: DrbEasyDrugInfoService / getDrbEasyDrugList
 * 문서: https://apis.data.go.kr/1471000/DrbEasyDrugInfoService
 */
@Slf4j
@Component
public class DrugInfoClient implements DrugInfoPort {

    private static final String OPERATION = "/getDrbEasyDrugList";

    private final WebClient webClient;
    private final ObjectMapper objectMapper;
    private final String serviceKey;

    public DrugInfoClient(
            WebClient.Builder webClientBuilder,
            ObjectMapper objectMapper,
            @Value("${drug-info.api-url}") String apiUrl,
            @Value("${drug-info.api-key}") String serviceKey
    ) {
        this.webClient = webClientBuilder.baseUrl(apiUrl).build();
        this.objectMapper = objectMapper;
        this.serviceKey = serviceKey;
    }

    @Override
    public Optional<DrugInfoDto> searchByName(String drugName) {
        try {
            // 공공데이터포털 ServiceKey는 이미 URL 인코딩된 형태로 발급 → 이중 인코딩 방지를 위해 raw URL 조합
            String uri = OPERATION
                    + "?itemName=" + encode(drugName)
                    + "&ServiceKey=" + serviceKey
                    + "&type=json&numOfRows=1";

            String body = webClient.get()
                    .uri(uri)
                    .retrieve()
                    .bodyToMono(String.class)
                    .block();

            return parseResponse(body, drugName);

        } catch (Exception e) {
            log.warn("약학정보원 API 호출 실패: drugName={}, error={}", drugName, e.getMessage());
            return Optional.empty();
        }
    }

    private Optional<DrugInfoDto> parseResponse(String body, String queryName) {
        try {
            JsonNode root = objectMapper.readTree(body);

            // 결과코드 확인
            String resultCode = root.path("header").path("resultCode").asText();
            if (!"00".equals(resultCode)) {
                log.warn("약학정보원 API 오류 응답: resultCode={}", resultCode);
                return Optional.empty();
            }

            JsonNode items = root.path("body").path("items");
            if (items.isMissingNode() || items.isNull()) return Optional.empty();

            // items 는 배열 또는 {item:[...]} 구조일 수 있음
            JsonNode item;
            if (items.isArray()) {
                if (items.isEmpty()) return Optional.empty();
                item = items.get(0);
            } else {
                JsonNode itemNode = items.path("item");
                if (itemNode.isMissingNode() || itemNode.isNull()) return Optional.empty();
                item = itemNode.isArray() ? itemNode.get(0) : itemNode;
            }

            if (item == null || item.isNull()) return Optional.empty();

            // 응답 필드 매핑 (DrbEasyDrugInfoService 스펙)
            String itemName   = text(item, "itemName");    // 제품명
            String effect     = text(item, "efcyQesitm");  // 문항1(효능)
            String caution    = mergeText(                  // 문항3(주의경고) + 문항4(주의사항) 합산
                                  text(item, "atpnWarnQesitm"),
                                  text(item, "atpnQesitm")
                               );
            String mfr        = text(item, "entpName");    // 업체명

            String drugName = (itemName != null) ? itemName : queryName;
            return Optional.of(new DrugInfoDto(drugName, effect, caution, mfr));

        } catch (Exception e) {
            log.warn("약학정보원 응답 파싱 실패: {}", e.getMessage());
            return Optional.empty();
        }
    }

    private String text(JsonNode node, String field) {
        JsonNode f = node.get(field);
        if (f == null || f.isNull()) return null;
        String v = f.asText().strip();
        return v.isEmpty() ? null : v;
    }

    /** 두 텍스트를 합산. 둘 다 null이면 null 반환 */
    private String mergeText(String a, String b) {
        if (a == null && b == null) return null;
        if (a == null) return b;
        if (b == null) return a;
        return a + "\n" + b;
    }

    private String encode(String value) {
        try {
            return java.net.URLEncoder.encode(value, java.nio.charset.StandardCharsets.UTF_8);
        } catch (Exception e) {
            return value;
        }
    }
}
