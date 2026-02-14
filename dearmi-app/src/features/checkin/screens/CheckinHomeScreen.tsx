import React, { useState, useRef, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  FlatList,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { useTranslation } from 'react-i18next';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme, sizes, fontFamily } from '@/shared/theme';
import { softShadow } from '@/shared/theme/shadows';
import { AnimatedPressable } from '@/shared/components/AnimatedPressable';
import { ScreenHeader } from '@/shared/components/ScreenHeader';
import { useResetStackOnTabFocus } from '@/shared/hooks/useResetStackOnTabFocus';
import { useTabBarSafeBottom } from '@/shared/hooks/useTabBarSafeBottom';
import { useTabBarScrollHide } from '@/shared/hooks/useTabBarScrollHide';
import { getEmotionColor, useEmotionLabel } from '@/shared/components/EmotionSlider';
import { EmotionGraph } from '@/features/checkin/components/EmotionGraph';
import { DailyCheckinForm } from '@/features/checkin/components/DailyCheckinForm';
import { useCheckinHistory } from '@/features/checkin/hooks/useCheckin';
import { useTodayMedication } from '@/features/medication/hooks/useMedication';
import { LoadingSpinner } from '@/shared/components/LoadingSpinner';
import type { CheckinStackParamList } from '@/navigation/CheckinNavigator';
import type { DailyCheckin } from '@/shared/types/domain.types';

type Nav = StackNavigationProp<CheckinStackParamList, 'CheckinHome'>;

/** 로컬 날짜를 YYYY-MM-DD 문자열로 */
const toLocalDateStr = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

const getTodayStr = () => toLocalDateStr(new Date());

// 오늘이 첫번째, 과거로 스크롤 (역순)
const generateDates = (days: number): string[] => {
  const dates: string[] = [];
  const today = new Date();
  for (let i = 0; i < days; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    dates.push(toLocalDateStr(d));
  }
  return dates;
};

const DAY_NAMES = ['일', '월', '화', '수', '목', '금', '토'];

const formatDateLabel = (dateStr: string) => {
  const [, mo, da] = dateStr.split('-');
  return `${Number(mo)}월 ${Number(da)}일`;
};

