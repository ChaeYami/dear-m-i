import React, { forwardRef, useState } from 'react';
import {
  TextInput,
  View,
  Text,
  StyleSheet,
  TextInputProps,
  ViewStyle,
} from 'react-native';
import { colors, sizes } from '@/constants';

interface InputProps extends TextInputProps {
  label?: string;
  errorMessage?: string;
  containerStyle?: ViewStyle;
}

/**
 * 공통 텍스트 입력 컴포넌트
 * - label: 상단 레이블
 * - errorMessage: 하단 에러 메시지
 * - forwardRef로 외부에서 ref 접근 가능
 */
export const Input = forwardRef<TextInput, InputProps>(
  ({ label, errorMessage, containerStyle, style, onFocus, onBlur, ...rest }, ref) => {
    const [isFocused, setIsFocused] = useState(false);

    return (
      <View style={[styles.container, containerStyle]}>
        {label && <Text style={styles.label}>{label}</Text>}
        <TextInput
          ref={ref}
          style={[
            styles.input,
            isFocused && styles.inputFocused,
            errorMessage ? styles.inputError : undefined,
            style,
          ]}
          placeholderTextColor={colors.text.disabled}
          onFocus={(e) => {
            setIsFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setIsFocused(false);
            onBlur?.(e);
          }}
          {...rest}
        />
        {errorMessage && <Text style={styles.errorText}>{errorMessage}</Text>}
      </View>
    );
  }
);

Input.displayName = 'Input';

const styles = StyleSheet.create({
  container: {
    marginBottom: sizes.spacing.sm,
  },
  label: {
    fontSize: sizes.font.sm,
    fontWeight: sizes.fontWeight.medium,
    color: colors.text.secondary,
    marginBottom: sizes.spacing.xs,
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: sizes.radius.md,
    paddingHorizontal: sizes.spacing.md,
    fontSize: sizes.font.md,
    color: colors.text.primary,
    backgroundColor: colors.surface,
  },
  inputFocused: {
    borderColor: colors.primary,
  },
  inputError: {
    borderColor: colors.error,
  },
  errorText: {
    fontSize: sizes.font.xs,
    color: colors.error,
    marginTop: sizes.spacing.xs,
  },
});
