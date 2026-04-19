import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { SECURE_STORE_KEYS } from '@/constants/cacheKeys';
import { queryClient } from '@/shared/api/queryClient';
import { useSubscriptionStore } from '@/features/subscription/store/subscriptionStore';
import { authApi } from '@/features/auth/api';
import type { User } from '@/shared/types/domain.types';

/** 인증 상태 */
interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  user: User | null;
  isAuthenticated: boolean;
  /** 회원가입 없이 앱 둘러보기 모드 (App Store 5.1.1(v) 대응) */
  isGuest: boolean;
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

  /** 게스트(둘러보기) 모드 진입 — API 호출 없이 Main 스택으로 진입 가능. */
  enterGuestMode: () => void;

  /** 게스트 모드 종료 — LoginScreen 으로 복귀. */
  exitGuestMode: () => void;
}

type AuthStore = AuthState & AuthActions;

export const useAuthStore = create<AuthStore>((set) => ({
  // 초기 상태
  accessToken: null,
  refreshToken: null,
  user: null,
  isAuthenticated: false,
  isGuest: false,

  // 토큰 저장 (SecureStore에도 영속화) — 로그인 성공 시 게스트 모드 자동 해제
  setTokens: async (accessToken, refreshToken) => {
    await SecureStore.setItemAsync(SECURE_STORE_KEYS.ACCESS_TOKEN, accessToken);
    await SecureStore.setItemAsync(SECURE_STORE_KEYS.REFRESH_TOKEN, refreshToken);
    set({ accessToken, refreshToken, isAuthenticated: true, isGuest: false });
  },

  // 사용자 정보 설정
  setUser: (user) => {
    set({ user });
  },

  // 로그아웃: 메모리 + SecureStore + 다른 사용자 state(구독/쿼리 캐시) 까지 모두 정리
  //   subscriptionStore 를 reset 안 하면 이전 사용자의 PREMIUM 이 다음 사용자에게 그대로 보인다
  //   React Query 캐시도 클리어 — 이전 사용자의 기록/알림/복약 등 재사용 방지
  //   서버 logout API 호출 → refresh_token + FCM 토큰 삭제 (실패해도 로컬 정리는 진행)
  logout: async () => {
    try {
      await authApi.logout();
    } catch {
      // 네트워크 오류 등 — 서버 토큰/FCM은 만료 시 자동 정리됨
    }
    await SecureStore.deleteItemAsync(SECURE_STORE_KEYS.ACCESS_TOKEN);
    await SecureStore.deleteItemAsync(SECURE_STORE_KEYS.REFRESH_TOKEN);
    set({ accessToken: null, refreshToken: null, user: null, isAuthenticated: false, isGuest: false });
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

  // 게스트 모드 진입/종료 — 토큰 없이 Main 스택만 열어주는 플래그.
  // 게스트 상태에서는 모든 mutation 이 useGuestGuard 로 차단되고, 쿼리 hook 도 mock 데이터 반환.
  enterGuestMode: () => set({ isGuest: true }),
  exitGuestMode: () => set({ isGuest: false }),
}));
