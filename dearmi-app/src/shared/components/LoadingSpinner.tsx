import React from 'react';
import { ActivityIndicator, View, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '@/shared/theme';

interface LoadingSpinnerProps {
  fullscreen?: boolean;
  size?: 'small' | 'large';
  color?: string;
  style?: ViewStyle;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  fullscreen = false,
  size = 'large',
  color,
  style,
}) => {
  const { colors } = useTheme();
  const spinnerColor = color ?? colors.primary;

  if (fullscreen) {
    return (
      <View
        style={[
          styles.fullscreen,
          { backgroundColor: colors.background + 'D9' },
          style,
        ]}
      >
        <ActivityIndicator size={size} color={spinnerColor} />
      </View>
    );
  }

  return (
    <View style={[styles.inline, style]}>
      <ActivityIndicator size={size} color={spinnerColor} />
    </View>
  );
};

const styles = StyleSheet.create({
  fullscreen: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 999,
  },
  inline: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
});
