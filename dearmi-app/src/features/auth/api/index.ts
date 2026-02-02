import axiosInstance from '@/shared/api/axiosInstance';
import type { ApiResponse } from '@/shared/types/api.types';
import type { User } from '@/shared/types/domain.types';

export const authApi = {
  /** 현재 로그인한 사용자 정보 조회 (토큰 유효성 검증에도 사용) */
  getMe: () => axiosInstance.get<ApiResponse<User>>('/api/v1/auth/me'),
};
