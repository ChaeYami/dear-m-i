import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { useTheme, sizes } from '@/shared/theme';
import { softShadow } from '@/shared/theme/shadows';

/**
 * RecordTab 의 카드 형상을 모방한 스켈레톤. spinner 보다 layout shift 가 작아
 * 체감 로딩 속도가 좋다. 1.2s 주기로 opacity 펄스.
 */
export const RecordCardSkeleton: React.FC<{ count?: number }> = ({ count = 5 }) => {
  const { colors } = useTheme();
  const opacity = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.9, duration: 600, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.4, duration: 600, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);

  const items = Array.from({ length: count });

  return (
    <View style={styles.list}>
      {items.map((_, i) => (
        <View key={i} style={styles.row}>
          <View style={styles.timelineLeft}>
            <View style={[styles.timelineDot, { backgroundColor: colors.divider }]} />
            <View style={[styles.timelineLine, { backgroundColor: colors.divider }]} />
          </View>
          <Animated.View
            style={[
              styles.card,
              { backgroundColor: colors.surface, opacity },
              softShadow(colors),
            ]}
          >
            <View style={[styles.line, styles.lineSm, { backgroundColor: colors.disabled }]} />
            <View style={[styles.line, styles.lineMd, { backgroundColor: colors.disabled }]} />
            <View style={[styles.line, styles.lineLg, { backgroundColor: colors.disabled }]} />
            <View style={[styles.line, styles.lineLg, { backgroundColor: colors.disabled }]} />
          </Animated.View>
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  list: { paddingTop: sizes.spacing.sm },
  row: {
    flexDirection: 'row',
    paddingRight: sizes.spacing.lg,
    paddingLeft: sizes.spacing.md,
  },
  timelineLeft: {
    width: 24,
    alignItems: 'center',
    paddingTop: sizes.spacing.md + 4,
  },
  timelineDot: { width: 8, height: 8, borderRadius: 4 },
  timelineLine: { width: 2, flex: 1, marginTop: 4, borderRadius: 1 },
  card: {
    flex: 1,
    marginTop: sizes.spacing.md,
    borderRadius: sizes.radius.xxl,
    padding: sizes.spacing.lg,
    gap: sizes.spacing.sm,
  },
  line: { height: 12, borderRadius: 6 },
  lineSm: { width: '30%' },
  lineMd: { width: '60%' },
  lineLg: { width: '100%' },
});
