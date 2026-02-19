import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { SECURE_STORE_KEYS } from '@/constants/cacheKeys';
import { queryClient } from '@/shared/api/queryClient';
import { useSubscriptionStore } from '@/features/subscription/store/subscriptionStore';
import type { User } from '@/shared/types/domain.types';

/** 인증 상태 */
interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  user: User | null;
  isAuthenticated: boolean;
}

/** 인증 액션 */
interface AuthActions {
  /**
   * 토큰 저장 (메모리 + SecureStore)
   * accessToken, refreshToken을 모두 안전하게 저장
   */
  setTokens: (accessToken: string, refreshToken: string) => Promise<void>;

  /** 사용자 정보 설정 */
  setUser: (user: User) => void;

  /**
   * 로그아웃
   * - 메모리 상태 초기화
   * - SecureStore에서 토큰 삭제
   */
  logout: () => Promise<void>;

  /**
   * 앱 시작 시 SecureStore에서 토큰 복원
   * RootNavigator에서 호출
   */
  restoreTokens: () => Promise<boolean>;
}

type AuthStore = AuthState & AuthActions;

export const useAuthStore = create<AuthStore>((set) => ({
  // 초기 상태
  accessToken: null,
  refreshToken: null,
  user: null,
  isAuthenticated: false,

  // 토큰 저장 (SecureStore에도 영속화)
  setTokens: async (accessToken, refreshToken) => {
    await SecureStore.setItemAsync(SECURE_STORE_KEYS.ACCESS_TOKEN, accessToken);
    await SecureStore.setItemAsync(SECURE_STORE_KEYS.REFRESH_TOKEN, refreshToken);
    set({ accessToken, refreshToken, isAuthenticated: true });
  },

  // 사용자 정보 설정
  setUser: (user) => {
    set({ user });
  },

  // 로그아웃: 메모리 + SecureStore + 다른 사용자 state(구독/쿼리 캐시) 까지 모두 정리
  //   subscriptionStore 를 reset 안 하면 이전 사용자의 PREMIUM 이 다음 사용자에게 그대로 보인다
  //   React Query 캐시도 클리어 — 이전 사용자의 기록/알림/복약 등 재사용 방지
  logout: async () => {
    await SecureStore.deleteItemAsync(SECURE_STORE_KEYS.ACCESS_TOKEN);
    await SecureStore.deleteItemAsync(SECURE_STORE_KEYS.REFRESH_TOKEN);
    set({ accessToken: null, refreshToken: null, user: null, isAuthenticated: false });
    useSubscriptionStore.getState().reset();
    queryClient.clear();
  },

  // 앱 시작 시 저장된 토큰 복원
  restoreTokens: async () => {
    const accessToken = await SecureStore.getItemAsync(SECURE_STORE_KEYS.ACCESS_TOKEN);
    const refreshToken = await SecureStore.getItemAsync(SECURE_STORE_KEYS.REFRESH_TOKEN);

    if (accessToken && refreshToken) {
      set({ accessToken, refreshToken, isAuthenticated: true });
      return true;
    }
    return false;
  },
}));
