import React, { forwardRef, useState } from 'react';
import {
  TextInput,
  View,
  Text,
  TouchableOpacity,
  TextInputProps,
  ViewStyle,
} from 'react-native';
import { useTheme, sizes, fontFamily } from '@/shared/theme';

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
    const { colors } = useTheme();
    const [isFocused, setIsFocused] = useState(false);
    const [secureVisible, setSecureVisible] = useState(false);

    const isSecure = secureTextEntry && !secureVisible;

    return (
      <View style={[{ marginBottom: sizes.spacing.sm }, containerStyle]}>
        {label && (
          <Text
            style={{
              fontFamily: fontFamily.medium,
              fontSize: sizes.font.sm,
              color: colors.textSub,
              marginBottom: sizes.spacing.xs,
            }}
          >
            {label}
          </Text>
        )}

        <View
          style={[
            {
              flexDirection: 'row',
              alignItems: 'center',
              borderWidth: 1.5,
              borderColor: colors.divider,
              borderRadius: sizes.radius.lg,
              backgroundColor: colors.surface,
              height: 48,
            },
            multiline && { height: 120, alignItems: 'flex-start' as const },
            isFocused && { borderColor: colors.primary },
            errorMessage ? { borderColor: colors.error } : undefined,
          ]}
        >
          <TextInput
            ref={ref}
            style={[
              {
                flex: 1,
                paddingHorizontal: sizes.spacing.md,
                fontFamily: fontFamily.regular,
                fontSize: sizes.font.md,
                color: colors.text,
                height: '100%',
              },
              multiline && {
                paddingTop: sizes.spacing.sm,
                paddingBottom: sizes.spacing.sm,
              },
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
              style={{ paddingHorizontal: sizes.spacing.sm }}
            >
              <Text
                style={{
                  fontFamily: fontFamily.medium,
                  fontSize: sizes.font.sm,
                  color: colors.primary,
                }}
              >
                {secureVisible ? '숨기기' : '보기'}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {errorMessage && (
          <Text
            style={{
              fontFamily: fontFamily.regular,
              fontSize: sizes.font.xs,
              color: colors.error,
              marginTop: sizes.spacing.xs,
            }}
          >
            {errorMessage}
          </Text>
        )}
      </View>
    );
  },
);

Input.displayName = 'Input';
