import React, { useMemo, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LineChart } from 'react-native-chart-kit';
import { useTranslation } from 'react-i18next';
import { useTheme, sizes, fontFamily } from '@/shared/theme';
import { getEmotionColor } from '@/shared/components/EmotionSlider';
import { useCheckinHistory } from '@/features/checkin/hooks/useCheckin';
import { useAuthStore } from '@/features/auth/store/authStore';

const SCREEN_WIDTH = Dimensions.get('window').width;

type Period = '7d' | '1m' | '3m' | 'all';

const PERIOD_KEYS: Record<Period, string> = {
  '7d': 'period_7d',
  '1m': 'period_1m',
  '3m': 'period_3m',
  all: 'period_all',
};

const toLocalDateStr = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

const getStartDate = (period: Period): string | undefined => {
  if (period === 'all') return undefined;
  const d = new Date();
  if (period === '7d') d.setDate(d.getDate() - 6);
  else if (period === '1m') d.setMonth(d.getMonth() - 1);
  else if (period === '3m') d.setMonth(d.getMonth() - 3);
  return toLocalDateStr(d);
};

const formatLabel = (dateStr: string) => {
  const [, mo, da] = dateStr.split('-');
  return `${Number(mo)}/${Number(da)}`;
};

export const EmotionGraph: React.FC = () => {
  const { colors } = useTheme();
  const { t } = useTranslation('checkin');
  const plan = useAuthStore((s) => s.user?.plan);
  const isPremium = plan === 'PREMIUM';
  const [period, setPeriod] = useState<Period>('7d');

  const startDate = getStartDate(period);
  const endDate = toLocalDateStr(new Date());
  const { data: history } = useCheckinHistory(startDate, endDate);

  const checkins = history?.content ?? [];

  const sorted = useMemo(
    () => [...checkins].sort((a, b) => a.checkedAt.localeCompare(b.checkedAt)),
    [checkins]
  );

  const maxLabels = 7;
  const labelInterval = Math.max(1, Math.ceil(sorted.length / maxLabels));

  const labels = sorted.map((c, i) => (i % labelInterval === 0 ? formatLabel(c.checkedAt) : ''));
  const scores = sorted.map((c) => c.emotionScore);

  const avgScore = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 5;
  const avgColor = getEmotionColor(Math.round(avgScore));

  return (
    <View style={[styles.container, { backgroundColor: colors.surface }]}>
      <View style={styles.periodRow}>
        {(['7d', '1m', '3m', 'all'] as Period[]).map((p) => {
          const locked = !isPremium && p !== '7d' && p !== '1m';
          const isActive = period === p;
          return (
            <TouchableOpacity
              key={p}
              style={[styles.periodBtn, { backgroundColor: colors.background }, isActive && { backgroundColor: colors.primaryLight + '25' }]}
              onPress={() => !locked && setPeriod(p)}
              activeOpacity={locked ? 1 : 0.7}
            >
              <View style={styles.periodBtnInner}>
                <Text
                  style={[
                    styles.periodBtnText,
                    { color: colors.textSub },
                    isActive && { color: colors.primary, fontFamily: fontFamily.bold },
                    locked && { color: colors.textDisabled },
                  ]}
                >
                  {t(PERIOD_KEYS[p])}
                </Text>
                {locked && (
                  <Ionicons name="lock-closed" size={10} color={colors.textDisabled} />
                )}
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      {sorted.length === 0 ? (
        <View style={styles.emptyInner}>
          <Text style={[styles.emptyText, { color: colors.textSub }]}>{t('graph_empty')}</Text>
          <Text style={[styles.emptySubText, { color: colors.textDisabled }]}>{t('graph_empty_desc')}</Text>
        </View>
      ) : (
        <>
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
          labelColor: () => colors.textSub,
          propsForDots: {
            r: '4',
            strokeWidth: '2',
            stroke: avgColor,
          },
          propsForBackgroundLines: {
            stroke: colors.divider,
            strokeDasharray: '4 4',
          },
          style: { borderRadius: sizes.radius.md },
        }}
        bezier
        style={styles.chart}
        withInnerLines
        withOuterLines={false}
      />

          <View style={styles.avgRow}>
            <View style={[styles.avgDot, { backgroundColor: avgColor }]} />
            <Text style={[styles.avgText, { color: colors.text }]}>
              {t('avg_score', { score: avgScore.toFixed(1) })}
            </Text>
            <Text style={[styles.avgCount, { color: colors.textSub }]}>{t('days_recorded', { count: sorted.length })}</Text>
          </View>
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
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
    alignItems: 'center',
  },
  periodBtnInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  periodBtnText: {
    fontSize: sizes.font.xs,
    fontFamily: fontFamily.medium,
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
    fontFamily: fontFamily.semibold,
  },
  avgCount: {
    fontSize: sizes.font.xs,
  },
  emptyInner: {
    paddingVertical: sizes.spacing.xl,
    alignItems: 'center',
    gap: sizes.spacing.xs,
  },
  emptyText: {
    fontSize: sizes.font.md,
    fontFamily: fontFamily.semibold,
  },
  emptySubText: {
    fontSize: sizes.font.sm,
  },
});
