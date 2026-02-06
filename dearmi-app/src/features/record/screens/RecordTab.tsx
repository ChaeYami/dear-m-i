import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { CompositeNavigationProp } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import { useTheme, sizes, fontFamily } from '@/shared/theme';
import { softShadow } from '@/shared/theme/shadows';
import { AnimatedPressable } from '@/shared/components/AnimatedPressable';
import { ScreenHeader } from '@/shared/components/ScreenHeader';
import { useResetStackOnTabFocus } from '@/shared/hooks/useResetStackOnTabFocus';
import { useTabBarSafeBottom } from '@/shared/hooks/useTabBarSafeBottom';
import { useTabBarScrollHide } from '@/shared/hooks/useTabBarScrollHide';
import { useTimeline, useDeleteRecord } from '@/features/record/hooks/useRecord';
import { getEmotionColor } from '@/shared/components/EmotionSlider';
import { LoadingSpinner } from '@/shared/components/LoadingSpinner';
import { useAuthStore } from '@/features/auth/store/authStore';
import type { RecordStackParamList } from '@/navigation/RecordNavigator';
import type { RootStackParamList } from '@/navigation/RootNavigator';
import type { RecordSummary } from '@/shared/types/domain.types';

type Nav = CompositeNavigationProp<
  StackNavigationProp<RecordStackParamList, 'RecordTab'>,
  StackNavigationProp<RootStackParamList>
>;

/** 카드 정렬 기준 날짜: consultedAt(있으면) > createdAt */
const recordDate = (item: RecordSummary): string =>
  item.consultedAt ?? item.createdAt.split('T')[0];

