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
import i18n from '@/locales/i18n';

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
    // productId — 서버에서 구매 상품/기대 상품 일치 검증에 사용
    const productId = (purchase as any).productId ?? (purchase as any).sku ?? '';

    const verifyFn =
      Platform.OS === 'ios'
        ? subscriptionApi.verifyAppStore
        : subscriptionApi.verifyPlayStore;

    const { data } = await verifyFn({ productId, originalTransactionId, receiptData });
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
        customAlert(i18n.t('subscription:purchase_error'), i18n.t('subscription:purchase_error_message'));
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
        customAlert(i18n.t('subscription:restore_done'), i18n.t('subscription:restore_empty'));
        return;
      }
      const latest = history[history.length - 1];
      if (latest) {
        await verifyAndSync(latest);
        customAlert(i18n.t('subscription:restore_done'), i18n.t('subscription:restore_success'));
      }
    } catch {
      customAlert(i18n.t('subscription:restore_failed'), i18n.t('subscription:restore_failed_message'));
    } finally {
      setIsRestoring(false);
    }
  };

  const { mutate: cancelSubscription, isPending: isCancelling } = useMutation({
    mutationFn: () => subscriptionApi.cancel(),
    onSuccess: () => {
      syncPlanToUser('FREE', undefined);
      customAlert(i18n.t('subscription:cancel_title'), i18n.t('subscription:cancel_done'));
    },
    onError: () => {
      customAlert(i18n.t('common:error'), i18n.t('subscription:cancel_error'));
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
