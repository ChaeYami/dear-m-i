package com.dearmi.backend.infrastructure.external.druginfo;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;

import java.net.URI;
import java.time.Duration;

/**
 * RxNorm/RxNav (NLM) 약품명 정규화 클라이언트.
 * OCR 로 읽힌 미국 약품명(브랜드/제네릭, 오타 가능)을 RxNorm 표준명으로 보정한다.
 * OpenFDA 조회 정확도를 높이기 위한 전처리 — 키 불필요.
 *
 * <p>정규화 실패 시 원본 약품명을 그대로 반환한다(서비스 중단/조회 차단 방지).
 */
@Slf4j
@Component
public class RxNormClient {

    private static final Duration TIMEOUT = Duration.ofSeconds(5);

    private final WebClient webClient;
    private final ObjectMapper objectMapper;
    private final String baseUrl;

    public RxNormClient(
            WebClient.Builder webClientBuilder,
            ObjectMapper objectMapper,
            @Value("${rxnorm.api-url}") String baseUrl
    ) {
        // baseUrl 미사용 — 절대 URI 직접 전달로 WebClient 템플릿 재인코딩 우회 (%20 이중 인코딩 방지)
        this.webClient = webClientBuilder.build();
        this.objectMapper = objectMapper;
        this.baseUrl = baseUrl;
    }

    /**
     * OCR 약품명 → RxNorm 표준 약품명.
     * 1) 정확/정규화 매칭(rxcui.json search=2) → 2) 근사 매칭(approximateTerm) 으로 rxcui 확보
     * → 3) rxcui 의 RxNorm Name 조회. 어느 단계든 실패하면 원본 약품명 반환.
     */
    public String normalize(String drugName) {
        if (drugName == null || drugName.isBlank()) return drugName;

        try {
            String rxcui = findRxcui(drugName);
            if (rxcui == null) rxcui = approximateRxcui(drugName);
            if (rxcui == null) {
                log.debug("RxNorm 정규화 실패(매칭 없음), 원본 사용: {}", drugName);
                return drugName;
            }

            String normalized = rxNormName(rxcui);
            if (normalized == null || normalized.isBlank()) return drugName;

            if (!normalized.equalsIgnoreCase(drugName)) {
                log.info("RxNorm 정규화: '{}' → '{}' (rxcui={})", drugName, normalized, rxcui);
            }
            return normalized;
        } catch (Exception e) {
            log.warn("RxNorm 정규화 오류, 원본 사용: drugName={}, error={}", drugName, e.getMessage());
            return drugName;
        }
    }

    /** rxcui.json?name=&search=2 (exact → normalized best match) */
    private String findRxcui(String drugName) {
        JsonNode root = get("/rxcui.json?name=" + encode(drugName) + "&search=2");
        if (root == null) return null;
        JsonNode ids = root.path("idGroup").path("rxnormId");
        return (ids.isArray() && !ids.isEmpty()) ? ids.get(0).asText(null) : null;
    }

    /** approximateTerm.json — OCR 오타 보정용 근사 매칭 */
    private String approximateRxcui(String drugName) {
        JsonNode root = get("/approximateTerm.json?term=" + encode(drugName) + "&maxEntries=1");
        if (root == null) return null;
        JsonNode candidates = root.path("approximateGroup").path("candidate");
        if (!candidates.isArray() || candidates.isEmpty()) return null;
        return candidates.get(0).path("rxcui").asText(null);
    }

    /** rxcui/{id}/property.json?propName=RxNorm Name → 표준 약품명 */
    private String rxNormName(String rxcui) {
        JsonNode root = get("/rxcui/" + encode(rxcui) + "/property.json?propName=" + encode("RxNorm Name"));
        if (root == null) return null;
        JsonNode props = root.path("propConceptGroup").path("propConcept");
        if (!props.isArray() || props.isEmpty()) return null;
        return props.get(0).path("propValue").asText(null);
    }

    private JsonNode get(String path) {
        try {
            String body = webClient.get()
                    .uri(URI.create(baseUrl + path))
                    .retrieve()
                    .bodyToMono(String.class)
                    .timeout(TIMEOUT)
                    .block();
            return (body == null || body.isBlank()) ? null : objectMapper.readTree(body);
        } catch (Exception e) {
            log.debug("RxNav 호출 실패: path={}, error={}", path, e.getMessage());
            return null;
        }
    }

    /** 공백은 %20 으로 (쿼리 토큰 구분자 '+' 와 혼동 방지) */
    private String encode(String value) {
        try {
            return java.net.URLEncoder.encode(value, java.nio.charset.StandardCharsets.UTF_8)
                    .replace("+", "%20");
        } catch (Exception e) {
            return value;
        }
    }
}
