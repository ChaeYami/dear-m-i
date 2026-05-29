package com.dearmi.backend.infrastructure.external.druginfo;

import com.dearmi.backend.application.druginfo.dto.DrugInfoDto;
import com.dearmi.backend.application.druginfo.port.DrugInfoPort;
import com.dearmi.backend.domain.druginfo.DrugRegion;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientResponseException;

import java.time.Duration;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

/**
 * OpenFDA Drug Label API (미국 약품 라벨) 클라이언트 — region=US.
 * OCR 약품명을 {@link RxNormClient} 로 정규화한 뒤 OpenFDA 에서 라벨을 조회한다.
 *
 * <p>매핑(→ {@link DrugInfoDto}):
 * <ul>
 *   <li>effect      ← indications_and_usage</li>
 *   <li>usage       ← dosage_and_administration</li>
 *   <li>caution     ← boxed_warning + (warnings_and_cautions ?? warnings ?? precautions)</li>
 *   <li>manufacturer← openfda.manufacturer_name</li>
 *   <li>drugName    ← openfda.brand_name ?? openfda.generic_name</li>
 *   <li>itemSeq     ← set_id (DailyMed 링크용:
 *       https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid={set_id})</li>
 * </ul>
 *
 * <p>⚠️ set_id 는 36자(UUID 형식). MedicationSchedule.item_seq 는 현재 VARCHAR(20)
 * (KR 품목기준코드 기준)이므로, US 라우팅을 실제로 켜기 전에 V25 마이그레이션에서
 * item_seq 를 VARCHAR(64) 로 확장해야 한다. (TODO 3)
 */
@Slf4j
@Component
public class OpenFdaDrugInfoClient implements DrugInfoPort {

    private static final Duration TIMEOUT = Duration.ofSeconds(5);
    /** 라벨 텍스트가 수만 자에 달할 수 있어(예: 처방약 warnings_and_cautions) 모바일 페이로드 보호용 상한. */
    private static final int MAX_FIELD_LEN = 6000;
    private static final int MANUFACTURER_MAX = 200; // openfda.manufacturer 컬럼 길이

    private final WebClient webClient;
    private final ObjectMapper objectMapper;
    private final RxNormClient rxNormClient;
    private final String apiKey;

    public OpenFdaDrugInfoClient(
            WebClient.Builder webClientBuilder,
            ObjectMapper objectMapper,
            RxNormClient rxNormClient,
            @Value("${openfda.api-url}") String apiUrl,
            @Value("${openfda.api-key:}") String apiKey
    ) {
        this.webClient = webClientBuilder.baseUrl(apiUrl).build();
        this.objectMapper = objectMapper;
        this.rxNormClient = rxNormClient;
        this.apiKey = apiKey;
    }

    @Override
    public DrugRegion region() {
        return DrugRegion.US;
    }

    @Override
    public Optional<DrugInfoDto> searchByName(String drugName) {
        if (drugName == null || drugName.isBlank()) return Optional.empty();
        try {
            String normalized = rxNormClient.normalize(drugName);

            // 처방약 우선 → 없으면(OTC 등) 필터 없이 재시도
            Optional<DrugInfoDto> result = query(normalized, true);
            if (result.isEmpty()) result = query(normalized, false);
            return result;
        } catch (Exception e) {
            log.warn("OpenFDA 호출 실패: drugName={}, error={}", drugName, e.getMessage());
            return Optional.empty();
        }
    }

    private Optional<DrugInfoDto> query(String name, boolean prescriptionOnly) {
        String enc = encode(name);
        String search = "(openfda.generic_name:%22" + enc + "%22+openfda.brand_name:%22" + enc + "%22)";
        if (prescriptionOnly) {
            search += "+AND+openfda.product_type:%22HUMAN+PRESCRIPTION+DRUG%22";
        }
        String uri = "?search=" + search + "&limit=1";
        if (apiKey != null && !apiKey.isBlank()) {
            uri += "&api_key=" + apiKey;
        }

        try {
            String body = webClient.get()
                    .uri(uri)
                    .retrieve()
                    .bodyToMono(String.class)
                    .timeout(TIMEOUT)
                    .block();
            return parseResponse(body, name);
        } catch (WebClientResponseException.NotFound e) {
            // OpenFDA 는 매칭 0건이면 404 NOT_FOUND — 정상적인 "결과 없음"
            return Optional.empty();
        }
    }

