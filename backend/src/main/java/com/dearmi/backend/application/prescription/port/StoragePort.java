package com.dearmi.backend.application.prescription.port;

public interface StoragePort {

    /** 처방전 이미지 업로드용 PUT Presigned URL 생성 (15분 유효) */
    String generatePutPresignedUrl(String s3Key, String contentType);

    /** 처방전 이미지 조회용 GET Presigned URL 생성 (15분 유효) */
    String generateGetPresignedUrl(String s3Key);

    /** S3 오브젝트 삭제 (처방전 삭제 시 ⑤ 원칙) */
    void deleteObject(String s3Key);
}
