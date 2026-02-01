/**
 * Infrastructure 레이어
 * - jpa/: Repository interface 구현체 (JPA, QueryDSL)
 * - external/: 외부 API 클라이언트 (AWS S3, 외부 서비스 등)
 * - config/: Spring Bean 설정, Security 설정
 * - batch/: Spring Batch Job, Step 정의
 * - scheduler/: 스케줄러 (@Scheduled)
 *
 * 규칙:
 * - 외부 API 클라이언트는 반드시 external/ 하위에만 위치
 * - Domain Repository interface를 구현
 * - Application Port interface를 구현
 */
package com.dearmi.backend.infrastructure;
