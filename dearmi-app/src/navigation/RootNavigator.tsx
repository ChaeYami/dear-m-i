import React, { useEffect, useRef, useState } from 'react';
import { Image, Platform, StyleSheet, View } from 'react-native';
import { ForceUpdateScreen } from '@/shared/components/ForceUpdateScreen';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { LinearGradient } from 'expo-linear-gradient';
import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';

import { useTranslation } from 'react-i18next';
import { navigationRef } from './navigationRef';
import { AuthNavigator } from './AuthNavigator';
import { MainTabNavigator } from './MainTabNavigator';
import { InAppNotificationBanner } from '@/shared/components/InAppNotificationBanner';
import { LoadingSpinner } from '@/shared/components/LoadingSpinner';
import { OfflineBanner } from '@/shared/components/OfflineBanner';
import { PaywallScreen } from '@/features/subscription/screens/PaywallScreen';
import { WebPaymentScreen } from '@/features/subscription/screens/WebPaymentScreen';
import { SearchScreen } from '@/features/search/screens/SearchScreen';
import { OnboardingScreen } from '@/features/onboarding/screens/OnboardingScreen';
import { NotificationHistoryScreen } from '@/features/notification/screens/NotificationHistoryScreen';
import { SideEffectLogScreen } from '@/features/sideeffect/screens/SideEffectLogScreen';
import { QuickLogScreen } from '@/features/quicklog/screens/QuickLogScreen';
import { medicationApi } from '@/features/medication/api/medicationApi';
import { useQueryClient } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/constants/cacheKeys';
import { useAuthStore } from '@/features/auth/store/authStore';
import { useSubscriptionStore } from '@/features/subscription/store/subscriptionStore';
import { authApi } from '@/features/auth/api';
import axiosInstance from '@/shared/api/axiosInstance';
import { useTheme } from '@/shared/theme';
import { CacheService } from '@/shared/cache/CacheService';
import { haptics } from '@/shared/utils/haptics';
import { customAlert } from '@/shared/components/CustomAlert';
import { CACHE_KEYS } from '@/constants/cacheKeys';
import type { ApiResponse, AppVersionResponse } from '@/shared/types/api.types';

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
  WebPayment: { planType: 'MONTHLY' | 'YEARLY' };
  Search: { scope?: 'RECORD' | 'CHECKIN' | 'PREPNOTE' } | undefined;
  Onboarding: { forceShow?: boolean } | undefined;
  NotificationHistory: undefined;
  SideEffectLog: undefined;
  QuickLog: undefined;
};

const Stack = createStackNavigator<RootStackParamList>();

