package com.dearmi.backend.infrastructure.external.claude;

import java.util.List;

public record ClaudeResponse(List<ContentBlock> content) {
    public record ContentBlock(String type, String text) {}
}
