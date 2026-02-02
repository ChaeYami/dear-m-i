package com.dearmi.backend.common.converter;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

import java.util.List;

/**
 * List<String> tags ↔ JSON 문자열 변환
 * DB 컬럼: VARCHAR(500), 예: ["스트레스","불안"]
 */
@Converter
public class TagsJsonConverter implements AttributeConverter<List<String>, String> {

    private static final ObjectMapper MAPPER = new ObjectMapper();
    private static final TypeReference<List<String>> TYPE_REF = new TypeReference<>() {};

    @Override
    public String convertToDatabaseColumn(List<String> tags) {
        if (tags == null || tags.isEmpty()) return null;
        try {
            return MAPPER.writeValueAsString(tags);
        } catch (Exception e) {
            throw new IllegalStateException("tags 직렬화 실패", e);
        }
    }

    @Override
    public List<String> convertToEntityAttribute(String json) {
        if (json == null || json.isBlank()) return List.of();
        try {
            return MAPPER.readValue(json, TYPE_REF);
        } catch (Exception e) {
            throw new IllegalStateException("tags 역직렬화 실패", e);
        }
    }
}
