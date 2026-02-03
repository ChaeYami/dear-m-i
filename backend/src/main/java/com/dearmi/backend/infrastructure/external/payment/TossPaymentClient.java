package com.dearmi.backend.infrastructure.external.payment;

import com.dearmi.backend.common.exception.CustomException;
import com.dearmi.backend.common.exception.ErrorCode;
import com.dearmi.backend.infrastructure.external.payment.dto.TossConfirmRequest;
import com.dearmi.backend.infrastructure.external.payment.dto.TossConfirmResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientResponseException;

import java.nio.charset.StandardCharsets;
import java.util.Base64;

/**
 * 토스페이먼츠 결제 API 클라이언트.
 * 인증: Basic base64(secretKey:) — 비밀번호 없는 Basic Auth
 */
@Slf4j
@Component
public class TossPaymentClient {

    private static final String BASE_URL = "https://api.tosspayments.com/v1";

    private final WebClient webClient;

    public TossPaymentClient(WebClient.Builder webClientBuilder,
                             @Value("${toss.secret-key:}") String secretKey) {
        String encoded = Base64.getEncoder()
                .encodeToString((secretKey + ":").getBytes(StandardCharsets.UTF_8));
        this.webClient = webClientBuilder
                .baseUrl(BASE_URL)
                .defaultHeader(HttpHeaders.AUTHORIZATION, "Basic " + encoded)
                .defaultHeader(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
                .build();
    }

    /**
     * 결제 승인 API 호출.
     *
     * @throws CustomException EXTERNAL_SERVICE_ERROR — 토스페이먼츠 API 오류 시
     */
    public TossConfirmResponse confirm(String orderId, String paymentKey, int amount) {
        TossConfirmRequest body = new TossConfirmRequest(orderId, paymentKey, amount);
        try {
            return webClient.post()
                    .uri("/payments/confirm")
                    .bodyValue(body)
                    .retrieve()
                    .bodyToMono(TossConfirmResponse.class)
                    .block();
        } catch (WebClientResponseException e) {
            log.error("[TossPaymentClient] 결제 승인 실패: orderId={}, status={}, body={}",
                    orderId, e.getStatusCode(), e.getResponseBodyAsString());
            throw new CustomException(ErrorCode.EXTERNAL_SERVICE_ERROR,
                    "결제 승인 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.");
        } catch (Exception e) {
            log.error("[TossPaymentClient] 결제 승인 중 예상치 못한 오류: orderId={}", orderId, e);
            throw new CustomException(ErrorCode.EXTERNAL_SERVICE_ERROR,
                    "결제 승인 중 오류가 발생했습니다.");
        }
    }
}
