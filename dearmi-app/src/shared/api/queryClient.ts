import { QueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { isGuestModeError } from '@/shared/api/errors';
import { customAlert } from '@/shared/components/CustomAlert';
import { useAuthStore } from '@/features/auth/store/authStore';
import i18n from '@/locales/i18n';

/**
 * React Query 클라이언트 설정
 * - staleTime: 5분 (서버 데이터를 5분간 신선하게 유지)
 * - gcTime: 24시간 (캐시를 24시간 유지 — 오프라인 지원)
 * - networkMode: 'offlineFirst' (캐시 우선, 네트워크 없이도 캐시 반환)
 * - retry: 네트워크 오류만 2회, 4xx는 재시도 없음
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      /** 5분간 데이터 신선 유지 (불필요한 리패치 방지) */
      staleTime: 5 * 60 * 1000,

      /** 24시간 캐시 유지 (오프라인 지원) */
      gcTime: 24 * 60 * 60 * 1000,

      /**
       * 오프라인 우선 모드
       * - 네트워크 없어도 캐시된 데이터 즉시 반환
       * - 온라인 복구 시 자동 리패치
       */
      networkMode: 'offlineFirst',

      /**
       * 재시도 정책: 4xx 에러는 재시도 없음, 그 외 2회
       * - 401, 403, 404, 422 등 클라이언트 에러는 재시도해도 동일 결과
       * - 네트워크 오류, 5xx 서버 오류만 재시도
       */
      retry: (failureCount, error) => {
        if (error instanceof AxiosError) {
          const status = error.response?.status;
          // 4xx 에러: 재시도 없음
          if (status !== undefined && status >= 400 && status < 500) {
            return false;
          }
        }
        // 그 외: 최대 2회 재시도
        return failureCount < 2;
      },
    },

    mutations: {
      networkMode: 'offlineFirst',
      // 게스트 모드에서 모든 쓰기 mutation 은 axios 인터셉터가 GuestModeError 로 차단.
      //   여기서 캐치 → customAlert 로 로그인 유도 → 확인 시 게스트 모드 종료 → Auth 스택 전환.
      //   호출 측에서 mutation.onError 를 추가해도 React Query 가 둘 다 실행하므로 무방.
      onError: (error) => {
        if (!isGuestModeError(error)) return;
        customAlert(
          i18n.t('common:guest_required_title'),
          i18n.t('common:guest_required_message'),
          [
            { text: i18n.t('common:cancel'), style: 'cancel' },
            {
              text: i18n.t('common:guest_required_cta'),
              onPress: () => useAuthStore.getState().exitGuestMode(),
            },
          ],
        );
      },
    },
  },
});
