import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@/features/auth/store/authStore';
import { customAlert } from '@/shared/components/CustomAlert';

/**
 * 게스트 모드에서 호출 시 "로그인 필요" 모달을 띄우고 액션을 차단한다.
 *
 * 사용법:
 *   const guard = useGuestGuard();
 *   const onSave = () => guard(() => mutate({ ... }));
 *
 * - 게스트가 아니면 action 즉시 실행.
 * - 게스트면 CustomAlert 노출 → 확인 시 exitGuestMode() 호출 → RootNavigator 가
 *   isAuthenticated/isGuest 둘 다 false 가 되면서 Auth 스택으로 자동 전환.
 *
 * App Store 5.1.1(v) 대응: 계정 기반 기능(저장/편집/구독 결제 등)은 로그인 유도.
 */
export const useGuestGuard = () => {
  const { t } = useTranslation('common');
  const isGuest = useAuthStore((s) => s.isGuest);
  const exitGuestMode = useAuthStore((s) => s.exitGuestMode);

  return useCallback(
    (action: () => void) => {
      if (!isGuest) {
        action();
        return;
      }
      customAlert(
        t('guest_required_title'),
        t('guest_required_message'),
        [
          { text: t('cancel'), style: 'cancel' },
          { text: t('guest_required_cta'), onPress: exitGuestMode },
        ],
      );
    },
    [isGuest, exitGuestMode, t],
  );
};
