import { useEffect } from 'react';
import { useNavigation } from '@react-navigation/native';
import { StackActions } from '@react-navigation/native';

/**
 * 탭 전환 시 스택을 루트로 리셋하는 훅
 * 각 탭의 스택 네비게이터 루트 화면에서 호출
 */
export function useResetStackOnTabFocus() {
  const navigation = useNavigation();

  useEffect(() => {
    const parent = navigation.getParent();
    if (!parent) return;

    const unsubscribe = parent.addListener('tabPress' as any, () => {
      const state = navigation.getState();
      if (state && state.index > 0) {
        navigation.dispatch(StackActions.popToTop());
      }
    });

    return unsubscribe;
  }, [navigation]);
}
