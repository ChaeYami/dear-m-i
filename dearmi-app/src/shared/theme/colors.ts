/**
 * DearMI 디자인 시스템 — 색상 팔레트
 * Light & Dark 테마
 *
 * "정신건강의학과·심리상담을 받는 사람들이 매일 열고 싶은 앱"
 */

const palette = {
  // ── 라벤더 스펙트럼 ──────────────────
  lavender50: '#F5F3FA',
  lavender100: '#EDE9F6',
  lavender200: '#D8D1EC',
  lavender300: '#B8AEDD',
  lavender400: '#A99BD4',
  lavender500: '#8B7EBD',
  lavender600: '#7568A6',
  lavender700: '#6B5E9E',
  lavender800: '#4A4072',
  lavender900: '#2D2840',

  // ── 세이지 스펙트럼 ──────────────────
  sage300: '#A8C8BB',
  sage400: '#8BC4A8',
  sage500: '#7EAD9B',
  sage600: '#6A9A87',

  // ── 감정 ─────────────────────────────
  coral: '#E8A5A5',
  amber: '#F0C97A',
  mint: '#8BC4A8',

  // ── 상태 ─────────────────────────────
  red400: '#D4747B',
  orange400: '#E8B86D',
  green400: '#7EAD9B',

  // ── 중립 ─────────────────────────────
  white: '#FFFFFF',
  black: '#000000',
} as const;

export interface ThemeColors {
  // ── 배경 ────────────────────────────────
  background: string;
  surface: string;
  surfaceElevated: string;

  // ── 주색 ────────────────────────────────
  primary: string;
  primaryLight: string;
  primaryDark: string;
  primaryMuted: string;

  // ── 보조색 ──────────────────────────────
  secondary: string;
  secondaryLight: string;

  // ── 텍스트 ─────────────────────────────
  text: string;
  textSub: string;
  textDisabled: string;
  textInverse: string;

  // ── 감정 점수 ──────────────────────────
  emotionLow: string;
  emotionMid: string;
  emotionHigh: string;

  // ── 상태 ───────────────────────────────
  error: string;
  errorLight: string;
  warning: string;
  warningLight: string;
  success: string;
  successLight: string;

  // ── 비활성 & 스켈레톤 ──────────────────
  disabled: string;
  skeleton: string;

  // ── 글래스모피즘 / 그림자 ──────────────
  glassBorder: string;
  glassBlur: string;
  glassShadow: string;
  shadowOuter: string;

  // ── 구분선 ─────────────────────────────
  divider: string;

  // ── 카드 ───────────────────────────────
  card: string;
  cardBorder: string;
}

export const lightColors: ThemeColors = {
  background: '#FAF8F5',
  surface: '#FFFFFF',
  surfaceElevated: '#FFFFFF',

  primary: palette.lavender500,
  primaryLight: palette.lavender300,
  primaryDark: palette.lavender700,
  primaryMuted: palette.lavender100,

  secondary: palette.sage500,
  secondaryLight: palette.sage300,

  text: palette.lavender900,
  textSub: '#8C879E',
  textDisabled: '#BDB9CC',
  textInverse: palette.white,

  emotionLow: palette.coral,
  emotionMid: palette.amber,
  emotionHigh: palette.mint,

  error: palette.red400,
  errorLight: '#FDF0F0',
  warning: palette.orange400,
  warningLight: '#FDF8EE',
  success: palette.green400,
  successLight: '#EEF6F2',

  disabled: '#E5E0EC',
  skeleton: '#EDE9F0',

  glassBorder: 'rgba(255, 255, 255, 0.4)',
  glassBlur: 'rgba(255, 255, 255, 0.15)',
  glassShadow: 'rgba(139, 126, 189, 0.12)',
  shadowOuter: 'rgba(139, 126, 189, 0.06)',

  divider: 'rgba(139, 126, 189, 0.10)',

  card: '#FFFFFF',
  cardBorder: 'rgba(139, 126, 189, 0.08)',
};

export const darkColors: ThemeColors = {
  background: '#141220',
  surface: '#1E1B2E',
  surfaceElevated: '#272440',

  primary: palette.lavender400,
  primaryLight: palette.lavender300,
  primaryDark: palette.lavender600,
  primaryMuted: 'rgba(139, 126, 189, 0.15)',

  secondary: palette.sage400,
  secondaryLight: palette.sage300,

  text: '#EDE9F6',
  textSub: '#9B95B0',
  textDisabled: '#5A5572',
  textInverse: palette.lavender900,

  emotionLow: '#E8A5A5',
  emotionMid: '#F0C97A',
  emotionHigh: '#8BC4A8',

  error: '#E88A90',
  errorLight: 'rgba(232, 138, 144, 0.15)',
  warning: '#F0C97A',
  warningLight: 'rgba(240, 201, 122, 0.15)',
  success: '#8BC4A8',
  successLight: 'rgba(139, 196, 168, 0.15)',

  disabled: '#3A3650',
  skeleton: '#2E2A42',

  glassBorder: 'rgba(169, 155, 212, 0.2)',
  glassBlur: 'rgba(30, 27, 46, 0.6)',
  glassShadow: 'rgba(0, 0, 0, 0.3)',
  shadowOuter: 'rgba(0, 0, 0, 0.2)',

  divider: 'rgba(169, 155, 212, 0.12)',

  card: '#1E1B2E',
  cardBorder: 'rgba(169, 155, 212, 0.1)',
};

// 하위 호환을 위한 레거시 export (점진적 마이그레이션용)
export const colors = {
  ...lightColors,
  backgroundDark: darkColors.background,
  surfaceDark: darkColors.surface,
  surfaceSolid: '#FFFFFF',
} as const;
