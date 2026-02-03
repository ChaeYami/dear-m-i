import React, { useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  SectionList,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { CompositeNavigationProp } from '@react-navigation/native';
import { colors, sizes } from '@/constants';
import { getEmotionColor, getEmotionLabel } from '@/shared/components/EmotionSlider';
import { useCheckinHistory } from '@/features/checkin/hooks/useCheckin';
import { useAuthStore } from '@/features/auth/store/authStore';
import { LoadingSpinner } from '@/shared/components/LoadingSpinner';
import type { CheckinStackParamList } from '@/navigation/CheckinNavigator';
import type { RootStackParamList } from '@/navigation/RootNavigator';
import type { DailyCheckin } from '@/shared/types/domain.types';

type Nav = CompositeNavigationProp<
  StackNavigationProp<CheckinStackParamList, 'CheckinHistory'>,
  StackNavigationProp<RootStackParamList>
>;

interface Section {
  title: string;
  data: DailyCheckin[];
}

const formatSectionDate = (dateStr: string) => {
  const d = new Date(dateStr);
  return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일`;
};

export const CheckinHistoryScreen: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const plan = useAuthStore((s) => s.user?.plan);
  const isFree = plan === 'FREE' || !plan;

  const { data: history, isLoading } = useCheckinHistory();

  const sections = useMemo<Section[]>(() => {
    if (!history?.content) return [];
    return history.content.map((checkin) => ({
      title: formatSectionDate(checkin.checkedAt),
      data: [checkin],
    }));
  }, [history]);

  if (isLoading) return <LoadingSpinner fullscreen />;

  return (
    <SafeAreaView style={styles.container}>
      {/* 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={12}>
          <Text style={styles.backBtn}>{'<  뒤로'}</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>전체 기록</Text>
        <View style={{ width: 48 }} />
      </View>

      {/* FREE 배너 */}
      {isFree && (
        <View style={styles.freeBanner}>
          <Text style={styles.freeBannerText}>
            무료 플랜은 최근 30일 기록만 조회됩니다.
          </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Paywall')} hitSlop={8}>
            <Text style={styles.freeBannerUpgrade}>업그레이드</Text>
          </TouchableOpacity>
        </View>
      )}

      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        contentContainerStyle={sections.length === 0 ? styles.emptyContainer : styles.listContent}
        stickySectionHeadersEnabled
        renderSectionHeader={({ section }) => (
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionDate}>{section.title}</Text>
          </View>
        )}
        renderItem={({ item }) => (
          <View style={styles.card}>
            {/* 감정 점수 */}
            <View style={styles.cardTop}>
              <View
                style={[styles.scoreBadge, { backgroundColor: getEmotionColor(item.emotionScore) }]}
              >
                <Text style={styles.scoreBadgeText}>{item.emotionScore}</Text>
              </View>
              <Text style={[styles.scoreLabel, { color: getEmotionColor(item.emotionScore) }]}>
                {getEmotionLabel(item.emotionScore)}
              </Text>
            </View>

            {/* 트리거 태그 */}
            {item.triggerTags && item.triggerTags.length > 0 && (
              <View style={styles.tagRow}>
                {item.triggerTags.map((tag) => (
                  <View key={tag} style={styles.tag}>
                    <Text style={styles.tagText}>{tag}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* 메모 */}
            {item.memo && (
              <Text style={styles.memo} numberOfLines={3}>
                {item.memo}
              </Text>
            )}

            {/* 수면 + 복약 */}
            <View style={styles.metaRow}>
              {item.sleepHours != null && (
                <Text style={styles.metaItem}>수면 {item.sleepHours}h</Text>
              )}
              {item.tookMedication != null && (
                <Text style={styles.metaItem}>
                  약 {item.tookMedication ? '복용' : '미복용'}
                </Text>
              )}
            </View>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <Text style={styles.emptyText}>아직 기록이 없어요</Text>
            <Text style={styles.emptySubText}>홈에서 오늘의 기분을 기록해 보세요</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    height: sizes.headerHeight,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: sizes.spacing.lg,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backBtn: {
    fontSize: sizes.font.md,
    color: colors.primary,
    fontWeight: sizes.fontWeight.medium,
    width: 48,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: sizes.font.lg,
    fontWeight: sizes.fontWeight.bold,
    color: colors.text.primary,
  },
  freeBanner: {
    backgroundColor: colors.warningLight,
    paddingHorizontal: sizes.spacing.lg,
    paddingVertical: sizes.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.warning + '44',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  freeBannerText: {
    fontSize: sizes.font.sm,
    color: '#92400E',
    flex: 1,
  },
  freeBannerUpgrade: {
    fontSize: sizes.font.sm,
    fontWeight: sizes.fontWeight.bold,
    color: colors.primary,
    marginLeft: sizes.spacing.sm,
  },
  listContent: { paddingBottom: 40 },
  emptyContainer: { flexGrow: 1 },
  sectionHeader: {
    paddingHorizontal: sizes.spacing.lg,
    paddingVertical: sizes.spacing.sm,
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  sectionDate: {
    fontSize: sizes.font.sm,
    fontWeight: sizes.fontWeight.semibold,
    color: colors.text.primary,
  },
  card: {
    backgroundColor: colors.surface,
    marginHorizontal: sizes.spacing.lg,
    marginTop: sizes.spacing.sm,
    borderRadius: sizes.radius.md,
    padding: sizes.spacing.md,
    gap: sizes.spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: sizes.spacing.sm,
  },
  scoreBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreBadgeText: {
    fontSize: sizes.font.sm,
    fontWeight: sizes.fontWeight.bold,
    color: '#FFFFFF',
  },
  scoreLabel: {
    fontSize: sizes.font.md,
    fontWeight: sizes.fontWeight.semibold,
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: sizes.spacing.xs,
  },
  tag: {
    paddingHorizontal: sizes.spacing.sm,
    paddingVertical: 2,
    borderRadius: sizes.radius.full,
    backgroundColor: colors.primary + '12',
  },
  tagText: {
    fontSize: sizes.font.xs,
    color: colors.primary,
    fontWeight: sizes.fontWeight.medium,
  },
  memo: {
    fontSize: sizes.font.sm,
    color: colors.text.secondary,
    lineHeight: 20,
  },
  metaRow: {
    flexDirection: 'row',
    gap: sizes.spacing.md,
  },
  metaItem: {
    fontSize: sizes.font.xs,
    color: colors.text.disabled,
  },
  emptyWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 100,
    gap: sizes.spacing.sm,
  },
  emptyText: {
    fontSize: sizes.font.lg,
    fontWeight: sizes.fontWeight.semibold,
    color: colors.text.secondary,
  },
  emptySubText: { fontSize: sizes.font.sm, color: colors.text.disabled },
});
