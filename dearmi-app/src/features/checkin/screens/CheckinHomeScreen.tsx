import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  
  ScrollView,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { useTranslation } from 'react-i18next';
import { colors, sizes } from '@/constants';
import { getEmotionColor, useEmotionLabel } from '@/shared/components/EmotionSlider';
import { EmotionGraph } from '@/features/checkin/components/EmotionGraph';
import { DailyCheckinForm } from '@/features/checkin/components/DailyCheckinForm';
import { useTodayCheckin } from '@/features/checkin/hooks/useCheckin';
import { LoadingSpinner } from '@/shared/components/LoadingSpinner';
import type { CheckinStackParamList } from '@/navigation/CheckinNavigator';

type Nav = StackNavigationProp<CheckinStackParamList, 'CheckinHome'>;

export const CheckinHomeScreen: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const { t } = useTranslation('checkin');
  const emotionLabel = useEmotionLabel();
  const { data: todayData, isLoading } = useTodayCheckin();
  const [showForm, setShowForm] = useState(false);

  if (isLoading) return <LoadingSpinner fullscreen />;

  const checkin = todayData?.checkin;
  const checkedIn = todayData?.checkedIn ?? false;

  return (
    <SafeAreaView style={styles.container}>
      {/* 헤더 */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t('title')}</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* 오늘 체크인 카드 */}
        <View style={styles.todayCard}>
          {!checkedIn ? (
            <>
              <Text style={styles.todayPrompt}>{t('today_question')}</Text>
              <Text style={styles.todaySubPrompt}>{t('today_sub')}</Text>
              <TouchableOpacity
                style={styles.writeBtn}
                onPress={() => setShowForm(true)}
                activeOpacity={0.85}
              >
                <Text style={styles.writeBtnText}>{t('write_today')}</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <View style={styles.todayHeader}>
                <Text style={styles.todayDateLabel}>{t('today')}</Text>
                <TouchableOpacity onPress={() => setShowForm(true)} hitSlop={12}>
                  <Text style={styles.editBtn}>{t('common:edit')}</Text>
                </TouchableOpacity>
              </View>

              {/* 감정 점수 */}
              <View style={styles.scoreRow}>
                <View
                  style={[
                    styles.scoreBadge,
                    { backgroundColor: getEmotionColor(checkin!.emotionScore) },
                  ]}
                >
                  <Text style={styles.scoreBadgeText}>{checkin!.emotionScore}</Text>
                </View>
                <Text
                  style={[
                    styles.scoreLabel,
                    { color: getEmotionColor(checkin!.emotionScore) },
                  ]}
                >
                  {emotionLabel(checkin!.emotionScore)}
                </Text>
              </View>

              {/* 트리거 태그 */}
              {checkin!.triggerTags && checkin!.triggerTags.length > 0 && (
                <View style={styles.tagRow}>
                  {checkin!.triggerTags.map((tag) => (
                    <View key={tag} style={styles.tag}>
                      <Text style={styles.tagText}>{tag}</Text>
                    </View>
                  ))}
                </View>
              )}

              {/* 메모 미리보기 */}
              {checkin!.memo && (
                <Text style={styles.memoPreview} numberOfLines={2}>
                  {checkin!.memo}
                </Text>
              )}

              {/* 수면 + 복약 */}
              <View style={styles.metaRow}>
                {checkin!.sleepHours != null && (
                  <Text style={styles.metaItem}>{t('sleep_short')} {checkin!.sleepHours}h</Text>
                )}
                {checkin!.tookMedication != null && (
                  <Text style={styles.metaItem}>
                    {t('med_label')} {checkin!.tookMedication ? t('took_medication') : t('not_took_medication')}
                  </Text>
                )}
              </View>
            </>
          )}
        </View>

        {/* 감정 그래프 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('emotion_trend')}</Text>
          <EmotionGraph />
        </View>

        {/* 전체 기록 보기 */}
        <TouchableOpacity
          style={styles.historyLink}
          onPress={() => navigation.navigate('CheckinHistory')}
          activeOpacity={0.7}
        >
          <Text style={styles.historyLinkText}>{t('view_all')}</Text>
          <Ionicons name="chevron-forward" size={16} color={colors.primary} />
        </TouchableOpacity>
      </ScrollView>

      {/* 체크인 폼 모달 */}
      <Modal visible={showForm} animationType="slide" presentationStyle="pageSheet">
        <DailyCheckinForm existingCheckin={checkin} onClose={() => setShowForm(false)} />
      </Modal>
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
    borderBottomColor: colors.divider,
  },
  headerTitle: {
    fontSize: sizes.font.xl,
    fontWeight: sizes.fontWeight.bold,
    color: colors.text,
  },
  content: {
    padding: sizes.spacing.lg,
    gap: sizes.spacing.lg,
    paddingBottom: 40,
  },
  // 오늘 카드
  todayCard: {
    backgroundColor: colors.surface,
    borderRadius: sizes.radius.lg,
    padding: sizes.spacing.lg,
    gap: sizes.spacing.md,
  },
  todayPrompt: {
    fontSize: sizes.font.xl,
    fontWeight: sizes.fontWeight.bold,
    color: colors.text,
    textAlign: 'center',
  },
  todaySubPrompt: {
    fontSize: sizes.font.sm,
    color: colors.textSub,
    textAlign: 'center',
  },
  writeBtn: {
    height: sizes.buttonHeight.md,
    backgroundColor: colors.primary,
    borderRadius: sizes.radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: sizes.spacing.sm,
  },
  writeBtnText: {
    fontSize: sizes.font.md,
    fontWeight: sizes.fontWeight.bold,
    color: colors.textInverse,
  },
  todayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  todayDateLabel: {
    fontSize: sizes.font.sm,
    fontWeight: sizes.fontWeight.semibold,
    color: colors.textSub,
  },
  editBtn: {
    fontSize: sizes.font.sm,
    color: colors.primary,
    fontWeight: sizes.fontWeight.semibold,
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: sizes.spacing.sm,
  },
  scoreBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreBadgeText: {
    fontSize: sizes.font.md,
    fontWeight: sizes.fontWeight.bold,
    color: '#FFFFFF',
  },
  scoreLabel: {
    fontSize: sizes.font.lg,
    fontWeight: sizes.fontWeight.semibold,
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: sizes.spacing.xs,
  },
  tag: {
    paddingHorizontal: sizes.spacing.sm,
    paddingVertical: 3,
    borderRadius: sizes.radius.full,
    backgroundColor: colors.primary + '12',
  },
  tagText: {
    fontSize: sizes.font.xs,
    color: colors.primary,
    fontWeight: sizes.fontWeight.medium,
  },
  memoPreview: {
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
  // 섹션
  section: {
    gap: sizes.spacing.sm,
  },
  sectionTitle: {
    fontSize: sizes.font.md,
    fontWeight: sizes.fontWeight.bold,
    color: colors.text,
  },
  // 전체 기록 보기
  historyLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderRadius: sizes.radius.lg,
    padding: sizes.spacing.md,
  },
  historyLinkText: {
    fontSize: sizes.font.md,
    fontWeight: sizes.fontWeight.semibold,
    color: colors.primary,
  },
  historyArrow: {
    fontSize: sizes.font.md,
    color: colors.primary,
  },
});
