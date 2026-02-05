import { useEffect } from 'react';
import { useNavigation } from '@react-navigation/native';
import { StackActions } from '@react-navigation/native';

/**
 * 현재 탭의 아이콘을 다시 탭했을 때만 스택을 루트로 리셋
 * (다른 탭으로 이동할 때는 소스 탭의 스택 상태를 보존)
 *
 * 각 탭의 스택 네비게이터 루트 화면에서 호출
 */
export function useResetStackOnTabFocus() {
  const navigation = useNavigation();

  useEffect(() => {
    const parent = navigation.getParent();
    if (!parent) return;

    const unsubscribe = parent.addListener('tabPress' as any, (e: any) => {
      // 같은 탭을 다시 누른 경우에만 popToTop (다른 탭으로 이동 시 무시)
      const tabState = parent.getState() as any;
      const currentTabKey = tabState?.routes?.[tabState.index]?.key;
      if (e.target !== currentTabKey) return;

      const state = navigation.getState();
      if (state && state.index > 0) {
        navigation.dispatch(StackActions.popToTop());
      }
    });

    return unsubscribe;
  }, [navigation]);
}
