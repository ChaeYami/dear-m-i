import { useState, useEffect } from 'react';
import { Platform } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import * as SecureStore from 'expo-secure-store';
import { useAuthStore } from '@/features/auth/store/authStore';
import { authApi } from '@/features/auth/api';
import i18n from '@/locales/i18n';

const OAUTH_STATE_KEY = 'oauth_app_state';

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

/** OAuth flow binding 용 nonce 생성 (16바이트 hex). 추측 공격 표면 최소화 목적이며 강력한 CSPRNG 는 불필요. */
const generateOAuthState = (): string => {
  let s = '';
  for (let i = 0; i < 16; i++) {
    s += Math.floor(Math.random() * 256).toString(16).padStart(2, '0');
  }
  return `${Date.now().toString(36)}-${s}`;
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
      // OAuth flow binding nonce — 콜백 redirect 의 state 와 비교해
      // 외부 딥링크 강제 주입(Login CSRF) 차단.
      const appState = generateOAuthState();
      await SecureStore.setItemAsync(OAUTH_STATE_KEY, appState);

      const authUrl =
        `${process.env.EXPO_PUBLIC_API_URL}/oauth2/authorization/${provider}` +
        `?app_state=${encodeURIComponent(appState)}`;
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
        await SecureStore.deleteItemAsync(OAUTH_STATE_KEY);
        return;
      }

      if (result.type !== 'success') {
        await SecureStore.deleteItemAsync(OAUTH_STATE_KEY);
        throw new Error(i18n.t('auth:login_cancelled'));
      }

      const params = parseUrlParams(result.url);
      const accessToken = params['access_token'];
      const refreshToken = params['refresh_token'];
      const returnedState = params['state'];

      // 1회용 nonce — 즉시 삭제 후 비교 (재사용 방지)
      const expectedState = await SecureStore.getItemAsync(OAUTH_STATE_KEY);
      await SecureStore.deleteItemAsync(OAUTH_STATE_KEY);

      if (!expectedState || !returnedState || returnedState !== expectedState) {
        throw new Error(i18n.t('auth:login_error'));
      }

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
