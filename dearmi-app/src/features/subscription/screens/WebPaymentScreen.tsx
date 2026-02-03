import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  Alert,
  Platform,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import { colors, sizes } from '@/constants';
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
      Alert.alert('오류', '웹 결제는 Android에서만 사용할 수 있습니다.');
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
        throw new Error(data.message ?? '결제 준비에 실패했습니다.');
      }

      const { orderId, amount, customerName, customerEmail } = data.data;

      // 2. 토스페이먼츠 결제 페이지 URL 구성
      const clientKey = process.env.EXPO_PUBLIC_TOSS_CLIENT_KEY;
      if (!clientKey) {
        throw new Error('결제 설정이 올바르지 않습니다.');
      }

      const successUrl = 'dearmi://payment/success';
      const failUrl = 'dearmi://payment/fail';
      const orderName = plan === 'MONTHLY' ? 'DearMI 프리미엄 월간' : 'DearMI 프리미엄 연간';

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
      setErrorMessage(err?.message ?? '결제 처리 중 오류가 발생했습니다.');
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
        setErrorMessage('결제 정보가 올바르지 않습니다.');
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

          Alert.alert('결제 완료', '프리미엄 구독이 활성화되었습니다.', [
            {
              text: '확인',
              onPress: () => {
                // Paywall + WebPayment 모두 닫기
                navigation.getParent()?.goBack() ?? navigation.goBack();
              },
            },
          ]);
        } else {
          throw new Error(data.message ?? '결제 승인에 실패했습니다.');
        }
      } catch (err: any) {
        setStatus('error');
        setErrorMessage(err?.message ?? '결제 승인 중 오류가 발생했습니다.');
      }
    } else {
      // payment/fail
      setStatus('error');
      setErrorMessage('결제가 실패했습니다. 다시 시도해 주세요.');
    }
  };

  const statusText = {
    preparing: '결제를 준비하고 있습니다...',
    waiting: '결제 페이지에서 결제를 완료해 주세요',
    confirming: '결제를 확인하고 있습니다...',
    error: errorMessage,
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.center}>
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
              <Text style={styles.retryBtnText}>다시 시도</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.closeBtn}
              onPress={() => navigation.goBack()}
              activeOpacity={0.7}
            >
              <Text style={styles.closeBtnText}>닫기</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: sizes.spacing.xl,
    gap: sizes.spacing.lg,
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
    fontWeight: sizes.fontWeight.bold,
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
    fontWeight: sizes.fontWeight.bold,
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
});
