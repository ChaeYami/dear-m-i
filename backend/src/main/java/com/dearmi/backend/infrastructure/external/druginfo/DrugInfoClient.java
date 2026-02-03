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
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * 의약품 제품 허가정보 API (DrugPrdtPrmsnInfoService07)
 * - 전문의약품 포함 4만건+ 커버리지
 * - EE_DOC_DATA(효능), NB_DOC_DATA(주의사항) XML → 텍스트 추출
 */
@Slf4j
@Component
public class DrugInfoClient implements DrugInfoPort {

    private static final String BASE_URL = "https://apis.data.go.kr/1471000/DrugPrdtPrmsnInfoService07";
    private static final String DETAIL_OP = "/getDrugPrdtPrmsnDtlInq06";

    private final WebClient webClient;
    private final ObjectMapper objectMapper;
    private final String serviceKey;

    public DrugInfoClient(
            WebClient.Builder webClientBuilder,
            ObjectMapper objectMapper,
            @Value("${drug-info.api-key}") String serviceKey
    ) {
        this.webClient = webClientBuilder.baseUrl(BASE_URL).build();
        this.objectMapper = objectMapper;
        this.serviceKey = serviceKey;
    }

    @Override
    public Optional<DrugInfoDto> searchByName(String drugName) {
        try {
            String uri = DETAIL_OP
                    + "?serviceKey=" + encode(serviceKey)
                    + "&item_name=" + encode(drugName)
                    + "&type=json&numOfRows=1";

            String body = webClient.get()
                    .uri(uri)
                    .retrieve()
                    .bodyToMono(String.class)
                    .block();

            return parseResponse(body, drugName);
        } catch (Exception e) {
            log.warn("허가정보 API 호출 실패: drugName={}, error={}", drugName, e.getMessage());
            return Optional.empty();
        }
    }

    private Optional<DrugInfoDto> parseResponse(String body, String queryName) {
        try {
            JsonNode root = objectMapper.readTree(body);

            String resultCode = root.path("header").path("resultCode").asText();
            if (!"00".equals(resultCode)) {
                log.warn("허가정보 API 오류: resultCode={}", resultCode);
                return Optional.empty();
            }

            int totalCount = root.path("body").path("totalCount").asInt(0);
            if (totalCount == 0) return Optional.empty();

            JsonNode items = root.path("body").path("items");
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

            String itemName = text(item, "ITEM_NAME");
            String entpName = text(item, "ENTP_NAME");
            String itemSeq = text(item, "ITEM_SEQ");
            String effect = extractXmlText(text(item, "EE_DOC_DATA"), 0);
            String usage = extractXmlText(text(item, "UD_DOC_DATA"), 0);
            // 주의사항: 1~3번 항목만 (경고, 투여금기, 신중투여)
            String caution = extractXmlText(text(item, "NB_DOC_DATA"), 3);

            String drugNameResult = (itemName != null) ? itemName : queryName;
            log.info("약품 정보 조회 성공: {} (itemSeq={})", drugNameResult, itemSeq);
            return Optional.of(new DrugInfoDto(drugNameResult, effect, usage, caution, entpName, itemSeq));
        } catch (Exception e) {
            log.warn("허가정보 응답 파싱 실패: {}", e.getMessage());
            return Optional.empty();
        }
    }

    /**
     * 허가정보 DOC XML에서 구조화된 텍스트 추출.
     * ARTICLE title을 섹션 헤더로, PARAGRAPH 내용을 본문으로 추출.
     * 결과: "## 1. 경고\n내용\n내용\n\n## 2. 다음 환자에는..." 형식
     */
    /**
     * @param maxArticles 0이면 제한 없음, 양수면 해당 개수까지만 추출
     */
    private String extractXmlText(String xml, int maxArticles) {
        if (xml == null || xml.isBlank()) return null;

        StringBuilder sb = new StringBuilder();
        int articleCount = 0;

        Pattern articlePattern = Pattern.compile(
                "<ARTICLE\\s+title=\"([^\"]*)\"[^>]*/?>([\\s\\S]*?)(?=<ARTICLE|</SECTION|</DOC|$)");
        Matcher articleMatcher = articlePattern.matcher(xml);

        while (articleMatcher.find()) {
            if (maxArticles > 0 && articleCount >= maxArticles) break;

            String title = articleMatcher.group(1).strip();
            String body = articleMatcher.group(2);

            if (isDocHeader(title)) continue;
            articleCount++;

            // ARTICLE 제목 추가
            if (!title.isEmpty()) {
                if (sb.length() > 0) sb.append("\n\n");
                sb.append("## ").append(title);
            }

            // PARAGRAPH 내용 추출 (CDATA 포함)
            if (body != null) {
                Pattern paraPattern = Pattern.compile("<PARAGRAPH[^>]*>(.*?)</PARAGRAPH>", Pattern.DOTALL);
                Matcher paraMatcher = paraPattern.matcher(body);
                while (paraMatcher.find()) {
                    String content = paraMatcher.group(1);
                    // CDATA 제거
                    content = content.replaceAll("<!\\[CDATA\\[(.*?)]]>", "$1");
                    // HTML 태그 제거
                    content = content.replaceAll("<[^>]+>", "");
                    // HTML 엔티티 디코드
                    content = content.replace("&amp;", "&").replace("&lt;", "<")
                            .replace("&gt;", ">").replace("&nbsp;", " ");
                    content = content.strip();
                    if (!content.isEmpty()) {
                        sb.append("\n").append(content);
                    }
                }
            }
        }

        // ARTICLE이 없는 경우 PARAGRAPH만 추출
        if (sb.length() == 0) {
            Pattern paraOnly = Pattern.compile("<PARAGRAPH[^>]*>(.*?)</PARAGRAPH>", Pattern.DOTALL);
            Matcher paraOnlyMatcher = paraOnly.matcher(xml);
            while (paraOnlyMatcher.find()) {
                String content = paraOnlyMatcher.group(1)
                        .replaceAll("<!\\[CDATA\\[(.*?)]]>", "$1")
                        .replaceAll("<[^>]+>", "")
                        .replace("&amp;", "&").replace("&lt;", "<")
                        .replace("&gt;", ">").replace("&nbsp;", " ")
                        .strip();
                if (!content.isEmpty()) {
                    if (sb.length() > 0) sb.append("\n");
                    sb.append(content);
                }
            }
        }

        return sb.length() > 0 ? sb.toString() : null;
    }

    private boolean isDocHeader(String title) {
        return title.equals("효능효과") || title.equals("용법용량")
                || title.equals("사용상의주의사항") || title.equals("주의사항")
                || title.equals("사용상 주의사항");
    }

    private String text(JsonNode node, String field) {
        JsonNode f = node.get(field);
        if (f == null || f.isNull()) return null;
        String v = f.asText().strip();
        return v.isEmpty() ? null : v;
    }

    private String encode(String value) {
        try {
            return java.net.URLEncoder.encode(value, java.nio.charset.StandardCharsets.UTF_8);
        } catch (Exception e) {
            return value;
        }
    }
}
