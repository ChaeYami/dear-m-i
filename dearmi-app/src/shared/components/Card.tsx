import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { colors, sizes } from '@/constants';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

/**
 * 공통 카드 컴포넌트
 * - 흰색 배경 + 그림자 + 모서리 라운딩
 */
export const Card: React.FC<CardProps> = ({ children, style }) => {
  return <View style={[styles.card, style]}>{children}</View>;
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: sizes.radius.lg,
    padding: sizes.spacing.md,
    // iOS 그림자
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    // Android 그림자
    elevation: 2,
  },
});
