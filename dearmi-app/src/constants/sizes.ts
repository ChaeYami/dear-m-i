/**
 * 앱 전역 크기 상수
 * - 간격, 폰트, 테두리 반경 등
 */
export const sizes = {
  /** 간격 (spacing) */
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },

  /** 폰트 크기 */
  font: {
    xs: 11,
    sm: 13,
    md: 15,
    lg: 17,
    xl: 20,
    xxl: 24,
    xxxl: 32,
  },

  /** 폰트 두께 */
  fontWeight: {
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
  },

  /** 테두리 반경 */
  radius: {
    sm: 4,
    md: 8,
    lg: 16,
    xl: 20,
    xxl: 28,
    full: 9999,
  },

  /** 아이콘 크기 */
  icon: {
    sm: 16,
    md: 20,
    lg: 24,
    xl: 32,
  },

  /** 버튼 높이 */
  buttonHeight: {
    sm: 36,
    md: 48,
    lg: 56,
  },

  /** 탭 바 높이 */
  tabBarHeight: 64,

  /** 헤더 높이 */
  headerHeight: 56,

  /** 플로팅 탭바 하단 여백 보상 (bottom 32 + height 64 + gap 8) */
  tabBarSafeBottom: 104,
} as const;

export type Sizes = typeof sizes;
