package com.dearmi.backend.infrastructure.external.gemini;

import com.dearmi.backend.application.prescription.dto.OcrMedicationItem;
import com.dearmi.backend.application.prescription.dto.OcrResult;
import com.dearmi.backend.application.prescription.port.PrescriptionOcrPort;
import com.dearmi.backend.common.exception.PrescriptionOcrException;
import com.dearmi.backend.infrastructure.external.s3.S3Service;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.net.http.HttpTimeoutException;
import java.time.Duration;
import java.util.Base64;
import java.util.List;
import java.util.Map;

@Slf4j
@Component
@RequiredArgsConstructor
public class GeminiVisionClient implements PrescriptionOcrPort {

    private final S3Service s3Service;
    private final ObjectMapper objectMapper;

    @Value("${gemini.api-key}")
    private String apiKey;

    @Value("${gemini.api-url}")
    private String apiUrl;

    @Value("${gemini.fallback-url}")
    private String fallbackUrl;

    private static final String PROMPT =
            "이 한국 처방전 이미지에서 정보를 추출해줘.\n" +
            "반드시 아래 예시와 동일한 JSON 형식으로만 응답해. 다른 텍스트 없이.\n" +
            "각 약품 객체는 반드시 { 로 시작하고 } 로 끝나야 해. 여러 약품이면 , 로 구분해.\n\n" +
            "예시:\n" +
            "{\n" +
            "  \"hospitalName\": \"서울정신건강의원\",\n" +
            "  \"prescribedAt\": \"2026-04-16\",\n" +
            "  \"medications\": [\n" +
            "    {\n" +
            "      \"drugName\": \"자나팜정\",\n" +
            "      \"dosage\": \"0.25mg\",\n" +
            "      \"singleDose\": \"1정\",\n" +
            "      \"directions\": \"1일 1회 취침전\",\n" +
            "      \"days\": 14\n" +
            "    },\n" +
            "    {\n" +
            "      \"drugName\": \"에스시탈로프람정\",\n" +
            "      \"dosage\": \"10mg\",\n" +
            "      \"singleDose\": \"1정\",\n" +
            "      \"directions\": \"1일 1회 아침 식후\",\n" +
            "      \"days\": 28\n" +
            "    }\n" +
            "  ]\n" +
            "}\n\n" +
            "값이 없으면 null. medications가 없으면 빈 배열 [].\n" +
            "처방일(prescribedAt)은 반드시 YYYY-MM-DD 형식.";

    private static final Duration CONNECT_TIMEOUT = Duration.ofSeconds(10);
    private static final Duration REQUEST_TIMEOUT = Duration.ofSeconds(45);

    /** JDK HttpClient 는 thread-safe — 싱글턴으로 재사용. */
    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(CONNECT_TIMEOUT)
            .version(HttpClient.Version.HTTP_2)
            .build();

    @Override
    public OcrResult analyze(String s3Key) {
        byte[] imageBytes = s3Service.getObjectBytes(s3Key);
        String mimeType = detectMimeType(s3Key);
        String base64Data = Base64.getEncoder().encodeToString(imageBytes);
        log.info("Gemini OCR 호출 시작: s3Key={}, imageBytes={}KB", s3Key, imageBytes.length / 1024);

        Map<String, Object> inlineData = Map.of("mime_type", mimeType, "data", base64Data);
        Map<String, Object> imagePart = Map.of("inline_data", inlineData);
        Map<String, Object> textPart = Map.of("text", PROMPT);
        Map<String, Object> content = Map.of("parts", List.of(imagePart, textPart));
        Map<String, Object> body = Map.of("contents", List.of(content));

        String bodyJson;
        try {
            bodyJson = objectMapper.writeValueAsString(body);
        } catch (Exception e) {
            throw new PrescriptionOcrException("요청 body 직렬화 실패", e);
        }

        // 1차: primary (gemini-2.5-flash)
        OcrResult result = tryModel(apiUrl, bodyJson, s3Key, "primary");
        if (result != null) return result;

        // 2차: fallback (gemini-2.5-pro) — primary 가 과부하/타임아웃일 때만 도달
        log.warn("Primary 모델 실패 — fallback 모델로 재시도: s3Key={}", s3Key);
        OcrResult fallback = tryModel(fallbackUrl, bodyJson, s3Key, "fallback");
        if (fallback != null) return fallback;

        throw new PrescriptionOcrException("Gemini primary + fallback 모두 실패");
    }

