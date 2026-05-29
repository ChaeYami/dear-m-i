import axiosInstance from '@/shared/api/axiosInstance';
import type { ApiResponse } from '@/shared/types/api.types';
import type { User } from '@/shared/types/domain.types';

interface AuthTokenData {
  accessToken: string;
  refreshToken: string;
}

interface AppleNativeLoginPayload {
  identityToken: string;
  fullName?: string | null;
  email?: string | null;
}

export const authApi = {
  /** 현재 로그인한 사용자 정보 조회 (토큰 유효성 검증에도 사용) */
  getMe: () => axiosInstance.get<ApiResponse<User>>('/api/v1/auth/me'),

  /**
   * 선호 로케일 동기화 — 백엔드 약품 정보 region 라우팅(ko→KR / en→US) + 푸시 알림 다국어화의 단일 출처.
   * 로그인 직후 / 언어 변경 시 호출. 비로그인·네트워크 실패는 무시(다음 동기화에서 보정).
   */
  updateLocale: (locale: 'ko' | 'en') =>
    axiosInstance.patch<ApiResponse<void>>('/api/v1/auth/me/locale', { locale }),

  /**
   * Native Apple Sign-In — expo-apple-authentication 으로 받은 identityToken 을
   * 백엔드에서 Apple JWKS 검증 후 JWT 발급. iOS 26 ASWebAuthenticationSession dryRun 크래시 회피용.
   */
  appleNativeLogin: (payload: AppleNativeLoginPayload) =>
    axiosInstance.post<ApiResponse<AuthTokenData>>('/api/v1/auth/apple/native', payload),

  /** 로그아웃 — 서버에서 refresh_token + FCM 토큰 삭제 */
  logout: () => axiosInstance.post<ApiResponse<void>>('/api/v1/auth/logout'),

  /**
   * 회원 탈퇴 (원칙 ⑥) — 서버는 PII 익명화 + soft delete + refresh_tokens 즉시 삭제.
   * 30일 후 hard delete 배치가 모든 데이터 영구 삭제.
   */
  withdraw: () => axiosInstance.delete<ApiResponse<void>>('/api/v1/auth/me'),

  /** 로컬 개발 전용 — OAuth2 없이 테스트 유저로 JWT 발급 */
  devLogin: (email: string, name: string) =>
    axiosInstance.post<ApiResponse<AuthTokenData>>('/api/v1/dev/login', { email, name }),
};
