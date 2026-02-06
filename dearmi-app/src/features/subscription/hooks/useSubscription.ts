import { useState } from 'react';
import { Platform } from 'react-native';
import { customAlert } from '@/shared/components/CustomAlert';
import { useMutation } from '@tanstack/react-query';
import {
  initConnection,
  fetchProducts,
  requestPurchase,
  getAvailablePurchases,
  finishTransaction,
  ErrorCode,
  type Purchase,
} from 'react-native-iap';
import { subscriptionApi } from '@/features/subscription/api/subscriptionApi';
import { useSubscriptionStore } from '@/features/subscription/store/subscriptionStore';
import { useAuthStore } from '@/features/auth/store/authStore';

export const PRODUCT_IDS = {
  monthly: 'com.dearmi.premium.monthly',
  yearly: 'com.dearmi.premium.yearly',
} as const;

const ensureIapConnection = async () => {
  try {
    await initConnection();
  } catch {
    // already connected
  }
};

export const useSubscription = () => {
  const { setPlan } = useSubscriptionStore();
  const setUser = useAuthStore((s) => s.setUser);
  const user = useAuthStore((s) => s.user);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);

  const syncPlanToUser = (plan: 'FREE' | 'PREMIUM', expiresAt?: string) => {
    setPlan(plan, expiresAt);
    if (user) setUser({ ...user, plan });
  };

  const verifyAndSync = async (purchase: Purchase) => {
    // iOS: transactionId as originalTransactionId, purchaseToken (JWS) as receiptData
    // Android: transactionId, purchaseToken as receiptData
    const originalTransactionId = purchase.transactionId ?? purchase.id;
    const receiptData = purchase.purchaseToken ?? purchase.transactionId ?? '';

    const verifyFn =
      Platform.OS === 'ios'
        ? subscriptionApi.verifyAppStore
        : subscriptionApi.verifyPlayStore;

    const { data } = await verifyFn({ originalTransactionId, receiptData });
    if (data.success && data.data) {
      syncPlanToUser(data.data.plan, data.data.expiresAt);
    }
  };

  const purchaseMonthly = async () => {
    await purchase(PRODUCT_IDS.monthly);
  };

  const purchaseYearly = async () => {
    await purchase(PRODUCT_IDS.yearly);
  };

  const purchase = async (productId: string) => {
    if (isPurchasing) return;
    setIsPurchasing(true);
    try {
      await ensureIapConnection();
      await fetchProducts({ skus: [productId] });
      const result = await requestPurchase({
        request: Platform.OS === 'ios'
          ? { ios: { sku: productId } }
          : { android: { skus: [productId] } },
        type: 'subs',
      });
      const purchases = Array.isArray(result) ? result : result ? [result] : [];
      for (const p of purchases) {
        if (p) {
          await verifyAndSync(p);
          await finishTransaction({ purchase: p, isConsumable: false });
        }
      }
    } catch (err: any) {
      if (err?.code !== ErrorCode.UserCancelled) {
        customAlert('결제 오류', '결제 처리 중 오류가 발생했습니다. 다시 시도해 주세요.');
      }
    } finally {
      setIsPurchasing(false);
    }
  };

  const restorePurchases = async () => {
    if (isRestoring) return;
    setIsRestoring(true);
    try {
      await ensureIapConnection();
      const history = await getAvailablePurchases();
      if (!history || history.length === 0) {
        customAlert('복원 완료', '복원할 구매 내역이 없습니다.');
        return;
      }
      const latest = history[history.length - 1];
      if (latest) {
        await verifyAndSync(latest);
        customAlert('복원 완료', '구독이 복원되었습니다.');
      }
    } catch {
      customAlert('복원 실패', '구매 내역을 복원할 수 없습니다. 잠시 후 다시 시도해 주세요.');
    } finally {
      setIsRestoring(false);
    }
  };

  const { mutate: cancelSubscription, isPending: isCancelling } = useMutation({
    mutationFn: () => subscriptionApi.cancel(),
    onSuccess: () => {
      syncPlanToUser('FREE', undefined);
      customAlert('구독 취소', '구독이 취소되었습니다.');
    },
    onError: () => {
      customAlert('오류', '구독 취소 중 오류가 발생했습니다.');
    },
  });

  return {
    purchaseMonthly,
    purchaseYearly,
    restorePurchases,
    cancelSubscription,
    isPurchasing,
    isRestoring,
    isCancelling,
  };
};
