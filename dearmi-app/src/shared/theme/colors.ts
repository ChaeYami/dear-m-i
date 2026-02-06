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
  /** FAB·CTA 그라데이션용 — 다크에서도 생생한 색상 유지 */
  primaryVivid: string;
  primaryVividDark: string;

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
  primaryVivid: palette.lavender500,
  primaryVividDark: palette.lavender700,

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
  // 카톡 다크톤: 네이비/퍼플 탈피, 중성 그레이 기반
  background: '#17181C',
  surface: '#1F2125',
  surfaceElevated: '#2A2D32',

  // 포인트 컬러는 라벤더 유지 (브랜드)
  primary: '#A99BD4',
  primaryLight: '#C0B5E2',
  primaryDark: '#8B7EBD',
  primaryMuted: 'rgba(169, 155, 212, 0.14)',
  primaryVivid: '#B8AEDD',
  primaryVividDark: '#8B7EBD',

  secondary: '#8BC4A8',
  secondaryLight: '#A8D5BC',

  text: '#ECECEE',
  textSub: '#9EA0A6',
  textDisabled: '#5C5E63',
  textInverse: '#17181C',

  emotionLow: '#D49999',
  emotionMid: '#DEBB76',
  emotionHigh: '#80B89C',

  error: '#D48088',
  errorLight: 'rgba(212, 128, 136, 0.12)',
  warning: '#DEB870',
  warningLight: 'rgba(222, 184, 112, 0.12)',
  success: '#80B89C',
  successLight: 'rgba(128, 184, 156, 0.12)',

  disabled: '#35373C',
  skeleton: '#2A2C30',

  glassBorder: 'rgba(255, 255, 255, 0.08)',
  glassBlur: 'rgba(31, 33, 37, 0.6)',
  glassShadow: 'rgba(0, 0, 0, 0.35)',
  shadowOuter: 'rgba(0, 0, 0, 0.22)',

  divider: 'rgba(255, 255, 255, 0.08)',

  card: '#1F2125',
  cardBorder: 'rgba(255, 255, 255, 0.06)',
};

// 하위 호환을 위한 레거시 export (점진적 마이그레이션용)
export const colors = {
  ...lightColors,
  backgroundDark: darkColors.background,
  surfaceDark: darkColors.surface,
  surfaceSolid: '#FFFFFF',
} as const;
