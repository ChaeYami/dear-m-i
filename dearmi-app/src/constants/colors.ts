/**
 * DearMI 디자인 시스템 — 색상 팔레트
 * 따뜻하고 차분한 세이지/라벤더 계열
 *
 * "정신건강의학과·심리상담을 받는 사람들이 매일 열고 싶은 앱"
 */
export const colors = {
  // ── 배경 ────────────────────────────────
  background: '#F7F4F0',
  backgroundDark: '#1A1825',
  surface: 'rgba(255, 255, 255, 0.72)',
  surfaceSolid: '#FFFFFF',
  surfaceDark: 'rgba(40, 35, 60, 0.72)',

  // ── 주색 — 소프트 라벤더 퍼플 ──────────
  primary: '#8B7EBD',
  primaryLight: '#B8AEDD',
  primaryDark: '#6B5E9E',

  // ── 보조색 — 세이지 그린 ───────────────
  secondary: '#7EAD9B',
  secondaryLight: '#A8C8BB',

  // ── 텍스트 ─────────────────────────────
  text: '#2D2840',
  textSub: '#8C879E',
  textDisabled: '#BDB9CC',
  textInverse: '#FFFFFF',

  // ── 감정 점수 (소프트 톤) ──────────────
  emotionLow: '#E8A5A5',     // 1-3
  emotionMid: '#F0C97A',     // 4-6
  emotionHigh: '#8BC4A8',    // 7-10

  // ── 상태 ───────────────────────────────
  error: '#D4747B',
  errorLight: '#FDF0F0',
  warning: '#E8B86D',
  warningLight: '#FDF8EE',
  success: '#7EAD9B',
  successLight: '#EEF6F2',

  // ── 비활성 & 스켈레톤 ──────────────────
  disabled: '#E5E0EC',
  skeleton: '#EDE9F0',

  // ── 글래스모피즘 ───────────────────────
  glassBorder: 'rgba(255, 255, 255, 0.3)',
  glassBlur: 'rgba(255, 255, 255, 0.15)',
  glassShadow: 'rgba(139, 126, 189, 0.15)',

  // ── 구분선 ─────────────────────────────
  divider: 'rgba(139, 126, 189, 0.12)',
} as const;

export type Colors = typeof colors;