    /**
     * 단일 모델 호출.
     * @return 성공 시 OcrResult, 과부하/타임아웃(폴백 가능 에러) 시 null, 기타 에러 시 예외.
     */
    private OcrResult tryModel(String modelUrl, String bodyJson, String s3Key, String tag) {
        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(modelUrl + "?key=" + apiKey))
                .timeout(REQUEST_TIMEOUT)
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(bodyJson))
                .build();

        try {
            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            int status = response.statusCode();

            if (status >= 200 && status < 300) {
                GeminiResponse parsed = objectMapper.readValue(response.body(), GeminiResponse.class);
                if (parsed == null || parsed.candidates() == null || parsed.candidates().isEmpty()) {
                    throw new PrescriptionOcrException("Gemini 응답이 비어있음 (" + tag + ")");
                }
                String text = parsed.candidates().get(0).content().parts().get(0).text();
                log.info("Gemini OCR 성공 ({}): s3Key={}", tag, s3Key);
                return parseOcrResult(text);
            }

            // 503/500/429: 폴백 시도
            if (status == 503 || status == 500 || status == 429) {
                log.warn("Gemini {} 과부하 HTTP {}: s3Key={}, body={}",
                        tag, status, s3Key, truncate(response.body(), 500));
                return null;
            }

            // 기타 4xx/5xx: 폴백해도 의미 없음 (인증/요청 형식 문제 등)
            log.error("Gemini {} HTTP {}: s3Key={}, body={}",
                    tag, status, s3Key, truncate(response.body(), 1000));
            throw new PrescriptionOcrException("Gemini HTTP " + status + " (" + tag + ")");

        } catch (HttpTimeoutException e) {
            log.warn("Gemini {} 타임아웃 ({}s 초과): s3Key={}", tag, REQUEST_TIMEOUT.toSeconds(), s3Key);
            return null;
        } catch (PrescriptionOcrException e) {
            throw e;
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new PrescriptionOcrException("OCR 인터럽트", e);
        } catch (Exception e) {
            log.error("Gemini {} 호출 실패: s3Key={}, exception={}", tag, s3Key, e.getClass().getSimpleName(), e);
            return null;
        }
    }

    private OcrResult parseOcrResult(String json) {
        try {
            String trimmed = json.strip();
            int start = trimmed.indexOf('{');
            int end = trimmed.lastIndexOf('}');
            if (start == -1 || end == -1) {
                return new OcrResult(null, null, List.of());
            }
            String jsonObj = trimmed.substring(start, end + 1);
            JsonNode root = objectMapper.readTree(jsonObj);

            String hospitalName = root.has("hospitalName") && !root.get("hospitalName").isNull()
                    ? root.get("hospitalName").asText() : null;
            String prescribedAt = root.has("prescribedAt") && !root.get("prescribedAt").isNull()
                    ? root.get("prescribedAt").asText() : null;

            List<OcrMedicationItem> medications = root.has("medications") && root.get("medications").isArray()
                    ? objectMapper.convertValue(root.get("medications"), new TypeReference<>() {})
                    : List.of();

            return new OcrResult(hospitalName, prescribedAt, medications);
        } catch (Exception e) {
            throw new PrescriptionOcrException("OCR 응답 JSON 파싱 실패: " + json, e);
        }
    }

    private String detectMimeType(String s3Key) {
        String lower = s3Key.toLowerCase();
        if (lower.endsWith(".png")) return "image/png";
        if (lower.endsWith(".gif")) return "image/gif";
        if (lower.endsWith(".webp")) return "image/webp";
        return "image/jpeg";
    }

    private static String truncate(String s, int max) {
        if (s == null) return "";
        return s.length() <= max ? s : s.substring(0, max) + "...[truncated]";
    }
}
