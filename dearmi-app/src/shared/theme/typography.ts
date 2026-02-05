import { Platform, TextStyle } from 'react-native';

/**
 * DearMI 디자인 시스템 — 타이포그래피
 * SUIT 폰트 패밀리 사용
 */

const SUIT_FAMILY = {
  regular: Platform.select({
    ios: 'SUIT-Regular',
    android: 'SUIT-Regular',
    default: 'SUIT-Regular',
  })!,
  medium: Platform.select({
    ios: 'SUIT-Medium',
    android: 'SUIT-Medium',
    default: 'SUIT-Medium',
  })!,
  semibold: Platform.select({
    ios: 'SUIT-SemiBold',
    android: 'SUIT-SemiBold',
    default: 'SUIT-SemiBold',
  })!,
  bold: Platform.select({
    ios: 'SUIT-Bold',
    android: 'SUIT-Bold',
    default: 'SUIT-Bold',
  })!,
};

export const fontFamily = SUIT_FAMILY;

// 프리셋 텍스트 스타일
export const textStyles = {
  h1: {
    fontFamily: SUIT_FAMILY.bold,
    fontSize: 28,
    lineHeight: 36,
    letterSpacing: -0.3,
  } as TextStyle,

  h2: {
    fontFamily: SUIT_FAMILY.bold,
    fontSize: 22,
    lineHeight: 30,
    letterSpacing: -0.2,
  } as TextStyle,

  h3: {
    fontFamily: SUIT_FAMILY.semibold,
    fontSize: 18,
    lineHeight: 26,
    letterSpacing: -0.1,
  } as TextStyle,

  body: {
    fontFamily: SUIT_FAMILY.regular,
    fontSize: 16,
    lineHeight: 24,
  } as TextStyle,

  bodyMedium: {
    fontFamily: SUIT_FAMILY.medium,
    fontSize: 16,
    lineHeight: 24,
  } as TextStyle,

  caption: {
    fontFamily: SUIT_FAMILY.regular,
    fontSize: 14,
    lineHeight: 20,
  } as TextStyle,

  captionMedium: {
    fontFamily: SUIT_FAMILY.medium,
    fontSize: 14,
    lineHeight: 20,
  } as TextStyle,

  small: {
    fontFamily: SUIT_FAMILY.regular,
    fontSize: 12,
    lineHeight: 16,
  } as TextStyle,

  label: {
    fontFamily: SUIT_FAMILY.semibold,
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  } as TextStyle,
} as const;

// 하위 호환을 위한 레거시 export
export const typography = {
  fontFamily: SUIT_FAMILY.regular,
  h1: 28,
  h2: 22,
  h3: 18,
  body: 16,
  caption: 14,
  small: 12,
  bold: '700' as const,
  semibold: '600' as const,
  medium: '500' as const,
  regular: '400' as const,
  lineHeightH1: 36,
  lineHeightH2: 30,
  lineHeightBody: 24,
  lineHeightCaption: 20,
};
