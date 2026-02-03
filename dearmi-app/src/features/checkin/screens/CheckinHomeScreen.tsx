import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Modal,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { colors, sizes } from '@/constants';
import { getEmotionColor, getEmotionLabel } from '@/shared/components/EmotionSlider';
import { EmotionGraph } from '@/features/checkin/components/EmotionGraph';
import { DailyCheckinForm } from '@/features/checkin/components/DailyCheckinForm';
import { useTodayCheckin } from '@/features/checkin/hooks/useCheckin';
import { LoadingSpinner } from '@/shared/components/LoadingSpinner';
import type { CheckinStackParamList } from '@/navigation/CheckinNavigator';

type Nav = StackNavigationProp<CheckinStackParamList, 'CheckinHome'>;

export const CheckinHomeScreen: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const { data: todayData, isLoading } = useTodayCheckin();
  const [showForm, setShowForm] = useState(false);

  if (isLoading) return <LoadingSpinner fullscreen />;

  const checkin = todayData?.checkin;
  const checkedIn = todayData?.checkedIn ?? false;

  return (
    <SafeAreaView style={styles.container}>
      {/* 헤더 */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>하루 메모</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* 오늘 체크인 카드 */}
        <View style={styles.todayCard}>
          {!checkedIn ? (
            <>
              <Text style={styles.todayPrompt}>오늘 기분은 어때요?</Text>
              <Text style={styles.todaySubPrompt}>하루를 기록하고 패턴을 확인해 보세요</Text>
              <TouchableOpacity
                style={styles.writeBtn}
                onPress={() => setShowForm(true)}
                activeOpacity={0.85}
              >
                <Text style={styles.writeBtnText}>오늘의 기분 기록하기</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <View style={styles.todayHeader}>
                <Text style={styles.todayDateLabel}>오늘</Text>
                <TouchableOpacity onPress={() => setShowForm(true)} hitSlop={12}>
                  <Text style={styles.editBtn}>수정</Text>
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
                  {getEmotionLabel(checkin!.emotionScore)}
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
                  <Text style={styles.metaItem}>수면 {checkin!.sleepHours}h</Text>
                )}
                {checkin!.tookMedication != null && (
                  <Text style={styles.metaItem}>
                    약 {checkin!.tookMedication ? '복용' : '미복용'}
                  </Text>
                )}
              </View>
            </>
          )}
        </View>

        {/* 감정 그래프 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>감정 추이</Text>
          <EmotionGraph />
        </View>

        {/* 전체 기록 보기 */}
        <TouchableOpacity
          style={styles.historyLink}
          onPress={() => navigation.navigate('CheckinHistory')}
          activeOpacity={0.7}
        >
          <Text style={styles.historyLinkText}>전체 기록 보기</Text>
          <Text style={styles.historyArrow}>{' >'}</Text>
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
    borderBottomColor: colors.border,
  },
  headerTitle: {
    fontSize: sizes.font.xl,
    fontWeight: sizes.fontWeight.bold,
    color: colors.text.primary,
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
    color: colors.text.primary,
    textAlign: 'center',
  },
  todaySubPrompt: {
    fontSize: sizes.font.sm,
    color: colors.text.secondary,
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
    color: colors.text.onPrimary,
  },
  todayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  todayDateLabel: {
    fontSize: sizes.font.sm,
    fontWeight: sizes.fontWeight.semibold,
    color: colors.text.secondary,
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
  // 섹션
  section: {
    gap: sizes.spacing.sm,
  },
  sectionTitle: {
    fontSize: sizes.font.md,
    fontWeight: sizes.fontWeight.bold,
    color: colors.text.primary,
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
