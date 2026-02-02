import React, { useEffect, useState } from 'react';
import { Alert, Linking, Platform } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import Constants from 'expo-constants';

import { AuthNavigator } from './AuthNavigator';
import { MainTabNavigator } from './MainTabNavigator';
import { LoadingSpinner } from '@/shared/components/LoadingSpinner';
import { OfflineBanner } from '@/shared/components/OfflineBanner';
import { useAuthStore } from '@/features/auth/store/authStore';
import { authApi } from '@/features/auth/api';
import axiosInstance from '@/shared/api/axiosInstance';
import type { ApiResponse, AppVersionResponse } from '@/shared/types/api.types';

export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
};

const Stack = createStackNavigator<RootStackParamList>();

/**
 * 루트 네비게이터
 *
 * 앱 시작 순서:
 * 1. GET /api/v1/app/version 호출 (버전 체크)
 *    - forceUpdate: true → 업데이트 다이얼로그 후 앱스토어 이동 (앱 진행 불가)
 * 2. SecureStore에서 토큰 복원
 * 3. 토큰이 있으면 GET /api/v1/auth/me로 유효성 확인
 *    - 유효: 사용자 정보 설정 → MainTabNavigator
 *    - 무효(401 후 refresh 실패): 토큰 삭제 → LoginScreen
 * 4. 토큰 없으면 LoginScreen
 */
export const RootNavigator: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [isForceUpdateBlocked, setIsForceUpdateBlocked] = useState(false);
  const { isAuthenticated, restoreTokens, setUser, logout } = useAuthStore();

  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    try {
      // ① 앱 버전 체크 (서버에서 판단 — 앱에 버전 비교 로직 하드코딩 금지)
      await checkAppVersion();

      // ② SecureStore에서 토큰 복원
      const hasToken = await restoreTokens();

      // ③ 토큰이 있으면 서버에서 유효성 검증
      if (hasToken) {
        await validateTokenAndFetchUser();
      }
    } catch (e) {
      if ((e as Error).message === 'force_update') return;
      // 버전 체크 등 네트워크 오류 시 토큰만 복원하고 진행
      await restoreTokens();
    } finally {
      setIsLoading(false);
    }
  };

  const validateTokenAndFetchUser = async () => {
    try {
      const { data } = await authApi.getMe();
      if (data.success && data.data) {
        setUser(data.data);
      }
    } catch {
      // 토큰 갱신도 실패(axiosInstance 인터셉터가 이미 시도)한 경우 로그아웃
      await logout();
    }
  };

  const checkAppVersion = async () => {
    const platform = Platform.OS;
    const currentVersion = Constants.expoConfig?.version ?? '1.0.0';

    const { data } = await axiosInstance.get<ApiResponse<AppVersionResponse>>(
      `/api/v1/app/version`,
      { params: { platform, currentVersion } }
    );

    if (!data.success || !data.data) return;

    const { forceUpdate, updateMessage, storeUrl } = data.data;

    if (forceUpdate) {
      setIsForceUpdateBlocked(true);
      setIsLoading(false);

      Alert.alert(
        '업데이트 필요',
        updateMessage || '최신 버전으로 업데이트해 주세요.',
        [
          {
            text: '업데이트',
            onPress: () => {
              Linking.openURL(storeUrl);
              setTimeout(() => {
                Alert.alert(
                  '업데이트 필요',
                  updateMessage || '최신 버전으로 업데이트해 주세요.',
                  [{ text: '업데이트', onPress: () => Linking.openURL(storeUrl) }],
                  { cancelable: false }
                );
              }, 1000);
            },
          },
        ],
        { cancelable: false }
      );

      throw new Error('force_update');
    }
  };

  if (isLoading) {
    return <LoadingSpinner fullscreen />;
  }

  if (isForceUpdateBlocked) {
    return <LoadingSpinner fullscreen />;
  }

  return (
    <NavigationContainer>
      <OfflineBanner />
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {isAuthenticated ? (
          <Stack.Screen name="Main" component={MainTabNavigator} />
        ) : (
          <Stack.Screen name="Auth" component={AuthNavigator} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};
