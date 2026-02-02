package com.dearmi.backend.application.prescription.usecase;

import com.dearmi.backend.application.prescription.dto.GenerateUploadUrlCommand;
import com.dearmi.backend.application.prescription.dto.GenerateUploadUrlResult;
import com.dearmi.backend.application.prescription.port.StoragePort;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class GenerateUploadUrlUseCaseImpl implements GenerateUploadUrlUseCase {

    private final StoragePort storagePort;

    @Override
    public GenerateUploadUrlResult generate(GenerateUploadUrlCommand command) {
        String ext = extractExtension(command.fileName());
        // prescriptions/{userId}/{randomUUID}/image.{ext}
        String s3Key = String.format("prescriptions/%s/%s/image.%s",
                command.userId(), UUID.randomUUID(), ext);

        String uploadUrl = storagePort.generatePutPresignedUrl(s3Key, command.contentType());
        return new GenerateUploadUrlResult(s3Key, uploadUrl);
    }

    private String extractExtension(String fileName) {
        if (fileName == null || !fileName.contains(".")) return "jpg";
        return fileName.substring(fileName.lastIndexOf('.') + 1).toLowerCase();
    }
}