    private Optional<DrugInfoDto> parseResponse(String body, String queryName) {
        try {
            if (body == null || body.isBlank()) return Optional.empty();
            JsonNode root = objectMapper.readTree(body);
            JsonNode results = root.path("results");
            if (!results.isArray() || results.isEmpty()) return Optional.empty();

            JsonNode item = results.get(0);
            JsonNode openfda = item.path("openfda");

            String effect = truncate(joinArray(item, "indications_and_usage"));
            String usage = truncate(joinArray(item, "dosage_and_administration"));
            String caution = truncate(buildCaution(item));
            String manufacturer = clip(firstOf(openfda, "manufacturer_name"), MANUFACTURER_MAX);
            String drugName = firstNonNull(
                    firstOf(openfda, "brand_name"),
                    firstOf(openfda, "generic_name"),
                    queryName);
            String setId = item.path("set_id").asText(null);

            log.info("OpenFDA 약품 정보 조회 성공: {} (set_id={})", drugName, setId);
            return Optional.of(new DrugInfoDto(drugName, effect, usage, caution, manufacturer, setId));
        } catch (Exception e) {
            log.warn("OpenFDA 응답 파싱 실패: {}", e.getMessage());
            return Optional.empty();
        }
    }

    /** boxed_warning 을 최상단에 두고, warnings_and_cautions(처방약) → warnings(OTC) → precautions 순으로 본문 채움. */
    private String buildCaution(JsonNode item) {
        List<String> parts = new ArrayList<>();

        String boxed = joinArray(item, "boxed_warning");
        if (boxed != null) parts.add("## Boxed Warning\n" + boxed);

        String main = firstNonNull(
                joinArray(item, "warnings_and_cautions"),
                joinArray(item, "warnings"),
                joinArray(item, "precautions"));
        if (main != null) parts.add(main);

        return parts.isEmpty() ? null : String.join("\n\n", parts);
    }

    /** 문자열 배열 필드를 줄바꿈 2개로 연결. 비어 있으면 null. */
    private String joinArray(JsonNode node, String field) {
        JsonNode arr = node.path(field);
        if (!arr.isArray() || arr.isEmpty()) return null;
        StringBuilder sb = new StringBuilder();
        for (JsonNode el : arr) {
            String v = el.asText("").strip();
            if (!v.isEmpty()) {
                if (sb.length() > 0) sb.append("\n\n");
                sb.append(v);
            }
        }
        return sb.length() > 0 ? sb.toString() : null;
    }

    /** openfda 객체의 배열 필드 첫 값. */
    private String firstOf(JsonNode node, String field) {
        JsonNode arr = node.path(field);
        if (!arr.isArray() || arr.isEmpty()) return null;
        String v = arr.get(0).asText("").strip();
        return v.isEmpty() ? null : v;
    }

    private String firstNonNull(String... values) {
        for (String v : values) if (v != null && !v.isBlank()) return v;
        return null;
    }

    private String truncate(String s) {
        if (s == null) return null;
        return s.length() <= MAX_FIELD_LEN ? s : s.substring(0, MAX_FIELD_LEN).strip() + "…";
    }

    private String clip(String s, int max) {
        if (s == null) return null;
        return s.length() <= max ? s : s.substring(0, max);
    }

    /** 공백은 %20 으로 (OpenFDA 쿼리에서 '+' 는 토큰 구분자라 phrase 내부 공백과 충돌) */
    private String encode(String value) {
        try {
            return java.net.URLEncoder.encode(value, java.nio.charset.StandardCharsets.UTF_8)
                    .replace("+", "%20");
        } catch (Exception e) {
            return value;
        }
    }
}
