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

/**
 * 공통 버튼 컴포넌트
 * - variant: 'primary' | 'secondary' | 'outline' | 'ghost'
 * - size: 'sm' | 'md' | 'lg'
 * - isLoading: 로딩 스피너 표시
 */
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

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      style={[
        styles.base,
        styles[variant],
        styles[`size_${size}`],
        isDisabled && styles.disabled,
        style,
      ]}
      activeOpacity={0.8}
    >
      {isLoading ? (
        <ActivityIndicator
          color={variant === 'outline' || variant === 'ghost' ? colors.primary : colors.text.onPrimary}
          size="small"
        />
      ) : (
        <Text style={[styles.label, styles[`label_${variant}`], labelStyle]}>{label}</Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: sizes.radius.md,
  },
  // 변형
  primary: {
    backgroundColor: colors.primary,
  },
  secondary: {
    backgroundColor: colors.secondary,
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.primary,
  },
  ghost: {
    backgroundColor: 'transparent',
  },
  disabled: {
    opacity: 0.5,
  },
  // 크기
  size_sm: {
    height: sizes.buttonHeight.sm,
    paddingHorizontal: sizes.spacing.md,
  },
  size_md: {
    height: sizes.buttonHeight.md,
    paddingHorizontal: sizes.spacing.lg,
  },
  size_lg: {
    height: sizes.buttonHeight.lg,
    paddingHorizontal: sizes.spacing.xl,
  },
  // 레이블 색상
  label: {
    fontSize: sizes.font.md,
    fontWeight: sizes.fontWeight.semibold,
  },
  label_primary: { color: colors.text.onPrimary },
  label_secondary: { color: colors.text.onPrimary },
  label_outline: { color: colors.primary },
  label_ghost: { color: colors.primary },
});
