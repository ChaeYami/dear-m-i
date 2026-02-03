import React, { useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  
  SectionList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { CompositeNavigationProp } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { colors, sizes } from '@/constants';
import { getEmotionColor, useEmotionLabel } from '@/shared/components/EmotionSlider';
import { formatDate } from '@/shared/utils/dateUtils';
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

export const CheckinHistoryScreen: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const { t, i18n } = useTranslation('checkin');
  const emotionLabel = useEmotionLabel();
  const plan = useAuthStore((s) => s.user?.plan);
  const isFree = plan === 'FREE' || !plan;

  const { data: history, isLoading } = useCheckinHistory();

  const sections = useMemo<Section[]>(() => {
    if (!history?.content) return [];
    return history.content.map((checkin) => ({
      title: formatDate(checkin.checkedAt, i18n.language),
      data: [checkin],
    }));
  }, [history]);

  if (isLoading) return <LoadingSpinner fullscreen />;

  return (
    <SafeAreaView style={styles.container}>
      {/* 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={12}>
          <Ionicons name="chevron-back" size={24} color={colors.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('history_title')}</Text>
        <View style={{ width: 48 }} />
      </View>

      {/* FREE 배너 */}
      {isFree && (
        <View style={styles.freeBanner}>
          <Text style={styles.freeBannerText}>
            {t('free_limit_banner')}
          </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Paywall')} hitSlop={8}>
            <Text style={styles.freeBannerUpgrade}>{t('common:upgrade')}</Text>
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
                {emotionLabel(item.emotionScore)}
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
                <Text style={styles.metaItem}>{t('sleep_short')} {item.sleepHours}h</Text>
              )}
              {item.tookMedication != null && (
                <Text style={styles.metaItem}>
                  {t('med_label')} {item.tookMedication ? t('took_medication') : t('not_took_medication')}
                </Text>
              )}
            </View>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <Text style={styles.emptyText}>{t('empty_title')}</Text>
            <Text style={styles.emptySubText}>{t('empty_desc')}</Text>
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
    borderBottomColor: colors.divider,
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
    color: colors.text,
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
    borderBottomColor: colors.divider,
  },
  sectionDate: {
    fontSize: sizes.font.sm,
    fontWeight: sizes.fontWeight.semibold,
    color: colors.text,
  },
  card: {
    backgroundColor: colors.surface,
    marginHorizontal: sizes.spacing.lg,
    marginTop: sizes.spacing.sm,
    borderRadius: sizes.radius.md,
    padding: sizes.spacing.md,
    gap: sizes.spacing.sm,
    borderWidth: 1,
    borderColor: colors.divider,
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
    color: colors.textSub,
    lineHeight: 20,
  },
  metaRow: {
    flexDirection: 'row',
    gap: sizes.spacing.md,
  },
  metaItem: {
    fontSize: sizes.font.xs,
    color: colors.textDisabled,
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
    color: colors.textSub,
  },
  emptySubText: { fontSize: sizes.font.sm, color: colors.textDisabled },
});
