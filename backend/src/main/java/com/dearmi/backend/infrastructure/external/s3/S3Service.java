package com.dearmi.backend.infrastructure.external.s3;

import com.dearmi.backend.application.prescription.port.StoragePort;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import software.amazon.awssdk.core.ResponseBytes;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.Delete;
import software.amazon.awssdk.services.s3.model.DeleteObjectRequest;
import software.amazon.awssdk.services.s3.model.DeleteObjectsRequest;
import software.amazon.awssdk.services.s3.model.GetObjectRequest;
import software.amazon.awssdk.services.s3.model.GetObjectResponse;
import software.amazon.awssdk.services.s3.model.ListObjectsV2Request;
import software.amazon.awssdk.services.s3.model.ListObjectsV2Response;
import software.amazon.awssdk.services.s3.model.ObjectIdentifier;
import software.amazon.awssdk.services.s3.model.S3Object;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;
import software.amazon.awssdk.services.s3.presigner.model.GetObjectPresignRequest;
import software.amazon.awssdk.services.s3.presigner.model.PutObjectPresignRequest;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;

import java.time.Duration;
import java.util.ArrayList;
import java.util.List;

@Component
@RequiredArgsConstructor
public class S3Service implements StoragePort {

    private final S3Client s3Client;
    private final S3Presigner s3Presigner;

    @Value("${aws.s3.bucket}")
    private String bucket;

    private static final Duration PRESIGNED_DURATION = Duration.ofMinutes(15);

    @Override
    public String generatePutPresignedUrl(String s3Key, String contentType) {
        PutObjectRequest objectRequest = PutObjectRequest.builder()
                .bucket(bucket)
                .key(s3Key)
                .contentType(contentType)
                .build();

        PutObjectPresignRequest presignRequest = PutObjectPresignRequest.builder()
                .signatureDuration(PRESIGNED_DURATION)
                .putObjectRequest(objectRequest)
                .build();

        return s3Presigner.presignPutObject(presignRequest).url().toString();
    }

    @Override
    public String generateGetPresignedUrl(String s3Key) {
        GetObjectRequest objectRequest = GetObjectRequest.builder()
                .bucket(bucket)
                .key(s3Key)
                .build();

        GetObjectPresignRequest presignRequest = GetObjectPresignRequest.builder()
                .signatureDuration(PRESIGNED_DURATION)
                .getObjectRequest(objectRequest)
                .build();

        return s3Presigner.presignGetObject(presignRequest).url().toString();
    }

    @Override
    public void deleteObject(String s3Key) {
        s3Client.deleteObject(DeleteObjectRequest.builder()
                .bucket(bucket)
                .key(s3Key)
                .build());
    }

    /**
     * 주어진 prefix 하위 모든 오브젝트 삭제 (탈퇴 유저 데이터 영구 삭제용).
     * S3 DeleteObjects 는 최대 1000개씩 → 페이지네이션 + 배치.
     */
    public int deleteAllByPrefix(String prefix) {
        int deletedTotal = 0;
        String continuationToken = null;
        do {
            ListObjectsV2Request.Builder listBuilder = ListObjectsV2Request.builder()
                    .bucket(bucket)
                    .prefix(prefix);
            if (continuationToken != null) listBuilder.continuationToken(continuationToken);

            ListObjectsV2Response listResponse = s3Client.listObjectsV2(listBuilder.build());
            List<S3Object> contents = listResponse.contents();
            if (contents.isEmpty()) break;

            List<ObjectIdentifier> ids = new ArrayList<>(contents.size());
            for (S3Object o : contents) ids.add(ObjectIdentifier.builder().key(o.key()).build());

            s3Client.deleteObjects(DeleteObjectsRequest.builder()
                    .bucket(bucket)
                    .delete(Delete.builder().objects(ids).quiet(true).build())
                    .build());
            deletedTotal += ids.size();

            continuationToken = Boolean.TRUE.equals(listResponse.isTruncated())
                    ? listResponse.nextContinuationToken() : null;
        } while (continuationToken != null);
        return deletedTotal;
    }

    /** ClaudeVisionClient 내부에서만 사용: S3 오브젝트 바이트 읽기 */
    public byte[] getObjectBytes(String s3Key) {
        GetObjectRequest request = GetObjectRequest.builder()
                .bucket(bucket)
                .key(s3Key)
                .build();
        ResponseBytes<GetObjectResponse> response = s3Client.getObjectAsBytes(request);
        return response.asByteArray();
    }

    /** 오브젝트의 Content-Type 반환 (미디어 타입 감지용) */
    public String getContentType(String s3Key) {
        GetObjectRequest request = GetObjectRequest.builder()
                .bucket(bucket)
                .key(s3Key)
                .build();
        ResponseBytes<GetObjectResponse> response = s3Client.getObjectAsBytes(request);
        String contentType = response.response().contentType();
        return (contentType != null && !contentType.isBlank()) ? contentType : "image/jpeg";
    }
}
