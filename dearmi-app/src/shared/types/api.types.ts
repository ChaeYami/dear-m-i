/**
 * API 통신 관련 공통 타입 정의
 * - 백엔드 ApiResponse<T> 래퍼와 대응
 */

/** 백엔드 공통 응답 형식 */
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  errorCode?: string;
  message?: string;
}

/** 페이지네이션 응답 */
export interface PagedResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  hasNext: boolean;
}

/** 앱 버전 체크 응답 */
export interface AppVersionResponse {
  /** 강제 업데이트 여부 */
  forceUpdate: boolean;
  /** 최신 버전 */
  latestVersion: string;
  /** 업데이트 안내 메시지 (다국어 지원) */
  updateMessage: string;
  /** 앱스토어 URL */
  storeUrl: string;
}

/** 토큰 갱신 응답 */
export interface TokenRefreshResponse {
  accessToken: string;
  refreshToken: string;
}

/** S3 Presigned URL 응답 */
export interface PresignedUrlResponse {
  s3Key: string;
  uploadUrl: string;
}

/** 타임라인 커서 페이지 응답 */
export interface TimelineResponse {
  items: import('./domain.types').TimelineItem[];
  nextCursor?: string;
  hasNext: boolean;
}
