import React, { useCallback } from 'react';
import {
  Text,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
  Pressable,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { useTheme, sizes, fontFamily } from '@/shared/theme';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  labelStyle?: TextStyle;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const SPRING_CONFIG = { damping: 15, stiffness: 300, mass: 0.6 };

export const Button: React.FC<ButtonProps> = ({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled = false,
  style,
  labelStyle,
}) => {
  const { colors } = useTheme();
  const scale = useSharedValue(1);
  const isDisabled = disabled || isLoading;

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const onPressIn = useCallback(() => {
    scale.value = withSpring(0.97, SPRING_CONFIG);
  }, [scale]);

  const onPressOut = useCallback(() => {
    scale.value = withSpring(1, SPRING_CONFIG);
  }, [scale]);

  const variantStyles: Record<ButtonVariant, ViewStyle> = {
    primary: { backgroundColor: colors.primary },
    secondary: { backgroundColor: colors.secondary },
    outline: {
      backgroundColor: 'transparent',
      borderWidth: 1.5,
      borderColor: colors.divider,
    },
    ghost: { backgroundColor: 'transparent' },
  };

  const disabledStyles: Record<ButtonVariant, ViewStyle> = {
    primary: { backgroundColor: colors.disabled },
    secondary: { backgroundColor: colors.disabled },
    outline: { borderColor: colors.divider, backgroundColor: 'transparent' },
    ghost: { backgroundColor: 'transparent' },
  };

  const sizeMap: Record<ButtonSize, ViewStyle> = {
    sm: { height: sizes.buttonHeight.sm, paddingHorizontal: sizes.spacing.md },
    md: { height: sizes.buttonHeight.md, paddingHorizontal: sizes.spacing.lg },
    lg: { height: sizes.buttonHeight.lg, paddingHorizontal: sizes.spacing.xl },
  };

  const fontSizeMap: Record<ButtonSize, number> = {
    sm: sizes.font.sm,
    md: sizes.font.md,
    lg: sizes.font.lg,
  };

  const labelColors: Record<ButtonVariant, string> = {
    primary: colors.textInverse,
    secondary: colors.textInverse,
    outline: colors.primary,
    ghost: colors.primary,
  };

  const labelDisabledColors: Record<ButtonVariant, string> = {
    primary: colors.textInverse,
    secondary: colors.textInverse,
    outline: colors.textDisabled,
    ghost: colors.textDisabled,
  };

  const indicatorColor =
    variant === 'outline' || variant === 'ghost'
      ? colors.primary
      : colors.textInverse;

  const containerStyles: ViewStyle[] = [
    {
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: sizes.radius.lg,
    },
    variantStyles[variant],
    sizeMap[size],
    isDisabled ? disabledStyles[variant] : undefined,
    style,
  ].filter(Boolean) as ViewStyle[];

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      disabled={isDisabled}
      style={[animStyle, ...containerStyles]}
    >
      {isLoading ? (
        <ActivityIndicator color={indicatorColor} size="small" />
      ) : (
        <Text
          style={[
            {
              fontFamily: fontFamily.semibold,
              fontSize: fontSizeMap[size],
              color: isDisabled
                ? labelDisabledColors[variant]
                : labelColors[variant],
            },
            labelStyle,
          ]}
        >
          {label}
        </Text>
      )}
    </AnimatedPressable>
  );
};
