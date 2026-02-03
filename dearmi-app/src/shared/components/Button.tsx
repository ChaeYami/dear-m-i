import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { colors, sizes } from '@/constants';

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
  const isDisabled = disabled || isLoading;

  const containerStyles: ViewStyle[] = [
    styles.base,
    variantStyles[variant],
    sizeStyles[size],
    isDisabled && disabledContainerStyles[variant],
    style,
  ].filter(Boolean) as ViewStyle[];

  const indicatorColor =
    variant === 'outline' || variant === 'ghost'
      ? colors.primary
      : colors.textInverse;

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      style={containerStyles}
      activeOpacity={0.8}
    >
      {isLoading ? (
        <ActivityIndicator color={indicatorColor} size="small" />
      ) : (
        <Text
          style={[
            labelBaseStyles[size],
            labelColorStyles[variant],
            isDisabled && labelDisabledStyles[variant],
            labelStyle,
          ]}
        >
          {label}
        </Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: sizes.radius.lg,
  },
});

const variantStyles: Record<ButtonVariant, ViewStyle> = {
  primary: { backgroundColor: colors.primary },
  secondary: { backgroundColor: colors.secondary },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.divider,
  },
  ghost: { backgroundColor: 'transparent' },
};

const disabledContainerStyles: Record<ButtonVariant, ViewStyle> = {
  primary: { backgroundColor: colors.disabled },
  secondary: { backgroundColor: colors.disabled },
  outline: { borderColor: colors.divider, backgroundColor: 'transparent' },
  ghost: { backgroundColor: 'transparent' },
};

const sizeStyles: Record<ButtonSize, ViewStyle> = {
  sm: { height: sizes.buttonHeight.sm, paddingHorizontal: sizes.spacing.md },
  md: { height: sizes.buttonHeight.md, paddingHorizontal: sizes.spacing.lg },
  lg: { height: sizes.buttonHeight.lg, paddingHorizontal: sizes.spacing.xl },
};

const labelBaseStyles: Record<ButtonSize, TextStyle> = {
  sm: { fontSize: sizes.font.sm, fontWeight: sizes.fontWeight.semibold },
  md: { fontSize: sizes.font.md, fontWeight: sizes.fontWeight.semibold },
  lg: { fontSize: sizes.font.lg, fontWeight: sizes.fontWeight.semibold },
};

const labelColorStyles: Record<ButtonVariant, TextStyle> = {
  primary: { color: colors.textInverse },
  secondary: { color: colors.textInverse },
  outline: { color: colors.primary },
  ghost: { color: colors.primary },
};

const labelDisabledStyles: Record<ButtonVariant, TextStyle> = {
  primary: { color: colors.textInverse },
  secondary: { color: colors.textInverse },
  outline: { color: colors.textDisabled },
  ghost: { color: colors.textDisabled },
};
