import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { sizes } from '@/shared/theme';

/**
 * 탭 바 위쪽까지 콘텐츠가 가려지지 않도록 하단 여백을 계산
 *
 * - 제스처 모드 (insets.bottom == 0) → tabBarHeight + bottom margin (28) + 28
 * - 3-button 모드 (insets.bottom > 0) → tabBarHeight + insets.bottom + 8 + 28
 *
 * MainTabNavigator의 tabBar bottom 계산식과 일치해야 함:
 *   tabBarBottom = max(insets.bottom + 8, 28)
 */
export const useTabBarSafeBottom = (): number => {
  const insets = useSafeAreaInsets();
  const tabBarBottom = Math.max(insets.bottom + 8, 28);
  return sizes.tabBarHeight + tabBarBottom + 28;
};
