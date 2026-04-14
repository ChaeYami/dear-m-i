import React from 'react';
import { View, Platform, ViewProps, ViewStyle, StyleSheet } from 'react-native';
import { BlurView, type BlurTint } from 'expo-blur';
import { useTheme } from '@/shared/theme';

/**
 * 글래스 강도 — UX 의도 기반.
 * - `subtle`  : 거의 투명. 살짝만 가림 (상단 하이라이트 라인이나 가벼운 칩에 사용)
 * - `regular` : 표준 글래스 (탭바·플로팅 카드)
 * - `thick`   : 더 진한 글래스 (모달 카드 — 가독성 우선)
 */
export type GlassIntensity = 'subtle' | 'regular' | 'thick';

interface IosBlurConfig {
  intensity: number;
  tint: BlurTint;
}

const IOS_CONFIG: Record<GlassIntensity, { light: IosBlurConfig; dark: IosBlurConfig }> = {
  subtle: {
    light: { intensity: 25, tint: 'light' },
    dark: { intensity: 25, tint: 'dark' },
  },
  regular: {
    light: { intensity: 40, tint: 'light' },
    dark: { intensity: 40, tint: 'dark' },
  },
  thick: {
    light: { intensity: 70, tint: 'light' },
    dark: { intensity: 80, tint: 'dark' },
  },
};

const ANDROID_BG: Record<GlassIntensity, { light: string; dark: string }> = {
  subtle: {
    light: 'rgba(255,255,255,0.55)',
    dark: 'rgba(31,33,37,0.55)',
  },
  regular: {
    light: 'rgba(255,255,255,0.72)',
    dark: 'rgba(31,33,37,0.72)',
  },
  thick: {
    light: 'rgba(255,255,255,0.88)',
    dark: 'rgba(31,33,37,0.88)',
  },
};

export interface GlassViewProps extends ViewProps {
  /** 글래스 강도. 기본 'regular' */
  intensity?: GlassIntensity;
  /** 상단 1px 흰색 하이라이트 라인 — 유리 가장자리 광택 (기본 false). 카드 위에 또 다른 카드가 겹칠 때 거슬릴 수 있어 명시적 opt-in. */
  showHighlight?: boolean;
  /** 둥근 모서리 — borderRadius 가 있으면 자동으로 overflow: hidden 처리 */
  borderRadius?: number;
  children?: React.ReactNode;
}

/**
 * GlassView — iOS 글래스모피즘 / Android 반투명 fallback.
 *
 * iOS: `expo-blur` 의 `BlurView` 가 컨테이너 자체가 됨.
 * Android: 일반 `View` + 반투명 배경 (BlurView 미설치 / 성능 이슈로 인한 fallback).
 *
 * @example
 * <GlassView intensity="regular" borderRadius={20} style={{ padding: 16 }}>
 *   <Text>...</Text>
 * </GlassView>
 */
export const GlassView: React.FC<GlassViewProps> = ({
  intensity = 'regular',
  showHighlight = false,
  borderRadius,
  style,
  children,
  ...rest
}) => {
  const { isDark } = useTheme();
  const mode = isDark ? 'dark' : 'light';

  const radiusStyle: ViewStyle | undefined =
    borderRadius != null ? { borderRadius, overflow: 'hidden' } : undefined;

  if (Platform.OS === 'ios') {
    const { intensity: blurIntensity, tint } = IOS_CONFIG[intensity][mode];
    return (
      <BlurView
        intensity={blurIntensity}
        tint={tint}
        style={[radiusStyle, style]}
        {...rest}
      >
        {showHighlight ? <TopHighlight isDark={isDark} /> : null}
        {children}
      </BlurView>
    );
  }

  // Android fallback
  return (
    <View
      style={[
        { backgroundColor: ANDROID_BG[intensity][mode] },
        radiusStyle,
        style,
      ]}
      {...rest}
    >
      {children}
    </View>
  );
};

const TopHighlight: React.FC<{ isDark: boolean }> = ({ isDark }) => (
  <View
    pointerEvents="none"
    style={[
      styles.highlight,
      { backgroundColor: isDark ? 'rgba(255,255,255,0.10)' : 'rgba(255,255,255,0.55)' },
    ]}
  />
);

const styles = StyleSheet.create({
  highlight: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 1,
    zIndex: 1,
  },
});
