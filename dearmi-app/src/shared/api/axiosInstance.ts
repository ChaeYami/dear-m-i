import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import * as SecureStore from 'expo-secure-store';
import { SECURE_STORE_KEYS } from '@/constants/cacheKeys';
import type { TokenRefreshResponse, ApiResponse } from '@/shared/types/api.types';
import i18n from '@/locales/i18n';
import { useAuthStore } from '@/features/auth/store/authStore';
import { GuestModeError } from '@/shared/api/errors';

/** 게스트가 만져도 무해한 read-only 메서드 화이트리스트 */
const SAFE_METHODS = new Set(['get', 'head', 'options']);

/**
 * Axios 인스턴스 설정
 *
 * ⚠️ API 키 하드코딩 절대 금지
 * baseURL은 환경변수(EXPO_PUBLIC_API_URL)에서만 읽음
 */
const axiosInstance = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// =====================================================================
// 요청 인터셉터: SecureStore에서 accessToken 읽어 Authorization 헤더 주입
// =====================================================================
axiosInstance.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    // 게스트 모드면 쓰기 요청(POST/PUT/PATCH/DELETE) 차단 → GuestModeError.
    //   읽기 요청은 통과시키지만 실제로는 hook 레벨에서 mock 으로 가로채므로 도달 X.
    //   만약의 시나리오(직접 axios 호출)에서도 토큰 없이 401 받게 되므로 안전.
    const isGuest = useAuthStore.getState().isGuest;
    const method = (config.method ?? 'get').toLowerCase();
    if (isGuest && !SAFE_METHODS.has(method)) {
      throw new GuestModeError();
    }

    const token = await SecureStore.getItemAsync(SECURE_STORE_KEYS.ACCESS_TOKEN);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// =====================================================================
// 응답 인터셉터: 401 수신 시 토큰 갱신 → 원래 요청 재시도
// =====================================================================

/** 토큰 갱신 중복 요청 방지 플래그 */
let isRefreshing = false;

/** 갱신 대기 중인 요청 큐 */
let refreshQueue: Array<{
  resolve: (value: string) => void;
  reject: (reason: unknown) => void;
}> = [];

/** 갱신된 토큰으로 큐의 모든 요청 처리 */
const processRefreshQueue = (token: string | null, error: unknown = null) => {
  refreshQueue.forEach((promise) => {
    if (token) {
      promise.resolve(token);
    } else {
      promise.reject(error);
    }
  });
  refreshQueue = [];
};

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // 401이 아니거나 이미 재시도한 요청은 그냥 reject
    if (error.response?.status !== 401 || originalRequest._retry) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    // 이미 갱신 중이면 큐에 추가하여 갱신 완료 후 재시도
    if (isRefreshing) {
      return new Promise<string>((resolve, reject) => {
        refreshQueue.push({ resolve, reject });
      }).then((newAccessToken) => {
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return axiosInstance(originalRequest);
      });
    }

    isRefreshing = true;

    try {
      const refreshToken = await SecureStore.getItemAsync(SECURE_STORE_KEYS.REFRESH_TOKEN);

      if (!refreshToken) {
        throw new Error(i18n.t('auth:refresh_token_missing'));
      }

      // 토큰 갱신 요청 (/auth/refresh는 인터셉터 없는 순수 호출)
      const { data } = await axios.post<ApiResponse<TokenRefreshResponse>>(
        `${process.env.EXPO_PUBLIC_API_URL}/api/v1/auth/refresh`,
        { refreshToken }
      );

      if (!data.success || !data.data) {
        throw new Error(i18n.t('auth:refresh_token_failed'));
      }

      const { accessToken: newAccessToken, refreshToken: newRefreshToken } = data.data;

      // 새 토큰 저장
      await SecureStore.setItemAsync(SECURE_STORE_KEYS.ACCESS_TOKEN, newAccessToken);
      await SecureStore.setItemAsync(SECURE_STORE_KEYS.REFRESH_TOKEN, newRefreshToken);

      // 대기 중인 요청 처리
      processRefreshQueue(newAccessToken);

      // 원래 요청 재시도
      originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
      return axiosInstance(originalRequest);
    } catch (refreshError) {
      // 갱신 실패: 로그아웃 처리
      processRefreshQueue(null, refreshError);

      // SecureStore 토큰 삭제
      await SecureStore.deleteItemAsync(SECURE_STORE_KEYS.ACCESS_TOKEN);
      await SecureStore.deleteItemAsync(SECURE_STORE_KEYS.REFRESH_TOKEN);

      // Zustand store는 순환 의존성을 피하기 위해 이벤트 기반으로 처리
      // RootNavigator에서 isAuthenticated 상태를 구독하여 처리
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);

export default axiosInstance;
