package com.dearmi.backend.infrastructure.external.gemini;

import com.dearmi.backend.application.prescription.dto.OcrMedicationItem;
import com.dearmi.backend.application.prescription.dto.OcrResult;
import com.dearmi.backend.application.prescription.port.PrescriptionOcrPort;
import com.dearmi.backend.common.exception.PrescriptionOcrException;
import com.dearmi.backend.infrastructure.external.s3.S3Service;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.netty.channel.ChannelOption;
import io.netty.handler.timeout.ReadTimeoutHandler;
import io.netty.handler.timeout.WriteTimeoutHandler;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.client.ReactorClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.HttpServerErrorException;
import org.springframework.web.client.HttpStatusCodeException;
import org.springframework.web.client.RestClient;
import reactor.netty.http.client.HttpClient;

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

    private static final int MAX_RETRIES = 1;
    private static final long RETRY_BASE_DELAY_MS = 3_000;
    private static final int CONNECT_TIMEOUT_MS = 10_000;
    private static final int WRITE_TIMEOUT_SEC = 30;
    private static final int READ_TIMEOUT_SEC = 40;
    private static final Duration RESPONSE_TIMEOUT = Duration.ofSeconds(40);

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

        String url = apiUrl + "?key=" + apiKey;

        // reactor-netty HttpClient 에 connect/write/read/response 타임아웃 모두 명시.
        // ReactorClientHttpRequestFactory.setReadTimeout 단독으로는 body 전송 단계 hang 을 못 막음.
        HttpClient httpClient = HttpClient.create()
                .option(ChannelOption.CONNECT_TIMEOUT_MILLIS, CONNECT_TIMEOUT_MS)
                .responseTimeout(RESPONSE_TIMEOUT)
                .doOnConnected(conn -> conn
                        .addHandlerLast(new ReadTimeoutHandler(READ_TIMEOUT_SEC))
                        .addHandlerLast(new WriteTimeoutHandler(WRITE_TIMEOUT_SEC)));
        ReactorClientHttpRequestFactory factory = new ReactorClientHttpRequestFactory(httpClient);

        RestClient restClient = RestClient.builder()
                .baseUrl(url)
                .defaultHeader("content-type", "application/json")
                .requestFactory(factory)
                .build();

        Exception lastException = null;
        for (int attempt = 0; attempt <= MAX_RETRIES; attempt++) {
            try {
                GeminiResponse response = restClient.post()
                        .body(body)
                        .retrieve()
                        .body(GeminiResponse.class);

                if (response == null || response.candidates() == null || response.candidates().isEmpty()) {
                    throw new PrescriptionOcrException("Gemini API 응답이 비어있습니다");
                }

                String responseText = response.candidates().get(0).content().parts().get(0).text();
                return parseOcrResult(responseText);

            } catch (PrescriptionOcrException e) {
                throw e;
            } catch (HttpStatusCodeException e) {
                int status = e.getStatusCode().value();
                boolean retryable = (status == 503 || status == 429 || status == 500);
                if (retryable && attempt < MAX_RETRIES) {
                    long delay = RETRY_BASE_DELAY_MS * (1L << attempt); // 5s, 10s, 20s
                    log.warn("Gemini {} 오류, {}ms 후 재시도 ({}/{}): s3Key={}", status, delay, attempt + 1, MAX_RETRIES, s3Key);
                    try { Thread.sleep(delay); } catch (InterruptedException ie) { Thread.currentThread().interrupt(); break; }
                    lastException = e;
                } else {
                    log.error("처방전 OCR 실패: s3Key={}", s3Key, e);
                    throw new PrescriptionOcrException("처방전 OCR 처리 중 오류가 발생했습니다", e);
                }
            } catch (Exception e) {
                log.error("처방전 OCR 실패: s3Key={}", s3Key, e);
                throw new PrescriptionOcrException("처방전 OCR 처리 중 오류가 발생했습니다", e);
            }
        }
        throw new PrescriptionOcrException("처방전 OCR 최대 재시도 초과", lastException);
    }

    private OcrResult parseOcrResult(String json) {
        try {
            String trimmed = json.strip();
            // JSON 객체 추출 (```json ... ``` 마크다운 블록 대응)
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
}
