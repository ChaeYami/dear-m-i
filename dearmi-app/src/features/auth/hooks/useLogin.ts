import { useState, useEffect } from 'react';
import { Platform } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { useAuthStore } from '@/features/auth/store/authStore';
import { authApi } from '@/features/auth/api';
import i18n from '@/locales/i18n';

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

  useEffect(() => {
    if (Platform.OS === 'android') {
      WebBrowser.warmUpAsync();
      return () => { WebBrowser.coolDownAsync(); };
    }
  }, []);

  const loginWithProvider = async (provider: 'google' | 'apple') => {
    setIsLoading(true);
    setError(null);

    try {
      const authUrl = `${process.env.EXPO_PUBLIC_API_URL}/oauth2/authorization/${provider}`;
      const redirectUri = 'dearmi://auth';

      let result: WebBrowser.WebBrowserAuthSessionResult;
      try {
        result = await WebBrowser.openAuthSessionAsync(authUrl, redirectUri);
      } catch {
        // Custom Tabs 실패 시 기본 브라우저로 fallback
        const urlPromise = new Promise<string>((resolve) => {
          const sub = Linking.addEventListener('url', ({ url }) => {
            sub.remove();
            resolve(url);
          });
        });
        await Linking.openURL(authUrl);
        const url = await urlPromise;
        result = { type: 'success', url };
      }

      if (result.type === 'cancel' || result.type === 'dismiss') {
        return;
      }

      if (result.type !== 'success') {
        throw new Error(i18n.t('auth:login_cancelled'));
      }

      const params = parseUrlParams(result.url);
      const accessToken = params['access_token'];
      const refreshToken = params['refresh_token'];

      if (!accessToken || !refreshToken) {
        throw new Error(i18n.t('auth:login_no_token'));
      }

      await setTokens(accessToken, refreshToken);

      const { data } = await authApi.getMe();
      if (data.success && data.data) {
        setUser(data.data);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : i18n.t('auth:login_error'));
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithDev = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const { data } = await authApi.devLogin('test@test.com', i18n.t('auth:dev_user_name'));

      if (!data.success || !data.data) {
        throw new Error(i18n.t('auth:dev_login_failed'));
      }

      await setTokens(data.data.accessToken, data.data.refreshToken);

      const meRes = await authApi.getMe();
      if (meRes.data.success && meRes.data.data) {
        setUser(meRes.data.data);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : i18n.t('auth:dev_login_error'));
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
