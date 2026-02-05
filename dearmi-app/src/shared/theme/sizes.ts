/**
 * DearMI 디자인 시스템 — 크기 상수 (업그레이드)
 * 기존 sizes.ts와 하위호환 유지
 */
export const sizes = {
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },

  font: {
    xs: 11,
    sm: 13,
    md: 15,
    lg: 17,
    xl: 20,
    xxl: 24,
    xxxl: 32,
  },

  fontWeight: {
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
  },

  radius: {
    sm: 4,
    md: 8,
    lg: 16,
    xl: 20,
    xxl: 24,
    full: 9999,
  },

  icon: {
    sm: 16,
    md: 20,
    lg: 24,
    xl: 32,
  },

  buttonHeight: {
    sm: 36,
    md: 48,
    lg: 56,
  },

  tabBarHeight: 64,
  headerHeight: 56,
  tabBarSafeBottom: 104,
} as const;

export type Sizes = typeof sizes;
