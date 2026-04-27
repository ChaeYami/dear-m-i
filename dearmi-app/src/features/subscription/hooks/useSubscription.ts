import { useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';
import { customAlert } from '@/shared/components/CustomAlert';
import { useMutation } from '@tanstack/react-query';
import {
  initConnection,
  fetchProducts,
  requestPurchase,
  getAvailablePurchases,
  finishTransaction,
  purchaseUpdatedListener,
  purchaseErrorListener,
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

  // react-native-iap v15: requestPurchase 의 동기 리턴값이 불안정하므로
  // purchaseUpdatedListener 로 purchase 이벤트를 잡아 verify + finishTransaction 처리.
  // mount 시 1회 구독, unmount 시 해제.
  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    let initialized = false;
    (async () => {
      try {
        await initConnection();
        initialized = true;
      } catch {
        // already connected
      }
    })();

    const purchaseSub = purchaseUpdatedListener(async (purchase: Purchase) => {
      if (!mountedRef.current) return;
      try {
        await verifyAndSync(purchase);
      } catch (e) {
        console.warn('[IAP] verifyAndSync failed from listener', e);
      }
      try {
        await finishTransaction({ purchase, isConsumable: false });
      } catch (e) {
        console.warn('[IAP] finishTransaction failed', e);
      }
    });

    const errorSub = purchaseErrorListener((err) => {
      if (!mountedRef.current) return;
      if (err?.code !== ErrorCode.UserCancelled) {
        console.warn('[IAP] purchase error', err);
        customAlert(i18n.t('subscription:purchase_error'), i18n.t('subscription:purchase_error_message'));
      }
    });

    return () => {
      mountedRef.current = false;
      purchaseSub.remove();
      errorSub.remove();
      if (initialized) {
        // endConnection 호출은 라이브러리에 따라 다름 — 앱 전체 수명동안 연결 유지가 안전
      }
    };
  }, []);

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
      // App Store Connect / Play Console 에 product 가 등록 안 됐거나 metadata 누락 시
      // fetchProducts 가 빈 배열을 반환. 이 상태로 requestPurchase 호출하면 StoreKit 이
      // 모호한 에러를 던져서 원인 추적이 어려움 → 사전 검증으로 명확한 메시지 표시.
      const products = await fetchProducts({ skus: [productId], type: 'subs' });
      if (!products || products.length === 0) {
        customAlert(
          i18n.t('subscription:purchase_error'),
          i18n.t('subscription:product_unavailable'),
        );
        return;
      }
      // v15: 결과는 purchaseUpdatedListener 로 비동기 도착. 여기선 구매 요청만 트리거.
      await requestPurchase({
        request: Platform.OS === 'ios'
          ? { ios: { sku: productId } }
          : { android: { skus: [productId] } },
        type: 'subs',
      });
    } catch (err: any) {
      if (err?.code !== ErrorCode.UserCancelled) {
        customAlert(i18n.t('subscription:purchase_error'), i18n.t('subscription:purchase_error_message'));
      }
    } finally {
      // 실제 완료는 listener 에서 처리되지만 UI 상 로딩 잠그는 건 여기서 풀어줌
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
