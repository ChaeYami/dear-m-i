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
 *    - updateMessage: 안내 메시지 표시
 * 2. SecureStore에서 토큰 복원
 * 3. 인증 상태에 따라 AuthNavigator 또는 MainTabNavigator 분기
 */
export const RootNavigator: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [isForceUpdateBlocked, setIsForceUpdateBlocked] = useState(false);
  const { isAuthenticated, restoreTokens } = useAuthStore();

  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    try {
      // ① 앱 버전 체크 (서버에서 판단 — 앱에 버전 비교 로직 하드코딩 금지)
      await checkAppVersion();

      // ② SecureStore에서 토큰 복원
      await restoreTokens();
    } catch {
      // 버전 체크 실패 등 네트워크 오류는 무시하고 진행
      await restoreTokens();
    } finally {
      setIsLoading(false);
    }
  };

  const checkAppVersion = async () => {
    const platform = Platform.OS; // 'ios' | 'android'
    const currentVersion = Constants.expoConfig?.version ?? '1.0.0';

    const { data } = await axiosInstance.get<ApiResponse<AppVersionResponse>>(
      `/api/v1/app/version`,
      { params: { platform, currentVersion } }
    );

    if (!data.success || !data.data) return;

    const { forceUpdate, updateMessage, storeUrl } = data.data;

    if (forceUpdate) {
      // 강제 업데이트: 다이얼로그 표시 후 앱스토어 이동, 앱 진행 불가
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
              // 앱 스토어로 이동 후 다시 Alert (진행 불가)
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

      // 초기화 중단 (강제 업데이트 블록)
      throw new Error('force_update');
    }
  };

  // 초기 로딩 중
  if (isLoading) {
    return <LoadingSpinner fullscreen />;
  }

  // 강제 업데이트 차단 상태: 빈 화면 + 로딩 (Alert이 표시됨)
  if (isForceUpdateBlocked) {
    return <LoadingSpinner fullscreen />;
  }

  return (
    <NavigationContainer>
      {/* 오프라인 배너: 모든 화면 위에 표시 */}
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
