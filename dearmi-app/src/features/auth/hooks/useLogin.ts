import { useState } from 'react';
import * as WebBrowser from 'expo-web-browser';
import { useAuthStore } from '@/features/auth/store/authStore';
import { authApi } from '@/features/auth/api';

/** 딥링크 쿼리 파라미터 파서 */
const parseUrlParams = (url: string): Record<string, string> => {
  const query = url.split('?')[1] ?? '';
  return Object.fromEntries(
    query
      .split('&')
      .filter(Boolean)
      .map((pair) => {
        const [key, ...rest] = pair.split('=');
        return [decodeURIComponent(key), decodeURIComponent(rest.join('='))];
      })
  );
};

export const useLogin = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { setTokens, setUser } = useAuthStore();

  const loginWithProvider = async (provider: 'google' | 'apple') => {
    setIsLoading(true);
    setError(null);

    try {
      const authUrl = `${process.env.EXPO_PUBLIC_API_URL}/oauth2/authorization/${provider}`;
      const redirectUri = 'dearmi://auth';

      const result = await WebBrowser.openAuthSessionAsync(authUrl, redirectUri);

      if (result.type === 'cancel' || result.type === 'dismiss') {
        return;
      }

      if (result.type !== 'success') {
        throw new Error('로그인이 취소되었습니다.');
      }

      const params = parseUrlParams(result.url);
      const accessToken = params['access_token'];
      const refreshToken = params['refresh_token'];

      if (!accessToken || !refreshToken) {
        throw new Error('서버로부터 토큰을 받지 못했습니다.');
      }

      await setTokens(accessToken, refreshToken);

      const { data } = await authApi.getMe();
      if (data.success && data.data) {
        setUser(data.data);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : '로그인 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithDev = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const { data } = await authApi.devLogin('test@test.com', '테스트유저');

      if (!data.success || !data.data) {
        throw new Error('Dev 로그인 실패');
      }

      await setTokens(data.data.accessToken, data.data.refreshToken);

      const meRes = await authApi.getMe();
      if (meRes.data.success && meRes.data.data) {
        setUser(meRes.data.data);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Dev 로그인 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  return {
    loginWithGoogle: () => loginWithProvider('google'),
    loginWithApple: () => loginWithProvider('apple'),
    loginWithDev,
    isLoading,
    error,
    clearError: () => setError(null),
  };
};