export const CheckinHomeScreen: React.FC = () => {
  useResetStackOnTabFocus();
  const { colors } = useTheme();
  const navigation = useNavigation<Nav>();
  const { t } = useTranslation('checkin');
  const emotionLabel = useEmotionLabel();
  const tabBarSafeBottom = useTabBarSafeBottom();
  const scrollHandlers = useTabBarScrollHide();

  const todayStr = getTodayStr();
  const dates = useMemo(() => generateDates(30), []);
  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [showForm, setShowForm] = useState(false);
  const dateListRef = useRef<FlatList>(null);

  // 30일 이력 가져오기
  const startDate = dates[dates.length - 1]; // inverted이므로 마지막이 가장 과거
  const { data: history, isLoading } = useCheckinHistory(startDate, todayStr);

  // 오늘 복약 완료율
  const { data: todayMed } = useTodayMedication();
  const medCompleted = useMemo(() => {
    if (!todayMed?.schedules?.length) return null; // 복약 일정 없으면 표시 안 함
    const total = todayMed.schedules.reduce((sum, s) => sum + s.slots.length, 0);
    const taken = todayMed.schedules.reduce(
      (sum, s) => sum + s.slots.filter((sl) => sl.status === 'TAKEN').length, 0
    );
    return total > 0 && taken === total;
  }, [todayMed]);

  // 날짜별 체크인 맵
  const checkinMap = useMemo(() => {
    const map = new Map<string, DailyCheckin>();
    if (history?.content) {
      history.content.forEach((c) => map.set(c.checkedAt, c));
    }
    return map;
  }, [history]);

  const selectedCheckin = checkinMap.get(selectedDate) ?? null;
  const isToday = selectedDate === todayStr;

  const dynamicStyles = useMemo(() => ({
    // 오늘(미선택): 테두리 강조
    dateItemToday: {
      borderColor: colors.primary,
      borderWidth: 2,
    },
    // 체크인 있음(미선택): 배경 tint
    dateItemHasCheckin: {
      backgroundColor: colors.primaryMuted,
      borderColor: colors.primary + '60',
      borderWidth: 1.5,
    },
    // 선택됨: solid primary
    dateItemSelected: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
      ...softShadow(colors),
    },
  }), [colors]);

  const styles = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: {
      height: sizes.headerHeight,
      justifyContent: 'center',
      paddingHorizontal: sizes.spacing.lg,
    },
    headerTitle: {
      fontSize: sizes.font.xl,
      fontFamily: fontFamily.bold,
      color: colors.text,
    },
    // 날짜 바
    dateBarWrapper: {
      flexGrow: 0,
      flexShrink: 0,
    },
    dateBar: {
      paddingHorizontal: sizes.spacing.md,
      paddingTop: sizes.spacing.sm,
      paddingBottom: sizes.spacing.md,
      gap: sizes.spacing.sm,
    },
    dateItem: {
      width: 48,
      height: 48,
      borderRadius: sizes.radius.full,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1.5,
      borderColor: 'transparent',
      backgroundColor: colors.surface,
    },
    dateCol: {
      alignItems: 'center',
      gap: 4,
    },
    dateDayName: {
      fontSize: 10,
      fontFamily: fontFamily.medium,
      color: colors.textSub,
    },
    dateSunday: {
      color: colors.error,
    },
    dateDayNum: {
      fontSize: sizes.font.md,
      fontFamily: fontFamily.bold,
      color: colors.text,
    },
    dateDayNumSelected: {
      color: colors.textInverse,
    },
    // 내용
    content: {
      paddingHorizontal: sizes.spacing.lg,
      paddingTop: sizes.spacing.md,
      gap: sizes.spacing.lg,
      paddingBottom: tabBarSafeBottom + 16,
    },
    selectedDateLabel: {
      fontSize: sizes.font.sm,
      fontFamily: fontFamily.semibold,
      color: colors.textSub,
    },
    pastDateNotice: {
      fontSize: sizes.font.xs,
      fontFamily: fontFamily.regular,
      marginTop: -sizes.spacing.sm,
    },
    // 체크인 카드
    checkinCard: {
      backgroundColor: colors.surface,
      borderRadius: sizes.radius.xxl,
      padding: 20,
      gap: sizes.spacing.md,
      alignItems: 'center',
    },
    emptyText: {
      fontSize: sizes.font.md,
      fontFamily: fontFamily.semibold,
      color: colors.textSub,
      textAlign: 'center',
    },
    writeBtnGradient: {
      width: '100%',
      height: sizes.buttonHeight.md,
      borderRadius: sizes.radius.full,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: sizes.spacing.sm,
    },
    writeBtnText: {
      fontSize: sizes.font.md,
      fontFamily: fontFamily.bold,
      color: colors.textInverse,
    },
    cardTop: {
      width: '100%',
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    scoreRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: sizes.spacing.md,
    },
    // Emotion circle — larger with ring
    emotionCircleOuter: {
      width: 52,
      height: 52,
      borderRadius: 26,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 2.5,
    },
    emotionCircleInner: {
      width: 48,
      height: 48,
      borderRadius: 24,
      alignItems: 'center',
      justifyContent: 'center',
    },
    scoreBadgeText: {
      fontSize: sizes.font.lg,
      fontFamily: fontFamily.bold,
      color: '#FFFFFF',
    },
    scoreLabel: {
      fontSize: sizes.font.lg,
      fontFamily: fontFamily.bold,
    },
    tagRow: {
      width: '100%',
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: sizes.spacing.xs,
    },
    tag: {
      paddingHorizontal: sizes.spacing.md,
      paddingVertical: 6,
      borderRadius: sizes.radius.full,
      backgroundColor: colors.primaryMuted,
    },
    tagText: {
      fontSize: sizes.font.xs,
      color: colors.primary,
      fontFamily: fontFamily.medium,
    },
    memoText: {
      width: '100%',
      fontSize: sizes.font.md,
      fontFamily: fontFamily.regular,
      color: colors.text,
      lineHeight: 22,
    },
    metaRow: {
      width: '100%',
      flexDirection: 'row',
      gap: sizes.spacing.sm,
    },
    metaChip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: sizes.spacing.xs,
      backgroundColor: colors.background,
      paddingHorizontal: sizes.spacing.sm,
      paddingVertical: sizes.spacing.xs,
      borderRadius: sizes.radius.full,
    },
    metaText: {
      fontSize: sizes.font.xs,
      color: colors.textSub,
      fontFamily: fontFamily.medium,
    },
    metaChipSuccess: {
      backgroundColor: colors.successLight,
    },
    metaTextSuccess: {
      color: colors.success,
    },
    // 섹션
    section: {
      gap: sizes.spacing.sm,
    },
    sectionTitle: {
      fontSize: sizes.font.md,
      fontFamily: fontFamily.bold,
      color: colors.text,
    },
    // 전체 기록
    historyLink: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.surface,
      borderRadius: sizes.radius.xxl,
      padding: sizes.spacing.md,
    },
    historyLinkText: {
      fontSize: sizes.font.md,
      fontFamily: fontFamily.semibold,
      color: colors.primary,
    },
  }), [colors, tabBarSafeBottom]);

  // inverted FlatList — 오늘이 자동으로 왼쪽에 표시됨

  if (isLoading) return <LoadingSpinner fullscreen />;

  return (
    <SafeAreaView style={styles.container}>
      <ScreenHeader variant="tab" title={t('title')} hasNotification />

      {/* 날짜 스크롤 바 */}
      <FlatList
        ref={dateListRef}
        data={dates}
        horizontal
        inverted
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item}
        style={styles.dateBarWrapper}
        contentContainerStyle={styles.dateBar}
        renderItem={({ item }) => {
          const d = new Date(item);
          const dayName = DAY_NAMES[d.getDay()];
          const dayNum = d.getDate();
          const isSelected = item === selectedDate;
          const hasCheckin = checkinMap.has(item);
          const isSunday = d.getDay() === 0;
          const isItemToday = item === todayStr;

          return (
            <View style={styles.dateCol}>
              <Text style={[
                styles.dateDayName,
                isSunday && styles.dateSunday,
              ]}>
                {dayName}
              </Text>
              <TouchableOpacity
                style={[
                  styles.dateItem,
                  isItemToday && !isSelected && dynamicStyles.dateItemToday,
                  hasCheckin && !isSelected && dynamicStyles.dateItemHasCheckin,
                  isSelected && dynamicStyles.dateItemSelected,
                ]}
                onPress={() => setSelectedDate(item)}
                activeOpacity={0.7}
              >
                <Text style={[
                  styles.dateDayNum,
                  isSelected && styles.dateDayNumSelected,
                  hasCheckin && !isSelected && { color: colors.primary },
                ]}>
                  {dayNum}
                </Text>
              </TouchableOpacity>
              {/* 체크인 완료 인디케이터 */}
              {hasCheckin ? (
                <Ionicons
                  name="checkmark-circle"
                  size={10}
                  color={isSelected ? 'rgba(255,255,255,0.75)' : colors.primary}
                  style={{ marginTop: 2 }}
                />
              ) : (
                <View style={{ width: 10, height: 10, marginTop: 2 }} />
              )}
            </View>
          );
        }}
      />

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        {...scrollHandlers}
      >
        {/* 선택된 날짜 라벨 */}
        <Text style={styles.selectedDateLabel}>
          {isToday ? '오늘' : formatDateLabel(selectedDate)}
        </Text>
        {/* 과거 날짜 안내 */}
        {!isToday && (
          <Text style={[styles.pastDateNotice, { color: colors.textDisabled }]}>
            지난 날짜의 기록을 조회하거나 추가할 수 있어요
          </Text>
        )}

        {/* 체크인 카드 */}
        <AnimatedPressable
          onPress={() => selectedCheckin ? setShowForm(true) : undefined}
          disabled={!selectedCheckin}
          style={[styles.checkinCard, softShadow(colors)]}
        >
          {!selectedCheckin ? (
            <>
              <Ionicons name="create-outline" size={36} color={colors.textDisabled} />
              <Text style={styles.emptyText}>기록이 없어요</Text>
              <TouchableOpacity
                onPress={() => setShowForm(true)}
                activeOpacity={0.85}
                style={{ width: '100%' }}
              >
                <LinearGradient
                  colors={[colors.primaryVivid, colors.primaryVividDark]}
                  style={styles.writeBtnGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Text style={styles.writeBtnText}>
                    {isToday ? t('write_today') : `${formatDateLabel(selectedDate)} 기록하기`}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <View style={styles.cardTop}>
                <View style={styles.scoreRow}>
                  <View
                    style={[
                      styles.emotionCircleOuter,
                      {
                        borderColor: getEmotionColor(selectedCheckin.emotionScore) + '40',
                        ...softShadow(colors),
                      },
                    ]}
                  >
                    <View
                      style={[styles.emotionCircleInner, { backgroundColor: getEmotionColor(selectedCheckin.emotionScore) }]}
                    >
                      <Text style={styles.scoreBadgeText}>{selectedCheckin.emotionScore}</Text>
                    </View>
                  </View>
                  <Text style={[styles.scoreLabel, { color: getEmotionColor(selectedCheckin.emotionScore) }]}>
                    {emotionLabel(selectedCheckin.emotionScore)}
                  </Text>
                </View>
                <TouchableOpacity onPress={() => setShowForm(true)} hitSlop={12}>
                  <Ionicons name="create-outline" size={20} color={colors.primary} />
                </TouchableOpacity>
              </View>

              {/* 트리거 태그 */}
              {selectedCheckin.triggerTags && selectedCheckin.triggerTags.length > 0 && (
                <View style={styles.tagRow}>
                  {selectedCheckin.triggerTags.map((tag) => (
                    <View key={tag} style={styles.tag}>
                      <Text style={styles.tagText}>{tag}</Text>
                    </View>
                  ))}
                </View>
              )}

              {/* 메모 */}
              {selectedCheckin.memo && (
                <Text style={styles.memoText}>{selectedCheckin.memo}</Text>
              )}

              {/* 수면 + 복약 */}
              <View style={styles.metaRow}>
                {selectedCheckin.sleepHours != null && (
                  <View style={styles.metaChip}>
                    <Ionicons name="moon-outline" size={14} color={colors.textSub} />
                    <Text style={styles.metaText}>{selectedCheckin.sleepHours}시간</Text>
                  </View>
                )}
                {isToday && medCompleted != null && (
                  <View style={[styles.metaChip, medCompleted && styles.metaChipSuccess]}>
                    <Ionicons
                      name={medCompleted ? 'checkmark-circle' : 'medical-outline'}
                      size={14}
                      color={medCompleted ? colors.success : colors.textSub}
                    />
                    <Text style={[styles.metaText, medCompleted && styles.metaTextSuccess]}>
                      {medCompleted ? '복용 완료' : '미복용'}
                    </Text>
                  </View>
                )}
              </View>
            </>
          )}
        </AnimatedPressable>

        {/* 감정 그래프 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('emotion_trend')}</Text>
          <EmotionGraph />
        </View>

        {/* 전체 기록 보기 */}
        <AnimatedPressable
          onPress={() => navigation.navigate('CheckinHistory')}
          style={[styles.historyLink, softShadow(colors)]}
        >
          <Text style={styles.historyLinkText}>{t('view_all')}</Text>
          <Ionicons name="chevron-forward" size={16} color={colors.primary} />
        </AnimatedPressable>
      </ScrollView>

      {/* 체크인 폼 모달 */}
      <Modal visible={showForm} animationType="slide" presentationStyle="pageSheet">
        <DailyCheckinForm
          existingCheckin={selectedCheckin}
          targetDate={selectedDate}
          onClose={() => setShowForm(false)}
        />
      </Modal>
    </SafeAreaView>
  );
};
