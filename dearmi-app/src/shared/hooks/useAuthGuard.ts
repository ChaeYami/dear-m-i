import { useEffect } from 'react';
import { CommonActions, useNavigation } from '@react-navigation/native';
import { useAuthStore } from '@/features/auth/store/authStore';

/**
 * 인증 가드 훅
 * - 인증이 필요한 화면에서 사용
 * - 미인증 상태면 Auth 스택으로 리다이렉트
 */
export const useAuthGuard = () => {
  const { isAuthenticated } = useAuthStore();
  const navigation = useNavigation();

  useEffect(() => {
    if (!isAuthenticated) {
      navigation.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [{ name: 'Auth' }],
        })
      );
    }
  }, [isAuthenticated, navigation]);

  return { isAuthenticated };
};
