import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { sizes } from '@/shared/theme';

/**
 * FAB/콘텐츠가 탭 바에 가려지지 않도록 하단 여백을 계산.
 * FAB 위치 (bottom:)로 사용 시 탭 바 바로 위에 안착.
 * 스크롤 콘텐츠 paddingBottom으로 쓸 때는 별도 offset 추가 (ex. + 80).
 *
 * MainTabNavigator의 tabBar bottom 계산식과 일치해야 함:
 *   tabBarBottom = max(insets.bottom + 8, 28)
 */
export const useTabBarSafeBottom = (): number => {
  const insets = useSafeAreaInsets();
  const tabBarBottom = Math.max(insets.bottom + 8, 28);
  return sizes.tabBarHeight + tabBarBottom + 8;
};