/** 진료일 표시 라벨 — 직접 선택한 consultedAt이 있으면 진료일, 없으면 작성일 */
const formatRecordDate = (item: RecordSummary): { label: string; isConsulted: boolean } => {
  const dateStr = recordDate(item);
  const d = new Date(dateStr + (dateStr.includes('T') ? '' : 'T00:00:00'));
  const formatted = `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
  return { label: formatted, isConsulted: item.consultedAt != null };
};

const RecordCard: React.FC<{ item: RecordSummary; onPress: () => void; onDelete: () => void }> = ({ item, onPress, onDelete }) => {
  const { colors } = useTheme();
  const emotionColor = item.emotionScore !== undefined ? getEmotionColor(item.emotionScore) : colors.primary;
  const { label: dateLabel, isConsulted } = formatRecordDate(item);

  const handleMore = () => {
    Alert.alert('진료 기록', '', [
      { text: '수정', onPress },
      { text: '삭제', style: 'destructive', onPress: onDelete },
      { text: '취소', style: 'cancel' },
    ]);
  };

  return (
    <View style={styles.timelineRow}>
      {/* Timeline line + dot */}
      <View style={styles.timelineLeft}>
        <View style={[styles.timelineDot, { backgroundColor: emotionColor }]} />
        <View style={[styles.timelineLine, { backgroundColor: colors.divider }]} />
      </View>

      <AnimatedPressable
        onPress={onPress}
        onLongPress={handleMore}
        style={[styles.card, { backgroundColor: colors.surface }, softShadow(colors)]}
      >
        {/* 날짜 라인 */}
        <View style={styles.dateRow}>
          <Ionicons name="calendar-outline" size={13} color={colors.textSub} />
          <Text style={[styles.dateText, { color: colors.textSub, fontFamily: fontFamily.medium }]}>
            {dateLabel}
          </Text>
          <Text style={[styles.dateLabelKind, { color: colors.textDisabled }]}>
            {isConsulted ? '진료일' : '작성일'}
          </Text>
          <TouchableOpacity onPress={handleMore} hitSlop={12} style={styles.moreBtn}>
            <Ionicons name="ellipsis-vertical" size={16} color={colors.textSub} />
          </TouchableOpacity>
        </View>

        <View style={styles.cardHeader}>
          {item.hospitalName ? (
            <Text style={[styles.cardHospital, { color: colors.primary }]}>{item.hospitalName}</Text>
          ) : (
            <Text style={[styles.cardHospital, { color: colors.textDisabled }]}>일정 미연결</Text>
          )}
          {item.emotionScore !== undefined && (
            <View style={[styles.emotionBadge, { backgroundColor: emotionColor + '20', borderColor: emotionColor + '40' }]}>
              <Text style={[styles.emotionScore, { color: emotionColor }]}>
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
      </AnimatedPressable>
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
  useResetStackOnTabFocus();
  const { colors } = useTheme();
  const navigation = useNavigation<Nav>();
  const { t } = useTranslation('record');
  const isPremium = useAuthStore((s) => s.user?.plan === 'PREMIUM');
  const tabBarSafeBottom = useTabBarSafeBottom();
  const scrollHandlers = useTabBarScrollHide();
  const { mutate: deleteRecord } = useDeleteRecord();

  const handleDeleteRecord = (id: string) => {
    Alert.alert('기록 삭제', '이 진료 기록을 삭제할까요?', [
      { text: '취소', style: 'cancel' },
      { text: '삭제', style: 'destructive', onPress: () => deleteRecord(id) },
    ]);
  };

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
  } = useTimeline();

  const items = useMemo(() => {
    const allItems = data?.pages.flatMap((p) => p.content) ?? [];
    // 정렬: recordDate(consultedAt > createdAt) 내림차순
    return [...allItems].sort((a, b) => recordDate(b).localeCompare(recordDate(a)));
  }, [data]);

  const handleEndReached = () => {
    if (hasNextPage && !isFetchingNextPage) fetchNextPage();
  };

  if (isLoading) return <LoadingSpinner fullscreen />;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScreenHeader variant="tab" title={t('title')} hasNotification />

      <View style={styles.toolRow}>
        <TouchableOpacity
          style={[styles.prescriptionBtn, { backgroundColor: colors.primaryMuted, borderColor: colors.primary + '33' }]}
          onPress={() => navigation.navigate('PrescriptionList' as any)}
          activeOpacity={0.8}
        >
          <Ionicons name="medkit-outline" size={14} color={colors.primary} />
          <Text style={[styles.prescriptionBtnText, { color: colors.primary }]}>처방 목록</Text>
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

      <FlatList
        data={items}
        keyExtractor={(item) => `record-${item.id}`}
        renderItem={({ item }) => (
          <RecordCard
            item={item}
            onPress={() => navigation.navigate('RecordDetail', { recordId: item.id })}
            onDelete={() => handleDeleteRecord(item.id)}
          />
        )}
        onEndReached={handleEndReached}
        onEndReachedThreshold={0.3}
        {...scrollHandlers}
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
        contentContainerStyle={
          items.length === 0
            ? styles.emptyContainer
            : [styles.listContent, { paddingBottom: tabBarSafeBottom + 20 }]
        }
      />

      <AnimatedPressable
        onPress={() => navigation.navigate('RecordForm', undefined)}
        style={[styles.fab, { bottom: tabBarSafeBottom + sizes.spacing.md }]}
      >
        <LinearGradient
          colors={[colors.primaryVivid, colors.primaryVividDark]}
          style={styles.fabGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Ionicons name="add" size={30} color={colors.textInverse} />
        </LinearGradient>
      </AnimatedPressable>
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
  toolRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: sizes.spacing.lg,
    paddingBottom: sizes.spacing.sm,
  },
  prescriptionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: sizes.spacing.md,
    paddingVertical: sizes.spacing.xs + 2,
    borderRadius: sizes.radius.full,
    borderWidth: 1,
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
    fontFamily: fontFamily.regular,
    flex: 1,
  },
  freeBannerUpgrade: {
    fontSize: sizes.font.sm,
    fontFamily: fontFamily.bold,
    marginLeft: sizes.spacing.sm,
  },
  listContent: {},
  emptyContainer: { flexGrow: 1 },

  // Section headers with accent bar
  sectionHeader: {
    paddingHorizontal: sizes.spacing.lg,
    paddingVertical: sizes.spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: sizes.spacing.sm,
  },
  sectionAccent: {
    width: 3,
    height: 18,
    borderRadius: 1.5,
  },
  sectionHeaderText: {
    fontSize: sizes.font.md,
    fontFamily: fontFamily.bold,
  },

  // Timeline layout
  timelineRow: {
    flexDirection: 'row',
    paddingRight: sizes.spacing.lg,
    paddingLeft: sizes.spacing.md,
  },
  timelineLeft: {
    width: 24,
    alignItems: 'center',
    paddingTop: sizes.spacing.md + 4,
  },
  timelineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  timelineLine: {
    width: 2,
    flex: 1,
    marginTop: 4,
    borderRadius: 1,
  },

  // Cards
  card: {
    flex: 1,
    marginTop: sizes.spacing.md,
    borderRadius: sizes.radius.xxl,
    padding: sizes.spacing.lg,
    gap: sizes.spacing.sm,
  },
  prescriptionCard: {
    borderLeftWidth: 3,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dateText: {
    fontSize: sizes.font.xs,
  },
  dateLabelKind: {
    fontSize: 10,
    marginLeft: 2,
    flex: 1,
  },
  moreBtn: {
    padding: 4,
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
    paddingHorizontal: sizes.spacing.md,
    paddingVertical: 4,
    borderRadius: sizes.radius.full,
    borderWidth: 1,
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
    fontFamily: fontFamily.regular,
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
    fontFamily: fontFamily.medium,
  },
  prescriptionDate: {
    fontSize: sizes.font.sm,
    fontFamily: fontFamily.regular,
  },
  footerSpinner: { marginVertical: sizes.spacing.lg },
  emptyWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: sizes.spacing.sm,
  },
  emptyText: {
    fontSize: sizes.font.lg,
    fontFamily: fontFamily.semibold,
  },
  emptySubText: {
    fontSize: sizes.font.sm,
    fontFamily: fontFamily.regular,
  },

  // FAB
  fab: {
    position: 'absolute',
    right: sizes.spacing.xl,
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  fabGradient: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
