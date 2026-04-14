import React from 'react';
import { View, useWindowDimensions } from 'react-native';
import { useTheme } from '@/shared/theme';

const MAX_PHONE_WIDTH = 440;

export const PhoneWidthContainer: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { width } = useWindowDimensions();
  const { colors } = useTheme();

  if (width <= MAX_PHONE_WIDTH) {
    return <>{children}</>;
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background, alignItems: 'center' }}>
      <View style={{ width: MAX_PHONE_WIDTH, flex: 1, overflow: 'hidden' }}>
        {children}
      </View>
    </View>
  );
};
