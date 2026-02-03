import React, { forwardRef, useState } from 'react';
import {
  TextInput,
  View,
  Text,
  TouchableOpacity,
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

export const Input = forwardRef<TextInput, InputProps>(
  (
    {
      label,
      errorMessage,
      containerStyle,
      style,
      onFocus,
      onBlur,
      secureTextEntry,
      multiline,
      ...rest
    },
    ref,
  ) => {
    const [isFocused, setIsFocused] = useState(false);
    const [secureVisible, setSecureVisible] = useState(false);

    const isSecure = secureTextEntry && !secureVisible;

    return (
      <View style={[styles.container, containerStyle]}>
        {label && <Text style={styles.label}>{label}</Text>}

        <View
          style={[
            styles.inputWrapper,
            multiline && styles.inputWrapperMultiline,
            isFocused && styles.wrapperFocused,
            errorMessage ? styles.wrapperError : undefined,
          ]}
        >
          <TextInput
            ref={ref}
            style={[
              styles.input,
              multiline && styles.inputMultiline,
              style,
            ]}
            placeholderTextColor={colors.textDisabled}
            secureTextEntry={isSecure}
            multiline={multiline}
            textAlignVertical={multiline ? 'top' : 'center'}
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

          {secureTextEntry && (
            <TouchableOpacity
              onPress={() => setSecureVisible((v) => !v)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              style={styles.toggleButton}
            >
              <Text style={styles.toggleText}>
                {secureVisible ? '숨기기' : '보기'}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {errorMessage && <Text style={styles.errorText}>{errorMessage}</Text>}
      </View>
    );
  },
);

Input.displayName = 'Input';

const styles = StyleSheet.create({
  container: {
    marginBottom: sizes.spacing.sm,
  },
  label: {
    fontSize: sizes.font.sm,
    fontWeight: sizes.fontWeight.medium,
    color: colors.textSub,
    marginBottom: sizes.spacing.xs,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.divider,
    borderRadius: sizes.radius.md,
    backgroundColor: colors.surfaceSolid,
    height: 48,
  },
  inputWrapperMultiline: {
    height: 120,
    alignItems: 'flex-start',
  },
  wrapperFocused: {
    borderColor: colors.primary,
  },
  wrapperError: {
    borderColor: colors.error,
  },
  input: {
    flex: 1,
    paddingHorizontal: sizes.spacing.md,
    fontSize: sizes.font.md,
    color: colors.text,
    height: '100%',
  },
  inputMultiline: {
    paddingTop: sizes.spacing.sm,
    paddingBottom: sizes.spacing.sm,
  },
  toggleButton: {
    paddingHorizontal: sizes.spacing.sm,
  },
  toggleText: {
    fontSize: sizes.font.sm,
    color: colors.primary,
    fontWeight: sizes.fontWeight.medium,
  },
  errorText: {
    fontSize: sizes.font.xs,
    color: colors.error,
    marginTop: sizes.spacing.xs,
  },
});
