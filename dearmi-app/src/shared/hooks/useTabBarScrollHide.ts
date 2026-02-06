import { useCallback, useRef } from 'react';
import type { NativeScrollEvent, NativeSyntheticEvent } from 'react-native';
import { useTabBarVisibility } from '@/shared/navigation/TabBarVisibilityContext';

const HIDE_THRESHOLD = 6;

/**
 * 스크롤 방향에 따라 바텀 탭바를 내리거나 올리는 핸들러를 반환한다.
 * JS 스레드에서 diff 를 감시 → show/hide 호출 (탭바는 Reanimated shared value 로 렌더).
 */
export function useTabBarScrollHide() {
  const { show, hide } = useTabBarVisibility();
  const lastY = useRef(0);
  const scrollingDown = useRef(false);

  const onScroll = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const y = e.nativeEvent.contentOffset.y;
      const diff = y - lastY.current;
      if (y <= 0) {
        show();
      } else if (diff > HIDE_THRESHOLD) {
        if (!scrollingDown.current) {
          hide();
          scrollingDown.current = true;
        }
      } else if (diff < -HIDE_THRESHOLD) {
        if (scrollingDown.current) {
          show();
          scrollingDown.current = false;
        }
      }
      lastY.current = y;
    },
    [show, hide],
  );

  const onScrollEnd = useCallback(() => {
    show();
    scrollingDown.current = false;
  }, [show]);

  return {
    onScroll,
    onScrollEndDrag: onScrollEnd,
    onMomentumScrollEnd: onScrollEnd,
    scrollEventThrottle: 16,
  };
}
