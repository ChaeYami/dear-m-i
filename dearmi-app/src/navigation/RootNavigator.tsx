import React, { useEffect, useRef, useState } from 'react';
import { Image, Linking, Platform, StyleSheet, View } from 'react-native';
import { customAlert } from '@/shared/components/CustomAlert';
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
import { useAuthStore } from '@/features/auth/store/authStore';
import { useSubscriptionStore } from '@/features/subscription/store/subscriptionStore';
import { authApi } from '@/features/auth/api';
import axiosInstance from '@/shared/api/axiosInstance';
import { useTheme } from '@/shared/theme';
import { CacheService } from '@/shared/cache/CacheService';
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
};

const Stack = createStackNavigator<RootStackParamList>();

export const RootNavigator: React.FC = () => {
  const { colors, isDark } = useTheme();
  const [isLoading, setIsLoading] = useState(true);
  const [isForceUpdateBlocked, setIsForceUpdateBlocked] = useState(false);
  const [activeNotification, setActiveNotification] = useState<Notifications.Notification | null>(null);
  const { t } = useTranslation();
  const { isAuthenticated, restoreTokens, setUser, logout } = useAuthStore();
  const { fetchSubscription } = useSubscriptionStore();

  const notificationListener = useRef<Notifications.EventSubscription | null>(null);
  const responseListener = useRef<Notifications.EventSubscription | null>(null);

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
      const data = response.notification.request.content.data as Record<string, unknown>;
      navigateToScheduleDetail(data);
    });

    return () => {
      notificationListener.current?.remove();
      responseListener.current?.remove();
    };
  }, []);

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

  const navigateToScheduleDetail = (data: Record<string, unknown>) => {
    const scheduleId = data?.scheduleId;
    if (!scheduleId || !navigationRef.isReady()) return;

    (navigationRef.current as any)?.navigate('Main', {
      screen: 'Care',
      params: {
        screen: 'ScheduleDetail',
        params: { scheduleId: Number(scheduleId) },
      },
    });
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
      setIsForceUpdateBlocked(true);
      setIsLoading(false);

      customAlert(
        t('update_required'),
        updateMessage || t('update_message'),
        [
          {
            text: t('update'),
            onPress: () => {
              Linking.openURL(storeUrl);
              setTimeout(() => {
                customAlert(
                  t('update_required'),
                  updateMessage || t('update_message'),
                  [{ text: t('update'), onPress: () => Linking.openURL(storeUrl) }]
                );
              }, 1000);
            },
          },
        ]
      );

      throw new Error('force_update');
    }
  };

  if (isLoading || isForceUpdateBlocked) {
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
        </Stack.Navigator>

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
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
