import React, { useMemo, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { colors, sizes } from '@/constants';
import { getEmotionColor } from '@/shared/components/EmotionSlider';
import { useCheckinHistory } from '@/features/checkin/hooks/useCheckin';
import { useAuthStore } from '@/features/auth/store/authStore';

const SCREEN_WIDTH = Dimensions.get('window').width;

type Period = '7d' | '1m' | '3m' | 'all';

const PERIOD_LABELS: Record<Period, string> = {
  '7d': '7일',
  '1m': '1개월',
  '3m': '3개월',
  all: '전체',
};

const getStartDate = (period: Period): string | undefined => {
  if (period === 'all') return undefined;
  const d = new Date();
  if (period === '7d') d.setDate(d.getDate() - 6);
  else if (period === '1m') d.setMonth(d.getMonth() - 1);
  else if (period === '3m') d.setMonth(d.getMonth() - 3);
  return d.toISOString().split('T')[0];
};

const formatLabel = (dateStr: string) => {
  const d = new Date(dateStr);
  return `${d.getMonth() + 1}/${d.getDate()}`;
};

export const EmotionGraph: React.FC = () => {
  const plan = useAuthStore((s) => s.user?.plan);
  const isPremium = plan === 'PREMIUM';
  const [period, setPeriod] = useState<Period>('7d');

  const startDate = getStartDate(period);
  const endDate = new Date().toISOString().split('T')[0];
  const { data: history } = useCheckinHistory(startDate, endDate);

  const checkins = history?.content ?? [];

  // 날짜순 정렬 (오래된 순)
  const sorted = useMemo(
    () => [...checkins].sort((a, b) => a.checkedAt.localeCompare(b.checkedAt)),
    [checkins]
  );

  // 라벨 간격 조절: 데이터 개수에 따라 표시할 라벨 수 제한
  const maxLabels = 7;
  const labelInterval = Math.max(1, Math.ceil(sorted.length / maxLabels));

  const labels = sorted.map((c, i) => (i % labelInterval === 0 ? formatLabel(c.checkedAt) : ''));
  const scores = sorted.map((c) => c.emotionScore);

  // 평균 점수 색상
  const avgScore = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 5;
  const avgColor = getEmotionColor(Math.round(avgScore));

  if (sorted.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>아직 기록이 없어요</Text>
        <Text style={styles.emptySubText}>체크인을 시작하면 감정 그래프가 나타납니다</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* 기간 선택 */}
      <View style={styles.periodRow}>
        {(['7d', '1m', '3m', 'all'] as Period[]).map((p) => {
          const locked = !isPremium && p !== '7d' && p !== '1m';
          const isActive = period === p;
          return (
            <TouchableOpacity
              key={p}
              style={[styles.periodBtn, isActive && styles.periodBtnActive]}
              onPress={() => !locked && setPeriod(p)}
              activeOpacity={locked ? 1 : 0.7}
            >
              <Text
                style={[
                  styles.periodBtnText,
                  isActive && styles.periodBtnTextActive,
                  locked && styles.periodBtnTextLocked,
                ]}
              >
                {PERIOD_LABELS[p]}
                {locked ? ' 🔒' : ''}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* 차트 */}
      <LineChart
        data={{
          labels,
          datasets: [{ data: scores.length > 0 ? scores : [5] }],
        }}
        width={SCREEN_WIDTH - sizes.spacing.lg * 2 - sizes.spacing.md * 2}
        height={180}
        yAxisSuffix=""
        yAxisInterval={1}
        fromZero={false}
        segments={4}
        chartConfig={{
          backgroundColor: colors.surface,
          backgroundGradientFrom: colors.surface,
          backgroundGradientTo: colors.surface,
          decimalPlaces: 0,
          color: () => avgColor,
          labelColor: () => colors.text.secondary,
          propsForDots: {
            r: '4',
            strokeWidth: '2',
            stroke: avgColor,
          },
          propsForBackgroundLines: {
            stroke: colors.border,
            strokeDasharray: '4 4',
          },
          style: { borderRadius: sizes.radius.md },
        }}
        bezier
        style={styles.chart}
        withInnerLines
        withOuterLines={false}
      />

      {/* 평균 정보 */}
      <View style={styles.avgRow}>
        <View style={[styles.avgDot, { backgroundColor: avgColor }]} />
        <Text style={styles.avgText}>
          평균 {avgScore.toFixed(1)}점
        </Text>
        <Text style={styles.avgCount}>{sorted.length}일 기록</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: sizes.radius.lg,
    padding: sizes.spacing.md,
    gap: sizes.spacing.md,
  },
  periodRow: {
    flexDirection: 'row',
    gap: sizes.spacing.xs,
  },
  periodBtn: {
    flex: 1,
    paddingVertical: 6,
    borderRadius: sizes.radius.full,
    backgroundColor: colors.background,
    alignItems: 'center',
  },
  periodBtnActive: {
    backgroundColor: colors.primary + '15',
  },
  periodBtnText: {
    fontSize: sizes.font.xs,
    color: colors.text.secondary,
    fontWeight: sizes.fontWeight.medium,
  },
  periodBtnTextActive: {
    color: colors.primary,
    fontWeight: sizes.fontWeight.bold,
  },
  periodBtnTextLocked: {
    color: colors.text.disabled,
  },
  chart: {
    borderRadius: sizes.radius.md,
    marginLeft: -sizes.spacing.md,
  },
  avgRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: sizes.spacing.sm,
  },
  avgDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  avgText: {
    fontSize: sizes.font.sm,
    fontWeight: sizes.fontWeight.semibold,
    color: colors.text.primary,
  },
  avgCount: {
    fontSize: sizes.font.xs,
    color: colors.text.secondary,
  },
  emptyContainer: {
    backgroundColor: colors.surface,
    borderRadius: sizes.radius.lg,
    padding: sizes.spacing.xl,
    alignItems: 'center',
    gap: sizes.spacing.xs,
  },
  emptyText: {
    fontSize: sizes.font.md,
    fontWeight: sizes.fontWeight.semibold,
    color: colors.text.secondary,
  },
  emptySubText: {
    fontSize: sizes.font.sm,
    color: colors.text.disabled,
  },
});
