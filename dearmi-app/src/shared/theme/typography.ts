import { TextStyle } from 'react-native';

const FONT_FAMILY = {
  regular: 'Pretendard-Regular',
  medium: 'Pretendard-Medium',
  semibold: 'Pretendard-SemiBold',
  bold: 'Pretendard-Bold',
};

export const fontFamily = FONT_FAMILY;

export const textStyles = {
  h1: {
    fontFamily: FONT_FAMILY.bold,
    fontSize: 28,
    lineHeight: 36,
    letterSpacing: -0.3,
  } as TextStyle,

  h2: {
    fontFamily: FONT_FAMILY.bold,
    fontSize: 22,
    lineHeight: 30,
    letterSpacing: -0.2,
  } as TextStyle,

  h3: {
    fontFamily: FONT_FAMILY.semibold,
    fontSize: 18,
    lineHeight: 26,
    letterSpacing: -0.1,
  } as TextStyle,

  body: {
    fontFamily: FONT_FAMILY.regular,
    fontSize: 16,
    lineHeight: 24,
  } as TextStyle,

  bodyMedium: {
    fontFamily: FONT_FAMILY.medium,
    fontSize: 16,
    lineHeight: 24,
  } as TextStyle,

  caption: {
    fontFamily: FONT_FAMILY.regular,
    fontSize: 14,
    lineHeight: 20,
  } as TextStyle,

  captionMedium: {
    fontFamily: FONT_FAMILY.medium,
    fontSize: 14,
    lineHeight: 20,
  } as TextStyle,

  small: {
    fontFamily: FONT_FAMILY.regular,
    fontSize: 12,
    lineHeight: 16,
  } as TextStyle,

  label: {
    fontFamily: FONT_FAMILY.semibold,
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  } as TextStyle,
} as const;

export const typography = {
  fontFamily: FONT_FAMILY.regular,
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
