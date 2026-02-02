package com.dearmi.backend.infrastructure.external.claude;

import com.dearmi.backend.application.prescription.dto.OcrMedicationItem;
import com.dearmi.backend.application.prescription.port.PrescriptionOcrPort;
import com.dearmi.backend.common.exception.PrescriptionOcrException;
import com.dearmi.backend.infrastructure.external.s3.S3Service;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.util.Base64;
import java.util.List;
import java.util.Map;

@Slf4j
@Component
@RequiredArgsConstructor
public class ClaudeVisionClient implements PrescriptionOcrPort {

    private final S3Service s3Service;
    private final ObjectMapper objectMapper;

    @Value("${claude.api-key}")
    private String apiKey;

    @Value("${claude.api-url}")
    private String apiUrl;

    private static final String MODEL = "claude-opus-4-5";
    private static final int MAX_TOKENS = 1024;
    private static final String ANTHROPIC_VERSION = "2023-06-01";

    private static final String PROMPT =
            "이 처방전 이미지에서 약품 정보를 추출해줘.\n" +
            "반드시 아래 JSON 배열 형식으로만 응답해. 다른 텍스트 없이:\n" +
            "[{\"drugName\":\"약품명\",\"dosage\":\"용량\",\"directions\":\"용법\",\"days\":투약일수}]\n" +
            "약품이 없으면 빈 배열 [] 반환.";

    @Override
    public List<OcrMedicationItem> analyze(String s3Key) {
        try {
            byte[] imageBytes = s3Service.getObjectBytes(s3Key);
            String mediaType = detectMediaType(s3Key);
            String base64Data = Base64.getEncoder().encodeToString(imageBytes);

            Map<String, Object> imageSource = Map.of(
                    "type", "base64",
                    "media_type", mediaType,
                    "data", base64Data
            );
            Map<String, Object> imageContent = Map.of("type", "image", "source", imageSource);
            Map<String, Object> textContent = Map.of("type", "text", "text", PROMPT);
            Map<String, Object> message = Map.of("role", "user", "content", List.of(imageContent, textContent));
            Map<String, Object> body = Map.of(
                    "model", MODEL,
                    "max_tokens", MAX_TOKENS,
                    "messages", List.of(message)
            );

            RestClient restClient = RestClient.builder()
                    .baseUrl(apiUrl)
                    .defaultHeader("x-api-key", apiKey)
                    .defaultHeader("anthropic-version", ANTHROPIC_VERSION)
                    .defaultHeader("content-type", "application/json")
                    .build();

            ClaudeResponse response = restClient.post()
                    .body(body)
                    .retrieve()
                    .body(ClaudeResponse.class);

            if (response == null || response.content() == null || response.content().isEmpty()) {
                throw new PrescriptionOcrException("Claude API 응답이 비어있습니다");
            }

            String responseText = response.content().get(0).text();
            return parseOcrResult(responseText);

        } catch (PrescriptionOcrException e) {
            throw e;
        } catch (Exception e) {
            log.error("처방전 OCR 실패: s3Key={}", s3Key, e);
            throw new PrescriptionOcrException("처방전 OCR 처리 중 오류가 발생했습니다", e);
        }
    }

    private List<OcrMedicationItem> parseOcrResult(String json) {
        try {
            String trimmed = json.strip();
            // JSON 배열 부분만 추출 (혹시 앞뒤에 텍스트가 있을 경우)
            int start = trimmed.indexOf('[');
            int end = trimmed.lastIndexOf(']');
            if (start == -1 || end == -1) {
                return List.of();
            }
            String jsonArray = trimmed.substring(start, end + 1);
            return objectMapper.readValue(jsonArray, new TypeReference<>() {});
        } catch (Exception e) {
            throw new PrescriptionOcrException("OCR 응답 JSON 파싱 실패: " + json, e);
        }
    }

    private String detectMediaType(String s3Key) {
        String lower = s3Key.toLowerCase();
        if (lower.endsWith(".png")) return "image/png";
        if (lower.endsWith(".gif")) return "image/gif";
        if (lower.endsWith(".webp")) return "image/webp";
        return "image/jpeg";
    }
}
