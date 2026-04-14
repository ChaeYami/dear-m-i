import React, { useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Platform,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as WebBrowser from 'expo-web-browser';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { customAlert } from '@/shared/components/CustomAlert';
import { useTheme, sizes, fontFamily } from '@/shared/theme';
import { GlassView } from '@/shared/components/GlassView';
import {
  subscriptionApi,
  type WebPlanType,
} from '@/features/subscription/api/subscriptionApi';
import { useSubscriptionStore } from '@/features/subscription/store/subscriptionStore';
import { useAuthStore } from '@/features/auth/store/authStore';
import type { RootStackParamList } from '@/navigation/RootNavigator';

type WebPaymentRouteProp = RouteProp<RootStackParamList, 'WebPayment'>;

/**
 * Android 전용 토스페이먼츠 웹 결제 화면
 *
 * 흐름:
 * 1. POST /payments/prepare → orderId, amount, customerName, customerEmail
 * 2. expo-web-browser로 토스 결제 페이지 열기
 * 3. 결제 완료 → 딥링크(dearmi://payment/success?orderId=...&paymentKey=...&amount=...)
 * 4. 성공 딥링크 수신 → POST /payments/confirm
 * 5. subscriptionStore 갱신 → PaywallScreen 닫기
 */
export const WebPaymentScreen: React.FC = () => {
  const { colors } = useTheme();
  const { t } = useTranslation(['subscription', 'common']);
  const navigation = useNavigation();
  const route = useRoute<WebPaymentRouteProp>();
  const planType = route.params?.planType ?? 'MONTHLY';

  const [status, setStatus] = useState<'preparing' | 'waiting' | 'confirming' | 'error'>('preparing');
  const [errorMessage, setErrorMessage] = useState('');
  const { setPlan } = useSubscriptionStore();
  const setUser = useAuthStore((s) => s.setUser);
  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    if (Platform.OS !== 'android') {
      customAlert(t('common:error'), t('subscription:web_android_only'));
      navigation.goBack();
      return;
    }

    startPaymentFlow(planType);
  }, []);

  const startPaymentFlow = async (plan: WebPlanType) => {
    try {
      // 1. 결제 준비
      setStatus('preparing');
      const { data } = await subscriptionApi.preparePayment(plan);
      if (!data.success || !data.data) {
        throw new Error(data.message ?? t('subscription:web_prepare_failed'));
      }

      const { orderId, amount, customerName, customerEmail } = data.data;

      // 2. 토스페이먼츠 결제 페이지 URL 구성
      const clientKey = process.env.EXPO_PUBLIC_TOSS_CLIENT_KEY;
      if (!clientKey) {
        throw new Error(t('subscription:web_config_error'));
      }

      const successUrl = 'dearmi://payment/success';
      const failUrl = 'dearmi://payment/fail';
      const orderName = plan === 'MONTHLY' ? t('subscription:web_order_monthly') : t('subscription:web_order_yearly');

      const checkoutUrl =
        `https://api.tosspayments.com/v1/payments/widget?` +
        `clientKey=${encodeURIComponent(clientKey)}` +
        `&orderId=${encodeURIComponent(orderId)}` +
        `&amount=${amount}` +
        `&orderName=${encodeURIComponent(orderName)}` +
        `&customerName=${encodeURIComponent(customerName)}` +
        `&customerEmail=${encodeURIComponent(customerEmail)}` +
        `&successUrl=${encodeURIComponent(successUrl)}` +
        `&failUrl=${encodeURIComponent(failUrl)}`;

      // 3. 브라우저 열기 + 딥링크 대기
      setStatus('waiting');
      const result = await WebBrowser.openAuthSessionAsync(checkoutUrl, 'dearmi');

      if (result.type === 'success' && result.url) {
        await handleDeepLink(result.url);
      } else {
        // 사용자가 브라우저를 닫음
        navigation.goBack();
      }
    } catch (err: any) {
      setStatus('error');
      setErrorMessage(err?.message ?? t('subscription:web_payment_error'));
    }
  };

  const parseDeepLink = (url: string) => {
    // dearmi://payment/success?orderId=...&paymentKey=...&amount=...
    const [base, query] = url.split('?');
    const path = base.replace('dearmi://', '');
    const params: Record<string, string> = {};
    if (query) {
      for (const pair of query.split('&')) {
        const [key, value] = pair.split('=');
        if (key && value) params[key] = decodeURIComponent(value);
      }
    }
    return { path, params };
  };

  const handleDeepLink = async (url: string) => {
    const { path, params } = parseDeepLink(url);

    if (path === 'payment/success') {
      const orderId = params.orderId;
      const paymentKey = params.paymentKey;
      const amount = Number(params.amount);

      if (!orderId || !paymentKey || !amount) {
        setStatus('error');
        setErrorMessage(t('subscription:web_invalid_info'));
        return;
      }

      // 4. 결제 승인
      setStatus('confirming');
      try {
        const { data } = await subscriptionApi.confirmPayment({
          orderId,
          paymentKey,
          amount,
        });

        if (data.success && data.data) {
          // 5. 구독 상태 갱신
          setPlan('PREMIUM', data.data.expiresAt);
          if (user) {
            setUser({ ...user, plan: 'PREMIUM' });
          }

          customAlert(t('subscription:web_complete'), t('subscription:web_activated'), [
            {
              text: t('common:confirm'),
              onPress: () => {
                // Paywall + WebPayment 모두 닫기
                navigation.getParent()?.goBack() ?? navigation.goBack();
              },
            },
          ]);
        } else {
          throw new Error(data.message ?? t('subscription:web_confirm_failed'));
        }
      } catch (err: any) {
        setStatus('error');
        setErrorMessage(err?.message ?? t('subscription:web_confirm_error'));
      }
    } else {
      // payment/fail
      setStatus('error');
      setErrorMessage(t('subscription:web_failed'));
    }
  };

  const statusText = {
    preparing: t('subscription:web_preparing'),
    waiting: t('subscription:web_waiting'),
    confirming: t('subscription:web_confirming'),
    error: errorMessage,
  };

  const styles = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    gradientBg: { ...StyleSheet.absoluteFillObject },
    center: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: sizes.spacing.xl,
      gap: sizes.spacing.lg,
    },
    glassCard: {
      paddingVertical: sizes.spacing.xxl,
      paddingHorizontal: sizes.spacing.xl,
      alignItems: 'center',
      gap: sizes.spacing.lg,
      borderWidth: 1,
      borderColor: colors.glassBorder,
      minWidth: 240,
    },
    statusText: {
      fontSize: sizes.font.md,
      color: colors.textSub,
      textAlign: 'center',
      lineHeight: 22,
    },
    errorIcon: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: colors.errorLight,
      color: colors.error,
      fontSize: sizes.font.xxl,
      fontFamily: fontFamily.bold,
      textAlign: 'center',
      lineHeight: 48,
      overflow: 'hidden',
    },
    errorText: {
      fontSize: sizes.font.md,
      color: colors.error,
      textAlign: 'center',
      lineHeight: 22,
    },
    retryBtn: {
      height: sizes.buttonHeight.md,
      paddingHorizontal: sizes.spacing.xl,
      backgroundColor: colors.primary,
      borderRadius: sizes.radius.lg,
      alignItems: 'center',
      justifyContent: 'center',
    },
    retryBtnText: {
      fontSize: sizes.font.md,
      fontFamily: fontFamily.bold,
      color: colors.textInverse,
    },
    closeBtn: {
      height: 40,
      alignItems: 'center',
      justifyContent: 'center',
    },
    closeBtnText: {
      fontSize: sizes.font.sm,
      color: colors.textSub,
    },
  }), [colors]);

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={[colors.primaryMuted, colors.background]}
        style={styles.gradientBg}
        pointerEvents="none"
      />
      <View style={styles.center}>
        <GlassView intensity="regular" borderRadius={sizes.radius.xxl} style={styles.glassCard}>
          {status !== 'error' ? (
            <>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={styles.statusText}>{statusText[status]}</Text>
            </>
          ) : (
            <>
              <Text style={styles.errorIcon}>!</Text>
              <Text style={styles.errorText}>{errorMessage}</Text>
              <TouchableOpacity
                style={styles.retryBtn}
                onPress={() => startPaymentFlow(planType)}
                activeOpacity={0.85}
              >
                <Text style={styles.retryBtnText}>{t('common:retry')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.closeBtn}
                onPress={() => navigation.goBack()}
                activeOpacity={0.7}
              >
                <Text style={styles.closeBtnText}>{t('common:close')}</Text>
              </TouchableOpacity>
            </>
          )}
        </GlassView>
      </View>
    </SafeAreaView>
  );
};
