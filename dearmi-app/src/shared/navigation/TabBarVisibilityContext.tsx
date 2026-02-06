import React, { createContext, useContext, useMemo } from 'react';
import { SharedValue, useSharedValue, withTiming } from 'react-native-reanimated';

interface TabBarVisibilityContextValue {
  /** 0 = visible, 1 = hidden (translate down by tab bar height + safe bottom) */
  hidden: SharedValue<number>;
  show: () => void;
  hide: () => void;
}

const TabBarVisibilityContext = createContext<TabBarVisibilityContextValue | null>(null);

export function TabBarVisibilityProvider({ children }: { children: React.ReactNode }) {
  const hidden = useSharedValue(0);

  const value = useMemo<TabBarVisibilityContextValue>(
    () => ({
      hidden,
      show: () => {
        hidden.value = withTiming(0, { duration: 180 });
      },
      hide: () => {
        hidden.value = withTiming(1, { duration: 180 });
      },
    }),
    [hidden],
  );

  return (
    <TabBarVisibilityContext.Provider value={value}>
      {children}
    </TabBarVisibilityContext.Provider>
  );
}

export function useTabBarVisibility(): TabBarVisibilityContextValue {
  const ctx = useContext(TabBarVisibilityContext);
  if (!ctx) {
    throw new Error('useTabBarVisibility must be used within TabBarVisibilityProvider');
  }
  return ctx;
}
