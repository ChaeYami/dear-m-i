import { create } from 'zustand';
import { subscriptionApi } from '@/features/subscription/api/subscriptionApi';
import type { SubscriptionPlan } from '@/shared/types/domain.types';

interface SubscriptionState {
  plan: SubscriptionPlan;
  expiresAt: string | undefined;
  isLoading: boolean;
  fetchSubscription: (onPlanChange?: (plan: SubscriptionPlan) => void) => Promise<void>;
  setPlan: (plan: SubscriptionPlan, expiresAt?: string) => void;
  /** 로그아웃/계정 전환 시 호출 — stale PREMIUM state 가 다음 사용자에게 누출되는 것 방지 */
  reset: () => void;
}

export const useSubscriptionStore = create<SubscriptionState>((set) => ({
  plan: 'FREE',
  expiresAt: undefined,
  isLoading: false,

  fetchSubscription: async (onPlanChange) => {
    set({ isLoading: true });
    try {
      const { data } = await subscriptionApi.getStatus();
      if (data.success && data.data) {
        const plan = data.data.plan;
        const expiresAt = data.data.expiresAt;
        set({ plan, expiresAt });
        onPlanChange?.(plan);
      }
    } catch {
      // 조회 실패 시 FREE 유지
    } finally {
      set({ isLoading: false });
    }
  },

  setPlan: (plan, expiresAt) => set({ plan, expiresAt }),

  reset: () => set({ plan: 'FREE', expiresAt: undefined, isLoading: false }),
}));
