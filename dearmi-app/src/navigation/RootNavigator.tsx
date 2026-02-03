import React, { useEffect, useRef, useState } from 'react';
import { Alert, Linking, Platform } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';

import { navigationRef } from './navigationRef';
import { AuthNavigator } from './AuthNavigator';
import { MainTabNavigator } from './MainTabNavigator';
import { InAppNotificationBanner } from '@/shared/components/InAppNotificationBanner';
import { LoadingSpinner } from '@/shared/components/LoadingSpinner';
import { OfflineBanner } from '@/shared/components/OfflineBanner';
import { PaywallScreen } from '@/features/subscription/screens/PaywallScreen';
import { useAuthStore } from '@/features/auth/store/authStore';
import { authApi } from '@/features/auth/api';
import axiosInstance from '@/shared/api/axiosInstance';
import type { ApiResponse, AppVersionResponse } from '@/shared/types/api.types';

// 포그라운드 알림 표시 설정 — 네이티브 배너 대신 InAppNotificationBanner 사용
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: false,
    shouldShowBanner: false,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
  Paywall: undefined;
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
  const [activeNotification, setActiveNotification] = useState<Notifications.Notification | null>(null);
  const { isAuthenticated, restoreTokens, setUser, logout } = useAuthStore();

  const notificationListener = useRef<Notifications.EventSubscription | null>(null);
  const responseListener = useRef<Notifications.EventSubscription | null>(null);

  useEffect(() => {
    initializeApp();

    // 포그라운드: 인앱 배너 표시
    notificationListener.current = Notifications.addNotificationReceivedListener((notification) => {
      setActiveNotification(notification);
    });

    // 백그라운드/종료 상태에서 알림 탭: scheduleId 있으면 ScheduleDetail로 이동
    responseListener.current = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data as Record<string, unknown>;
      navigateToScheduleDetail(data);
    });

    return () => {
      notificationListener.current?.remove();
      responseListener.current?.remove();
    };
  }, []);

  /**
   * 알림 data에 scheduleId가 있으면 Schedule > ScheduleDetail로 딥링크
   * React Navigation 중첩 navigate 패턴 사용
   */
  const navigateToScheduleDetail = (data: Record<string, unknown>) => {
    const scheduleId = data?.scheduleId;
    if (!scheduleId || !navigationRef.isReady()) return;

    // Root → Main(탭) → Schedule(스택) → ScheduleDetail
    (navigationRef.current as any)?.navigate('Main', {
      screen: 'Schedule',
      params: {
        screen: 'ScheduleDetail',
        params: { scheduleId: Number(scheduleId) },
      },
    });
  };

  const initializeApp = async () => {
    try {
      await checkAppVersion();
      const hasToken = await restoreTokens();
      if (hasToken) {
        await validateTokenAndFetchUser();
      }
    } catch (e) {
      if ((e as Error).message === 'force_update') return;
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

  if (isLoading || isForceUpdateBlocked) {
    return <LoadingSpinner fullscreen />;
  }

  return (
    <NavigationContainer ref={navigationRef}>
      <OfflineBanner />
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {isAuthenticated ? (
          <Stack.Screen name="Main" component={MainTabNavigator} />
        ) : (
          <Stack.Screen name="Auth" component={AuthNavigator} />
        )}
        <Stack.Screen
          name="Paywall"
          component={PaywallScreen}
          options={{ presentation: 'modal' } as any}
        />
      </Stack.Navigator>

      {/* 포그라운드 인앱 알림 배너 */}
      {activeNotification && (
        <InAppNotificationBanner
          notification={activeNotification}
          onDismiss={() => setActiveNotification(null)}
          onPress={() => {
            const data = activeNotification.request.content.data as Record<string, unknown>;
            navigateToScheduleDetail(data);
            setActiveNotification(null);
          }}
        />
      )}
    </NavigationContainer>
  );
};
