package com.dearmi.backend.infrastructure.external.gemini;

import com.dearmi.backend.application.prescription.dto.OcrMedicationItem;
import com.dearmi.backend.application.prescription.port.PrescriptionOcrPort;
import com.dearmi.backend.common.exception.PrescriptionOcrException;
import com.dearmi.backend.infrastructure.external.s3.S3Service;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.client.ReactorClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

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
            "이 처방전 이미지에서 약품 정보를 추출해줘.\n" +
            "반드시 아래 JSON 배열 형식으로만 응답해. 다른 텍스트 없이:\n" +
            "[{\"drugName\":\"약품명\",\"dosage\":\"용량\",\"directions\":\"용법\",\"days\":투약일수}]\n" +
            "약품이 없으면 빈 배열 [] 반환.";

    @Override
    public List<OcrMedicationItem> analyze(String s3Key) {
        try {
            byte[] imageBytes = s3Service.getObjectBytes(s3Key);
            String mimeType = detectMimeType(s3Key);
            String base64Data = Base64.getEncoder().encodeToString(imageBytes);

            Map<String, Object> inlineData = Map.of("mime_type", mimeType, "data", base64Data);
            Map<String, Object> imagePart = Map.of("inline_data", inlineData);
            Map<String, Object> textPart = Map.of("text", PROMPT);
            Map<String, Object> content = Map.of("parts", List.of(imagePart, textPart));
            Map<String, Object> body = Map.of("contents", List.of(content));

            String url = apiUrl + "?key=" + apiKey;

            ReactorClientHttpRequestFactory factory = new ReactorClientHttpRequestFactory();
            factory.setReadTimeout(Duration.ofSeconds(60));

            RestClient restClient = RestClient.builder()
                    .baseUrl(url)
                    .defaultHeader("content-type", "application/json")
                    .requestFactory(factory)
                    .build();

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
        } catch (Exception e) {
            log.error("처방전 OCR 실패: s3Key={}", s3Key, e);
            throw new PrescriptionOcrException("처방전 OCR 처리 중 오류가 발생했습니다", e);
        }
    }

    private List<OcrMedicationItem> parseOcrResult(String json) {
        try {
            String trimmed = json.strip();
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

    private String detectMimeType(String s3Key) {
        String lower = s3Key.toLowerCase();
        if (lower.endsWith(".png")) return "image/png";
        if (lower.endsWith(".gif")) return "image/gif";
        if (lower.endsWith(".webp")) return "image/webp";
        return "image/jpeg";
    }
}
