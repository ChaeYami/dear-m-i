import { Platform } from 'react-native';

/**
 * DearMI 디자인 시스템 — 타이포그래피
 */
export const typography = {
  // 폰트 패밀리 (시스템 라운드 폰트)
  fontFamily: Platform.select({
    ios: 'System',
    android: 'sans-serif',
    default: 'System',
  }),

  // 사이즈
  h1: 28,
  h2: 22,
  h3: 18,
  body: 16,
  caption: 14,
  small: 12,

  // 웨이트
  bold: '700' as const,
  semibold: '600' as const,
  medium: '500' as const,
  regular: '400' as const,

  // 라인 높이
  lineHeightH1: 36,
  lineHeightH2: 30,
  lineHeightBody: 24,
  lineHeightCaption: 20,
} as const;

export type Typography = typeof typography;
