import { Platform, ViewStyle } from 'react-native';
import type { ThemeColors } from './colors';

/**
 * DearMI 몽글몽글 섀도우 시스템
 * 부드러운 이중 그림자로 떠 있는 느낌
 */

export const softShadow = (colors: ThemeColors): ViewStyle =>
  Platform.select({
    ios: {
      shadowColor: colors.glassShadow,
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 1,
      shadowRadius: 16,
    },
    android: {
      elevation: 4,
    },
  }) ?? {};

export const subtleShadow = (colors: ThemeColors): ViewStyle =>
  Platform.select({
    ios: {
      shadowColor: colors.glassShadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 1,
      shadowRadius: 8,
    },
    android: {
      elevation: 2,
    },
  }) ?? {};

export const floatingShadow = (colors: ThemeColors): ViewStyle =>
  Platform.select({
    ios: {
      shadowColor: colors.glassShadow,
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 1,
      shadowRadius: 24,
    },
    android: {
      elevation: 8,
    },
  }) ?? {};
