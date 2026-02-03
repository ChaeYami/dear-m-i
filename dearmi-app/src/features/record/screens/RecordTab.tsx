import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SectionList,
  ActivityIndicator,
  
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { CompositeNavigationProp } from '@react-navigation/native';
import { colors, sizes } from '@/constants';
import { useTimeline } from '@/features/record/hooks/useRecord';
import { getEmotionColor } from '@/shared/components/EmotionSlider';
import { LoadingSpinner } from '@/shared/components/LoadingSpinner';
import { useAuthStore } from '@/features/auth/store/authStore';
import type { RecordStackParamList } from '@/navigation/RecordNavigator';
import type { RootStackParamList } from '@/navigation/RootNavigator';
import type { TimelineItem, TimelineRecord, TimelinePrescription } from '@/shared/types/domain.types';

type Nav = CompositeNavigationProp<
  StackNavigationProp<RecordStackParamList, 'RecordTab'>,
  StackNavigationProp<RootStackParamList>
>;

interface Section {
  title: string;
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
    <View style={styles.prescriptionMedRow}>
      <Ionicons name="medical-outline" size={16} color={colors.text} />
      <Text style={styles.prescriptionMedCount}>약품 {item.medicationCount}종</Text>
    </View>
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

export const RecordTab: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const isPremium = useAuthStore((s) => s.user?.plan === 'PREMIUM');
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
      <View style={styles.header}>
        <Text style={styles.headerTitle}>진료 기록</Text>
      </View>

      {!isPremium && (
        <View style={styles.freeBanner}>
          <View style={styles.freeBannerLeft}>
            <Ionicons name="lock-closed-outline" size={14} color={colors.text} />
            <Text style={styles.freeBannerText}>
              무료 플랜은 최근 2개월 기록만 조회됩니다.
            </Text>
          </View>
          <TouchableOpacity onPress={() => navigation.navigate('Paywall')} hitSlop={8}>
            <Text style={styles.freeBannerUpgrade}>업그레이드</Text>
          </TouchableOpacity>
        </View>
      )}

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

      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('RecordForm', undefined)}
        activeOpacity={0.85}
      >
        <Ionicons name="add" size={28} color={colors.textInverse} />
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
  },
  headerTitle: {
    fontSize: sizes.font.xl,
    fontWeight: sizes.fontWeight.bold,
    color: colors.text,
  },
  freeBanner: {
    backgroundColor: colors.warningLight,
    paddingHorizontal: sizes.spacing.lg,
    paddingVertical: sizes.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.warning + '30',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  freeBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: sizes.spacing.xs,
    flex: 1,
  },
  freeBannerText: {
    fontSize: sizes.font.sm,
    color: colors.text,
    flex: 1,
  },
  freeBannerUpgrade: {
    fontSize: sizes.font.sm,
    fontWeight: sizes.fontWeight.bold,
    color: colors.primary,
    marginLeft: sizes.spacing.sm,
  },
  listContent: { paddingBottom: sizes.tabBarSafeBottom + 20 },
  emptyContainer: { flexGrow: 1 },
  sectionHeader: {
    paddingHorizontal: sizes.spacing.lg,
    paddingVertical: sizes.spacing.sm,
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  sectionHeaderText: {
    fontSize: sizes.font.sm,
    fontWeight: sizes.fontWeight.semibold,
    color: colors.textSub,
  },
  card: {
    backgroundColor: colors.surfaceSolid,
    marginHorizontal: sizes.spacing.lg,
    marginTop: sizes.spacing.md,
    borderRadius: sizes.radius.xl,
    padding: sizes.spacing.md,
    gap: sizes.spacing.sm,
    shadowColor: colors.glassShadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 2,
  },
  prescriptionCard: {
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
    height: 6,
    backgroundColor: colors.disabled,
    borderRadius: 3,
    overflow: 'hidden',
  },
  emotionBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  cardContent: {
    fontSize: sizes.font.sm,
    color: colors.text,
    lineHeight: 20,
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: sizes.spacing.xs,
  },
  tag: {
    backgroundColor: colors.primaryLight + '25',
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
    backgroundColor: colors.secondaryLight + '30',
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
  prescriptionMedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: sizes.spacing.xs,
  },
  prescriptionMedCount: {
    fontSize: sizes.font.md,
    color: colors.text,
  },
  prescriptionDate: {
    fontSize: sizes.font.sm,
    color: colors.textSub,
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
    color: colors.textSub,
  },
  emptySubText: {
    fontSize: sizes.font.sm,
    color: colors.textDisabled,
  },
  fab: {
    position: 'absolute',
    bottom: sizes.tabBarSafeBottom + sizes.spacing.md,
    right: sizes.spacing.xl,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.glassShadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 8,
  },
});
