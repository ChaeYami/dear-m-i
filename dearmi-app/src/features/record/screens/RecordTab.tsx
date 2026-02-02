import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SectionList,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { colors, sizes } from '@/constants';
import { useTimeline } from '@/features/record/hooks/useRecord';
import { getEmotionColor } from '@/shared/components/EmotionSlider';
import { LoadingSpinner } from '@/shared/components/LoadingSpinner';
import type { RecordStackParamList } from '@/navigation/RecordNavigator';
import type { TimelineItem, TimelineRecord, TimelinePrescription } from '@/shared/types/domain.types';

type Nav = StackNavigationProp<RecordStackParamList, 'RecordTab'>;

// ─── 날짜별 섹션 그룹핑 ──────────────────────────────────────────────────────

interface Section {
  title: string; // YYYY-MM-DD
  data: TimelineItem[];
}

const formatSectionTitle = (dateStr: string): string => {
  const d = new Date(dateStr);
  return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일`;
};

const toSections = (items: TimelineItem[]): Section[] => {
  const map = new Map<string, TimelineItem[]>();
  items.forEach((item) => {
    const date = item.createdAt.split('T')[0];
    if (!map.has(date)) map.set(date, []);
    map.get(date)!.push(item);
  });
  return Array.from(map.entries()).map(([title, data]) => ({ title, data }));
};

// ─── 카드 컴포넌트 ───────────────────────────────────────────────────────────

const RecordCard: React.FC<{ item: TimelineRecord }> = ({ item }) => (
  <View style={styles.card}>
    <View style={styles.cardHeader}>
      {item.hospitalName && (
        <Text style={styles.cardHospital}>{item.hospitalName}</Text>
      )}
      {item.emotionScore !== undefined && (
        <View style={[styles.emotionBadge, { backgroundColor: getEmotionColor(item.emotionScore) + '22' }]}>
          <Text style={[styles.emotionScore, { color: getEmotionColor(item.emotionScore) }]}>
            {item.emotionScore}점
          </Text>
        </View>
      )}
    </View>

    {item.emotionScore !== undefined && (
      <EmotionBar score={item.emotionScore} />
    )}

    <Text style={styles.cardContent} numberOfLines={3}>
      {item.content}
    </Text>

    {item.tags && item.tags.length > 0 && (
      <View style={styles.tagRow}>
        {item.tags.map((tag) => (
          <View key={tag} style={styles.tag}>
            <Text style={styles.tagText}>#{tag}</Text>
          </View>
        ))}
      </View>
    )}
  </View>
);

const PrescriptionCard: React.FC<{ item: TimelinePrescription }> = ({ item }) => (
  <View style={[styles.card, styles.prescriptionCard]}>
    <View style={styles.cardHeader}>
      <View style={styles.prescriptionBadge}>
        <Text style={styles.prescriptionBadgeText}>처방전</Text>
      </View>
      {item.hospitalName && (
        <Text style={styles.cardHospital}>{item.hospitalName}</Text>
      )}
    </View>
    <Text style={styles.prescriptionMedCount}>
      💊 약품 {item.medicationCount}종
    </Text>
    {item.prescribedAt && (
      <Text style={styles.prescriptionDate}>
        처방일: {item.prescribedAt.split('T')[0]}
      </Text>
    )}
  </View>
);

const EmotionBar: React.FC<{ score: number }> = ({ score }) => (
  <View style={styles.emotionBarBg}>
    <View
      style={[
        styles.emotionBarFill,
        {
          width: `${score * 10}%` as any,
          backgroundColor: getEmotionColor(score),
        },
      ]}
    />
  </View>
);

// ─── 메인 화면 ───────────────────────────────────────────────────────────────

export const RecordTab: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
  } = useTimeline();

  const sections = useMemo(() => {
    const allItems = data?.pages.flatMap((p) => p.items) ?? [];
    return toSections(allItems);
  }, [data]);

  const handleEndReached = () => {
    if (hasNextPage && !isFetchingNextPage) fetchNextPage();
  };

  if (isLoading) return <LoadingSpinner fullscreen />;

  return (
    <SafeAreaView style={styles.container}>
      {/* 헤더 */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>진료 기록</Text>
      </View>

      <SectionList
        sections={sections}
        keyExtractor={(item) => `${item.type}-${item.id}`}
        renderSectionHeader={({ section }) => (
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionHeaderText}>
              {formatSectionTitle(section.title)}
            </Text>
          </View>
        )}
        renderItem={({ item }) =>
          item.type === 'record' ? (
            <RecordCard item={item as TimelineRecord} />
          ) : (
            <PrescriptionCard item={item as TimelinePrescription} />
          )
        }
        onEndReached={handleEndReached}
        onEndReachedThreshold={0.3}
        ListFooterComponent={
          isFetchingNextPage ? (
            <ActivityIndicator
              color={colors.primary}
              style={styles.footerSpinner}
            />
          ) : null
        }
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <Text style={styles.emptyText}>아직 기록이 없어요</Text>
            <Text style={styles.emptySubText}>진료 후 기록을 남겨보세요</Text>
          </View>
        }
        contentContainerStyle={sections.length === 0 ? styles.emptyContainer : styles.listContent}
        stickySectionHeadersEnabled
      />

      {/* FAB */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('RecordForm', undefined)}
        activeOpacity={0.85}
      >
        <Text style={styles.fabIcon}>+</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    height: sizes.headerHeight,
    justifyContent: 'center',
    paddingHorizontal: sizes.spacing.lg,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    fontSize: sizes.font.xl,
    fontWeight: sizes.fontWeight.bold,
    color: colors.text.primary,
  },
  listContent: { paddingBottom: 80 },
  emptyContainer: { flexGrow: 1 },
  sectionHeader: {
    paddingHorizontal: sizes.spacing.lg,
    paddingVertical: sizes.spacing.sm,
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  sectionHeaderText: {
    fontSize: sizes.font.sm,
    fontWeight: sizes.fontWeight.semibold,
    color: colors.text.secondary,
  },
  card: {
    backgroundColor: colors.surface,
    marginHorizontal: sizes.spacing.lg,
    marginTop: sizes.spacing.md,
    borderRadius: sizes.radius.lg,
    padding: sizes.spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    gap: sizes.spacing.sm,
  },
  prescriptionCard: {
    borderColor: colors.secondary + '55',
    borderLeftWidth: 3,
    borderLeftColor: colors.secondary,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardHospital: {
    fontSize: sizes.font.sm,
    fontWeight: sizes.fontWeight.semibold,
    color: colors.primary,
    flex: 1,
  },
  emotionBadge: {
    paddingHorizontal: sizes.spacing.sm,
    paddingVertical: 2,
    borderRadius: sizes.radius.full,
  },
  emotionScore: {
    fontSize: sizes.font.xs,
    fontWeight: sizes.fontWeight.bold,
  },
  emotionBarBg: {
    height: 4,
    backgroundColor: colors.border,
    borderRadius: 2,
    overflow: 'hidden',
  },
  emotionBarFill: {
    height: '100%',
    borderRadius: 2,
  },
  cardContent: {
    fontSize: sizes.font.sm,
    color: colors.text.primary,
    lineHeight: 20,
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: sizes.spacing.xs,
  },
  tag: {
    backgroundColor: colors.primary + '15',
    paddingHorizontal: sizes.spacing.sm,
    paddingVertical: 2,
    borderRadius: sizes.radius.full,
  },
  tagText: {
    fontSize: sizes.font.xs,
    color: colors.primary,
    fontWeight: sizes.fontWeight.medium,
  },
  prescriptionBadge: {
    backgroundColor: colors.secondary + '20',
    paddingHorizontal: sizes.spacing.sm,
    paddingVertical: 2,
    borderRadius: sizes.radius.full,
    marginRight: sizes.spacing.sm,
  },
  prescriptionBadgeText: {
    fontSize: sizes.font.xs,
    color: colors.secondary,
    fontWeight: sizes.fontWeight.semibold,
  },
  prescriptionMedCount: {
    fontSize: sizes.font.md,
    color: colors.text.primary,
  },
  prescriptionDate: {
    fontSize: sizes.font.sm,
    color: colors.text.secondary,
  },
  footerSpinner: { marginVertical: sizes.spacing.lg },
  emptyWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: sizes.spacing.sm,
    paddingTop: 120,
  },
  emptyText: {
    fontSize: sizes.font.lg,
    fontWeight: sizes.fontWeight.semibold,
    color: colors.text.secondary,
  },
  emptySubText: {
    fontSize: sizes.font.sm,
    color: colors.text.disabled,
  },
  fab: {
    position: 'absolute',
    bottom: sizes.spacing.xl,
    right: sizes.spacing.xl,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 8,
  },
  fabIcon: {
    fontSize: 28,
    color: colors.text.onPrimary,
    lineHeight: 32,
  },
});
