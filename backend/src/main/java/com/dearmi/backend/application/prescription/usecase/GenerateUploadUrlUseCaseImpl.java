package com.dearmi.backend.application.prescription.usecase;

import com.dearmi.backend.application.prescription.dto.GenerateUploadUrlCommand;
import com.dearmi.backend.application.prescription.dto.GenerateUploadUrlResult;
import com.dearmi.backend.application.prescription.port.StoragePort;
import com.dearmi.backend.common.exception.CustomException;
import com.dearmi.backend.common.exception.ErrorCode;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.Set;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class GenerateUploadUrlUseCaseImpl implements GenerateUploadUrlUseCase {

    // 처방전 이미지 한정 화이트리스트 — HTML/SVG/실행파일 업로드 방지
    private static final Map<String, String> ALLOWED_EXT_TO_CONTENT_TYPE = Map.of(
            "jpg",  "image/jpeg",
            "jpeg", "image/jpeg",
            "png",  "image/png",
            "heic", "image/heic",
            "heif", "image/heif",
            "webp", "image/webp"
    );
    private static final Set<String> ALLOWED_CONTENT_TYPES =
            Set.copyOf(ALLOWED_EXT_TO_CONTENT_TYPE.values());

    private final StoragePort storagePort;

    @Override
    public GenerateUploadUrlResult generate(GenerateUploadUrlCommand command) {
        String ext = extractExtension(command.fileName());
        if (!ALLOWED_EXT_TO_CONTENT_TYPE.containsKey(ext)) {
            throw new CustomException(ErrorCode.INVALID_REQUEST);
        }

        String clientContentType = command.contentType() == null ? "" : command.contentType().toLowerCase();
        if (!ALLOWED_CONTENT_TYPES.contains(clientContentType)) {
            throw new CustomException(ErrorCode.INVALID_REQUEST);
        }

        // 확장자 기준으로 Content-Type 서버 강제 — 클라이언트가 image/jpeg 라고 보내도
        // 확장자가 .png 면 image/png 로 정정 (스푸핑 차단)
        String normalizedContentType = ALLOWED_EXT_TO_CONTENT_TYPE.get(ext);

        // prescriptions/{userId}/{randomUUID}/image.{ext}
        String s3Key = String.format("prescriptions/%s/%s/image.%s",
                command.userId(), UUID.randomUUID(), ext);

        String uploadUrl = storagePort.generatePutPresignedUrl(s3Key, normalizedContentType);
        return new GenerateUploadUrlResult(s3Key, uploadUrl);
    }

    private String extractExtension(String fileName) {
        if (fileName == null || !fileName.contains(".")) return "";
        return fileName.substring(fileName.lastIndexOf('.') + 1).toLowerCase();
    }
}
