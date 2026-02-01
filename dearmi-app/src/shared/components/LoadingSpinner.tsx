import React from 'react';
import { ActivityIndicator, View, StyleSheet, ViewStyle } from 'react-native';
import { colors } from '@/constants';

interface LoadingSpinnerProps {
  /** 화면 전체를 덮는 풀스크린 모드 (기본: false) */
  fullscreen?: boolean;
  size?: 'small' | 'large';
  color?: string;
  style?: ViewStyle;
}

/**
 * 공통 로딩 스피너
 * - fullscreen: 화면 중앙에 절대 위치로 표시
 * - 인라인 사용 시 부모 컨테이너 기준으로 표시
 */
export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  fullscreen = false,
  size = 'large',
  color = colors.primary,
  style,
}) => {
  if (fullscreen) {
    return (
      <View style={[styles.fullscreen, style]}>
        <ActivityIndicator size={size} color={color} />
      </View>
    );
  }

  return (
    <View style={[styles.inline, style]}>
      <ActivityIndicator size={size} color={color} />
    </View>
  );
};

const styles = StyleSheet.create({
  fullscreen: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.85)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 999,
  },
  inline: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
});
