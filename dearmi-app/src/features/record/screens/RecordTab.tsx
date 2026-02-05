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
import { useTheme, sizes, fontFamily } from '@/shared/theme';
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

const RecordCard: React.FC<{ item: TimelineRecord }> = ({ item }) => {
  const { colors } = useTheme();
  return (
    <View style={[styles.card, { backgroundColor: colors.surface, shadowColor: colors.glassShadow }]}>
      <View style={styles.cardHeader}>
        {item.hospitalName && (
          <Text style={[styles.cardHospital, { color: colors.primary }]}>{item.hospitalName}</Text>
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

      <Text style={[styles.cardContent, { color: colors.text }]} numberOfLines={3}>
        {item.content}
      </Text>

      {item.tags && item.tags.length > 0 && (
        <View style={styles.tagRow}>
          {item.tags.map((tag) => (
            <View key={tag} style={[styles.tag, { backgroundColor: colors.primaryLight + '25' }]}>
              <Text style={[styles.tagText, { color: colors.primary }]}>#{tag}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
};

const PrescriptionCard: React.FC<{ item: TimelinePrescription }> = ({ item }) => {
  const { colors } = useTheme();
  return (
    <View style={[styles.card, styles.prescriptionCard, { backgroundColor: colors.surface, shadowColor: colors.glassShadow, borderLeftColor: colors.secondary }]}>
      <View style={styles.cardHeader}>
        <View style={[styles.prescriptionBadge, { backgroundColor: colors.secondaryLight + '30' }]}>
          <Text style={[styles.prescriptionBadgeText, { color: colors.secondary }]}>처방전</Text>
        </View>
        {item.hospitalName && (
          <Text style={[styles.cardHospital, { color: colors.primary }]}>{item.hospitalName}</Text>
        )}
      </View>
      <View style={styles.prescriptionMedRow}>
        <Ionicons name="medical-outline" size={16} color={colors.text} />
        <Text style={[styles.prescriptionMedCount, { color: colors.text }]}>약품 {item.medicationCount}종</Text>
      </View>
      {item.prescribedAt && (
        <Text style={[styles.prescriptionDate, { color: colors.textSub }]}>
          처방일: {item.prescribedAt.split('T')[0]}
        </Text>
      )}
    </View>
  );
};

const EmotionBar: React.FC<{ score: number }> = ({ score }) => {
  const { colors } = useTheme();
  return (
    <View style={[styles.emotionBarBg, { backgroundColor: colors.disabled }]}>
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
};

export const RecordTab: React.FC = () => {
  const { colors } = useTheme();
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
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>진료 기록</Text>
        <TouchableOpacity
          style={[styles.prescriptionBtn, { backgroundColor: colors.primary }]}
          onPress={() => navigation.navigate('PrescriptionList' as any)}
          activeOpacity={0.8}
        >
          <Ionicons name="medkit-outline" size={16} color={colors.textInverse} />
          <Text style={[styles.prescriptionBtnText, { color: colors.textInverse }]}>처방 목록</Text>
        </TouchableOpacity>
      </View>

      {!isPremium && (
        <View style={[styles.freeBanner, { backgroundColor: colors.warningLight, borderBottomColor: colors.warning + '30' }]}>
          <View style={styles.freeBannerLeft}>
            <Ionicons name="lock-closed-outline" size={14} color={colors.text} />
            <Text style={[styles.freeBannerText, { color: colors.text }]}>
              무료 플랜은 최근 2개월 기록만 조회됩니다.
            </Text>
          </View>
          <TouchableOpacity onPress={() => navigation.navigate('Paywall')} hitSlop={8}>
            <Text style={[styles.freeBannerUpgrade, { color: colors.primary }]}>업그레이드</Text>
          </TouchableOpacity>
        </View>
      )}

      <SectionList
        sections={sections}
        keyExtractor={(item) => `${item.type}-${item.id}`}
        renderSectionHeader={({ section }) => (
          <View style={[styles.sectionHeader, { backgroundColor: colors.background, borderBottomColor: colors.divider }]}>
            <Text style={[styles.sectionHeaderText, { color: colors.textSub }]}>
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
            <Text style={[styles.emptyText, { color: colors.textSub }]}>아직 기록이 없어요</Text>
            <Text style={[styles.emptySubText, { color: colors.textDisabled }]}>진료 후 기록을 남겨보세요</Text>
          </View>
        }
        contentContainerStyle={sections.length === 0 ? styles.emptyContainer : styles.listContent}
        stickySectionHeadersEnabled
      />

      <TouchableOpacity
        style={[styles.fab, { backgroundColor: colors.primary, shadowColor: colors.glassShadow }]}
        onPress={() => navigation.navigate('RecordForm', undefined)}
        activeOpacity={0.85}
      >
        <Ionicons name="add" size={28} color={colors.textInverse} />
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    height: sizes.headerHeight,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: sizes.spacing.lg,
  },
  prescriptionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: sizes.spacing.md,
    paddingVertical: sizes.spacing.xs + 2,
    borderRadius: sizes.radius.full,
  },
  prescriptionBtnText: {
    fontSize: sizes.font.sm,
    fontFamily: fontFamily.semibold,
  },
  headerTitle: {
    fontSize: sizes.font.xl,
    fontFamily: fontFamily.bold,
  },
  freeBanner: {
    paddingHorizontal: sizes.spacing.lg,
    paddingVertical: sizes.spacing.sm,
    borderBottomWidth: 1,
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
    flex: 1,
  },
  freeBannerUpgrade: {
    fontSize: sizes.font.sm,
    fontFamily: fontFamily.bold,
    marginLeft: sizes.spacing.sm,
  },
  listContent: { paddingBottom: sizes.tabBarSafeBottom + 20 },
  emptyContainer: { flexGrow: 1 },
  sectionHeader: {
    paddingHorizontal: sizes.spacing.lg,
    paddingVertical: sizes.spacing.sm,
    borderBottomWidth: 1,
  },
  sectionHeaderText: {
    fontSize: sizes.font.sm,
    fontFamily: fontFamily.semibold,
  },
  card: {
    marginHorizontal: sizes.spacing.lg,
    marginTop: sizes.spacing.md,
    borderRadius: sizes.radius.xl,
    padding: sizes.spacing.md,
    gap: sizes.spacing.sm,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 2,
  },
  prescriptionCard: {
    borderLeftWidth: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardHospital: {
    fontSize: sizes.font.sm,
    fontFamily: fontFamily.semibold,
    flex: 1,
  },
  emotionBadge: {
    paddingHorizontal: sizes.spacing.sm,
    paddingVertical: 2,
    borderRadius: sizes.radius.full,
  },
  emotionScore: {
    fontSize: sizes.font.xs,
    fontFamily: fontFamily.bold,
  },
  emotionBarBg: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  emotionBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  cardContent: {
    fontSize: sizes.font.sm,
    lineHeight: 20,
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
  },
  tagText: {
    fontSize: sizes.font.xs,
    fontFamily: fontFamily.medium,
  },
  prescriptionBadge: {
    paddingHorizontal: sizes.spacing.sm,
    paddingVertical: 2,
    borderRadius: sizes.radius.full,
    marginRight: sizes.spacing.sm,
  },
  prescriptionBadgeText: {
    fontSize: sizes.font.xs,
    fontFamily: fontFamily.semibold,
  },
  prescriptionMedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: sizes.spacing.xs,
  },
  prescriptionMedCount: {
    fontSize: sizes.font.md,
  },
  prescriptionDate: {
    fontSize: sizes.font.sm,
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
    fontFamily: fontFamily.semibold,
  },
  emptySubText: {
    fontSize: sizes.font.sm,
  },
  fab: {
    position: 'absolute',
    bottom: sizes.tabBarSafeBottom + sizes.spacing.md,
    right: sizes.spacing.xl,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 8,
  },
});
