import React from 'react';
import { View, ViewStyle } from 'react-native';
import { useTheme, sizes } from '@/shared/theme';
import { softShadow } from '@/shared/theme/shadows';
import { AnimatedPressable } from './AnimatedPressable';

interface CardProps {
  children: React.ReactNode;
  onPress?: () => void;
  onLongPress?: () => void;
  style?: ViewStyle;
  noPadding?: boolean;
}

export const Card: React.FC<CardProps> = ({ children, onPress, onLongPress, style, noPadding }) => {
  const { colors } = useTheme();

  const cardStyle: ViewStyle = {
    backgroundColor: colors.card,
    borderRadius: sizes.radius.xxl,
    padding: noPadding ? 0 : sizes.spacing.lg,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    ...softShadow(colors),
  };

  if (onPress || onLongPress) {
    return (
      <AnimatedPressable
        onPress={onPress}
        onLongPress={onLongPress}
        style={[cardStyle, style]}
      >
        {children}
      </AnimatedPressable>
    );
  }

  return <View style={[cardStyle, style]}>{children}</View>;
};