export const RootNavigator: React.FC = () => {
  const { colors, isDark } = useTheme();
  const [isLoading, setIsLoading] = useState(true);
  const [forceUpdate, setForceUpdate] = useState<{ message?: string; storeUrl: string } | null>(null);
  const [activeNotification, setActiveNotification] = useState<Notifications.Notification | null>(null);
  const { t } = useTranslation();
  const { isAuthenticated, restoreTokens, setUser, logout } = useAuthStore();
  const { fetchSubscription } = useSubscriptionStore();
  const queryClient = useQueryClient();

  const notificationListener = useRef<Notifications.EventSubscription | null>(null);
  const responseListener = useRef<Notifications.EventSubscription | null>(null);

  // cold-start 진입 시 킬 상태에서 탭된 알림 — addNotificationResponseReceivedListener 는
  // 구독 시점 이전 응답을 받지 못하므로 hook 으로 별도 처리
  const lastResponse = Notifications.useLastNotificationResponse();
  const processedLastResponseRef = useRef(false);

  const navTheme = {
    ...(isDark ? DarkTheme : DefaultTheme),
    colors: {
      ...(isDark ? DarkTheme : DefaultTheme).colors,
      background: 'transparent',
      card: colors.surface,
      text: colors.text,
      border: colors.divider,
      primary: colors.primary,
    },
  };

  useEffect(() => {
    initializeApp();

    notificationListener.current = Notifications.addNotificationReceivedListener((notification) => {
      setActiveNotification(notification);
    });

    responseListener.current = Notifications.addNotificationResponseReceivedListener((response) => {
      handleNotificationResponse(response);
    });

    return () => {
      notificationListener.current?.remove();
      responseListener.current?.remove();
    };
  }, []);

  // 킬 상태에서 탭된 알림 — nav/auth ready 이후 1회만 처리
  useEffect(() => {
    if (!lastResponse || processedLastResponseRef.current) return;
    if (isLoading || !isAuthenticated || !navigationRef.isReady()) return;
    processedLastResponseRef.current = true;
    handleNotificationResponse(lastResponse);
  }, [lastResponse, isLoading, isAuthenticated]);

  // 첫 진입 시 온보딩 자동 표시 (인증 + 로딩 완료 후 1회)
  const onboardingShownRef = useRef(false);
  useEffect(() => {
    if (isLoading || !isAuthenticated || onboardingShownRef.current) return;
    const completed = CacheService.get<boolean>(CACHE_KEYS.ONBOARDING_COMPLETED);
    if (completed) return;
    onboardingShownRef.current = true;
    // NavigationContainer 가 아직 리렌더 직후 ready 가 안 됐을 수 있어 다음 틱에 navigate
    setTimeout(() => {
      if (navigationRef.isReady()) {
        (navigationRef.current as any)?.navigate('Onboarding');
      }
    }, 0);
  }, [isLoading, isAuthenticated]);

  /** 인바운드 알림 응답 라우팅: 액션 버튼 or 본체 탭. */
  const handleNotificationResponse = (response: Notifications.NotificationResponse) => {
    const data = response.notification.request.content.data as Record<string, unknown>;
    const actionId = response.actionIdentifier;

    // 복약 알림 액션 버튼 (TAKEN/SKIPPED) — 앱이 열리면 API 호출 + 복약 관리 탭으로 이동해 즉시 반영 확인
    if (actionId === 'TAKEN' || actionId === 'SKIPPED') {
      handleMedicationAction(data, actionId);
      return;
    }

    // 본체 탭 — 타입별 딥링크
    navigateFromNotification(data);
  };

  /**
   * 알림 탭(default) 시 타입별로 해당 화면으로 라우트.
   * MEDICATION → Medication 탭 (오늘 목록에서 바로 체크 가능)
   * DAY_BEFORE/DAY_OF → Care > ScheduleDetail
   * CHECKIN → Checkin 탭
   */
  const navigateFromNotification = (data: Record<string, unknown>) => {
    if (!navigationRef.isReady()) return;
    const type = data?.type;
    const nav = navigationRef.current as any;

    if (type === 'MEDICATION') {
      nav?.navigate('Main', { screen: 'Medication' });
      return;
    }
    if (type === 'CHECKIN') {
      nav?.navigate('Main', { screen: 'Checkin' });
      return;
    }
    // DAY_BEFORE / DAY_OF / 기타 — hospital_schedule id 로 간주
    const scheduleId = data?.scheduleId;
    if (!scheduleId) return;
    nav?.navigate('Main', {
      screen: 'Care',
      params: {
        screen: 'ScheduleDetail',
        params: { scheduleId: Number(scheduleId) },
      },
    });
  };

  /**
   * 복약 알림 액션 버튼(TAKEN/SKIPPED) 처리.
   * 카테고리는 opensAppToForeground=true — JS 가 킬 상태여도 확실히 깨어 이 핸들러 실행을 보장.
   * API 호출 후 캐시를 무효화하고 복약 관리 탭으로 이동해 반영된 상태를 즉시 확인할 수 있게 한다.
   * API 실패는 조용히 무시 — 사용자는 다음번 복약 탭 진입 시 상태가 동기화된다.
   */
  const handleMedicationAction = async (
    data: Record<string, unknown>,
    status: 'TAKEN' | 'SKIPPED',
  ) => {
    const type = data?.type as string | undefined;
    const timeSlot = data?.timeSlot as 'MORNING' | 'AFTERNOON' | 'EVENING' | 'BEDTIME' | undefined;
    const logDate = typeof data?.logDate === 'string' ? data.logDate : undefined;

    if (!timeSlot || !logDate) return;

    try {
      if (type === 'MEDICATION_GROUP') {
        // 그룹 알림: 그룹 내 모든 약 일괄 체크
        const groupId = typeof data?.groupId === 'string' ? data.groupId : undefined;
        if (!groupId) return;
        await medicationApi.bulkCheckGroup(groupId, timeSlot, logDate, status);
      } else {
        // 개별 알림: 단일 스케줄 체크
        const scheduleId = typeof data?.scheduleId === 'string' ? data.scheduleId : undefined;
        if (!scheduleId) return;
        await medicationApi.check(scheduleId, { logDate, timeSlot, status });
      }
      queryClient.invalidateQueries({ queryKey: ['todayMedication'] });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.medicationLogs() });
      haptics.success();
    } catch (e) {
      console.warn('[medication action] check API failed', e);
      haptics.error();
      if (navigationRef.isReady()) {
        customAlert(t('common:save_failed'), t('common:try_again_later'));
      }
    }

    if (navigationRef.isReady()) {
      (navigationRef.current as any)?.navigate('Main', { screen: 'Medication' });
    }
  };

  const initializeApp = async () => {
    try {
      await checkAppVersion();
    } catch (e) {
      if ((e as Error).message === 'force_update') return;
    }
    try {
      const hasToken = await restoreTokens();
      if (hasToken) {
        await validateTokenAndFetchUser();
      }
    } catch {
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
        fetchSubscription((plan) => {
          if (data.data && data.data.plan !== plan) {
            setUser({ ...data.data, plan });
          }
        });
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
      // ForceUpdateScreen 으로 NavigationContainer 마운트 자체를 차단 →
      // 어떤 인터랙션으로도 우회 불가 (원칙 ③).
      setForceUpdate({ message: updateMessage, storeUrl });
      setIsLoading(false);
      throw new Error('force_update');
    }
  };

  if (forceUpdate) {
    return <ForceUpdateScreen message={forceUpdate.message} storeUrl={forceUpdate.storeUrl} />;
  }

  if (isLoading) {
    return <LoadingSpinner fullscreen />;
  }

  const gradientColors: [string, string, string] = isDark
    ? [colors.background, colors.surface, colors.background]
    : ['#FAF8F5', '#EEE8F8', '#F0F4F0'];

  return (
    <View style={styles.root}>
      <LinearGradient
        colors={gradientColors}
        locations={[0, 0.5, 1]}
        style={StyleSheet.absoluteFill}
      />
      <Image
        source={require('../../assets/paper-texture.png')}
        resizeMode="repeat"
        style={[StyleSheet.absoluteFill, { opacity: isDark ? 0.04 : 0.06 }]}
      />

      <NavigationContainer ref={navigationRef} theme={navTheme}>
        <OfflineBanner />
        <Stack.Navigator
          screenOptions={{
            headerShown: false,
            cardStyle: { backgroundColor: 'transparent' },
          }}
        >
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
          <Stack.Screen
            name="WebPayment"
            component={WebPaymentScreen}
            options={{ presentation: 'modal' } as any}
          />
          <Stack.Screen
            name="Search"
            component={SearchScreen}
            options={{ presentation: 'modal' } as any}
          />
          <Stack.Screen
            name="Onboarding"
            component={OnboardingScreen}
            options={{ presentation: 'modal', gestureEnabled: false } as any}
          />
          <Stack.Screen
            name="NotificationHistory"
            component={NotificationHistoryScreen}
            options={{ presentation: 'modal' } as any}
          />
          <Stack.Screen
            name="SideEffectLog"
            component={SideEffectLogScreen}
            options={{ presentation: 'modal' } as any}
          />
          <Stack.Screen
            name="QuickLog"
            component={QuickLogScreen}
            options={{ presentation: 'modal' } as any}
          />
        </Stack.Navigator>

        {activeNotification && (
          <InAppNotificationBanner
            notification={activeNotification}
            onDismiss={() => setActiveNotification(null)}
            onPress={() => {
              const data = activeNotification.request.content.data as Record<string, unknown>;
              navigateFromNotification(data);
              setActiveNotification(null);
            }}
          />
        )}
      </NavigationContainer>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
