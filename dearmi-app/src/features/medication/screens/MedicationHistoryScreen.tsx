import React, { useMemo, useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  Animated,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { Calendar } from 'react-native-calendars';
import { CompositeNavigationProp } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { customAlert } from '@/shared/components/CustomAlert';
import { useTheme, sizes, fontFamily } from '@/shared/theme';
import { softShadow } from '@/shared/theme/shadows';
import { LoadingSpinner } from '@/shared/components/LoadingSpinner';
import { ScreenHeader } from '@/shared/components/ScreenHeader';
import {
  useTodayMedication,
  useCheckMedication,
  useDeleteMedicationSchedule,
  useAllMedicationSchedules,
} from '@/features/medication/hooks/useMedication';
import {
  MedicationCard,
  SLOT_LABELS,
  SLOT_COLORS,
  formatSlotTime,
  type SlotItem,
} from '@/features/medication/components/MedicationCard';
import type { MedicationStackParamList } from '@/navigation/MedicationNavigator';
import type { RootStackParamList } from '@/navigation/RootNavigator';
import type { TimeSlotType, MedicationLogStatus } from '@/shared/types/domain.types';

type Nav = CompositeNavigationProp<
  StackNavigationProp<MedicationStackParamList, 'MedicationHistory'>,
  StackNavigationProp<RootStackParamList>
>;

const TIME_SLOTS: TimeSlotType[] = ['MORNING', 'AFTERNOON', 'EVENING', 'BEDTIME'];
const SCREEN_WIDTH = Dimensions.get('window').width;

const todayStrFn = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const getPrevDay = (dateStr: string): string => {
  const d = new Date(dateStr + 'T00:00:00');
  d.setDate(d.getDate() - 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const getNextDay = (dateStr: string): string => {
  const d = new Date(dateStr + 'T00:00:00');
  d.setDate(d.getDate() + 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

export const MedicationHistoryScreen: React.FC<{ embedded?: boolean }> = ({ embedded = false }) => {
  const { colors } = useTheme();
  const navigation = useNavigation<Nav>();

  const today = todayStrFn();
  const [selectedDate, setSelectedDate] = useState(today);
  const [showCalendar, setShowCalendar] = useState(false);

  const isToday = selectedDate === today;
  const [, mo, da] = selectedDate.split('-').map(Number);

  const { data, isLoading } = useTodayMedication(isToday ? undefined : selectedDate);
  const { mutate: checkMedication } = useCheckMedication();
  const { mutate: deleteMedicationSchedule } = useDeleteMedicationSchedule();
  const { data: allSchedules = [] } = useAllMedicationSchedules(showCalendar);

  // 방향별 슬라이드 인 애니메이션
  const slideAnim = useRef(new Animated.Value(0)).current;

  const animateAndSet = (newDate: string, direction: 'prev' | 'next') => {
    const fromX = direction === 'prev' ? -SCREEN_WIDTH : SCREEN_WIDTH;
    slideAnim.setValue(fromX);
    Animated.spring(slideAnim, {
      toValue: 0,
      tension: 68,
      friction: 11,
      useNativeDriver: true,
    }).start();
    setSelectedDate(newDate);
  };

  // 이력 화면은 오늘까지만 탐색
  const isNextDisabled = selectedDate >= today;

  const STATUS_CONFIG: Record<MedicationLogStatus, { label: string; color: string }> = useMemo(() => ({
    TAKEN: { label: '복용', color: colors.success },
    SKIPPED: { label: '건너뜀', color: colors.textDisabled },
    MISSED: { label: '미복용', color: colors.error },
  }), [colors]);

  const [pendingIds, setPendingIds] = useState<Set<string>>(new Set());

  const handleCheck = (scheduleId: string, status: 'TAKEN' | 'SKIPPED', timeSlot: TimeSlotType) => {
    setPendingIds((prev) => new Set(prev).add(scheduleId));
    checkMedication(
      { scheduleId, req: { logDate: selectedDate, timeSlot, status } },
      { onSettled: () => setPendingIds((prev) => { const next = new Set(prev); next.delete(scheduleId); return next; }) }
    );
  };

  const handleDelete = (scheduleId: string, drugName: string) => {
    customAlert('복약 일정 삭제', `'${drugName}'을(를) 삭제할까요?`, [
      { text: '취소', style: 'cancel' },
      { text: '삭제', style: 'destructive', onPress: () => deleteMedicationSchedule(scheduleId) },
    ]);
  };

  const slotGroups = useMemo<Record<TimeSlotType, SlotItem[]>>(() => {
    const groups: Record<TimeSlotType, SlotItem[]> = {
      MORNING: [], AFTERNOON: [], EVENING: [], BEDTIME: [],
    };
    for (const schedule of data?.schedules ?? []) {
      for (const slot of schedule.slots) {
        groups[slot.timeSlot].push({
          scheduleId: schedule.scheduleId,
          drugName: schedule.drugName,
          dosage: schedule.dosage,
          status: slot.status,
          logId: slot.logId,
          notifyTime: slot.notifyTime,
        });
      }
    }
    return groups;
  }, [data]);

  const { totalSlots, takenSlots } = useMemo(() => {
    let total = 0;
    let taken = 0;
    for (const schedule of data?.schedules ?? []) {
      for (const slot of schedule.slots) {
        total += 1;
        if (slot.status === 'TAKEN') taken += 1;
      }
    }
    return { totalSlots: total, takenSlots: taken };
  }, [data]);

  const completionRate = totalSlots > 0 ? takenSlots / totalSlots : 0;
  const hasAnySlots = TIME_SLOTS.some((s) => slotGroups[s].length > 0);

  // 캘린더 마킹 — 복약 일정 기간 하이라이트
  const markedDates = useMemo(() => {
    const marks: Record<string, any> = {};
    const fillBg = colors.primaryLight + '30';
    for (const s of allSchedules) {
      const start = s.startDate;
      const end = s.endDate ?? today;
      if (!start) continue;
      const startD = new Date(start);
      const endD = new Date(end);
      const todayD = new Date(today);
      const lastD = endD > todayD ? todayD : endD;
      const cur = new Date(startD);
      while (cur <= lastD) {
        const ds = `${cur.getFullYear()}-${String(cur.getMonth() + 1).padStart(2, '0')}-${String(cur.getDate()).padStart(2, '0')}`;
        if (!marks[ds]) {
          marks[ds] = {
            customStyles: {
              container: { backgroundColor: fillBg },
              text: { color: colors.text, fontFamily: fontFamily.medium },
            },
          };
        }
        cur.setDate(cur.getDate() + 1);
      }
    }
    marks[today] = {
      ...(marks[today] ?? {}),
      customStyles: {
        ...(marks[today]?.customStyles ?? {}),
        container: {
          ...(marks[today]?.customStyles?.container ?? {}),
          borderWidth: 1.5,
          borderColor: colors.primary,
          borderRadius: 18,
        },
        text: { color: colors.primary, fontFamily: fontFamily.bold },
      },
    };
    return marks;
  }, [allSchedules, today, colors]);

  const handlePickDate = (day: { dateString: string }) => {
    setShowCalendar(false);
    setSelectedDate(day.dateString);
  };

  const styles = getStyles(colors);

  const dateLabelSuffix = isToday ? ' (오늘)' : ' (지난 기록)';

  return (
    <SafeAreaView style={styles.container} edges={embedded ? [] : undefined}>
      {!embedded && <ScreenHeader variant="back" title="복약 이력" />}

      {/* 날짜 네비게이션 (항상 표시) */}
      <View style={styles.dateNavBar}>
        <TouchableOpacity
          onPress={() => animateAndSet(getPrevDay(selectedDate), 'prev')}
          hitSlop={12}
          style={styles.dateNavBtn}
        >
          <Ionicons name="chevron-back" size={20} color={colors.primary} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.dateNavCenter}
          onPress={() => setShowCalendar(true)}
          hitSlop={8}
          activeOpacity={0.7}
        >
          <Text style={styles.dateNavLabel}>{mo}월 {da}일</Text>
          <Ionicons name="calendar-outline" size={16} color={colors.primary} />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => animateAndSet(getNextDay(selectedDate), 'next')}
          hitSlop={12}
          style={styles.dateNavBtn}
          disabled={isNextDisabled}
        >
          <Ionicons
            name="chevron-forward"
            size={20}
            color={isNextDisabled ? colors.textDisabled : colors.primary}
          />
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <LoadingSpinner fullscreen />
      ) : (
        <Animated.View style={{ flex: 1, transform: [{ translateX: slideAnim }] }}>
          <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

            {/* 완료율 카드 */}
            <View style={styles.summaryCard}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryDate}>
                  {mo}월 {da}일{dateLabelSuffix}
                </Text>
                <Text style={styles.summaryRate}>{takenSlots} / {totalSlots}</Text>
              </View>
              <View style={styles.progressBg}>
                <LinearGradient
                  colors={[colors.secondary, colors.secondaryLight]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={[styles.progressFill, { width: `${Math.round(completionRate * 100)}%` }]}
                />
              </View>
              {totalSlots === 0 ? (
                <Text style={styles.summaryEmpty}>복약 일정이 없습니다</Text>
              ) : (
                <Text style={styles.summaryPercent}>{`${Math.round(completionRate * 100)}%`}</Text>
              )}
              {totalSlots > 0 && <Text style={styles.summaryLabel}>완료</Text>}
            </View>

            {/* 시간대별 카드 */}
            {!hasAnySlots ? (
              <View style={styles.emptyWrap}>
                <Text style={styles.emptyText}>이 날짜에 활성 복약 일정이 없어요</Text>
                <Text style={styles.emptySubText}>복약 일정의 시작/종료일을 확인해주세요</Text>
              </View>
            ) : (
              TIME_SLOTS.map((slot) => {
                if (slotGroups[slot].length === 0) return null;
                const notifyTime = slotGroups[slot][0]?.notifyTime;
                return (
                  <View key={slot} style={styles.slotGroup}>
                    <View style={styles.slotHeaderRow}>
                      <Text style={[styles.slotHeaderLabel, { color: SLOT_COLORS[slot] }]}>
                        {SLOT_LABELS[slot]}
                      </Text>
                      {notifyTime && (
                        <Text style={styles.slotHeaderTime}>{formatSlotTime(notifyTime)}</Text>
                      )}
                    </View>
                    <View style={styles.medicationCardWrap}>
                      <MedicationCard
                        items={slotGroups[slot]}
                        pendingScheduleIds={pendingIds}
                        onDrugPress={(scheduleId, drugName) =>
                          navigation.navigate('MedicationScheduleDetail', { scheduleId, drugName })
                        }
                        onDelete={(scheduleId, drugName) => handleDelete(scheduleId, drugName)}
                        onTaken={(scheduleId) => handleCheck(scheduleId, 'TAKEN', slot)}
                        onSkipped={(scheduleId) => handleCheck(scheduleId, 'SKIPPED', slot)}
                      />
                    </View>
                  </View>
                );
              })
            )}
          </ScrollView>
        </Animated.View>
      )}

      {/* 날짜 선택 캘린더 모달 */}
      <Modal
        visible={showCalendar}
        transparent
        animationType="fade"
        onRequestClose={() => setShowCalendar(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowCalendar(false)}
        >
          <TouchableOpacity activeOpacity={1} style={styles.modalSheet} onPress={() => {}}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalHeaderTitle}>날짜 선택</Text>
              <TouchableOpacity onPress={() => setShowCalendar(false)} hitSlop={12}>
                <Ionicons name="close" size={22} color={colors.text} />
              </TouchableOpacity>
            </View>
            <Calendar
              current={selectedDate}
              onDayPress={handlePickDate}
              markingType="custom"
              markedDates={markedDates}
              theme={{
                backgroundColor: 'transparent',
                calendarBackground: 'transparent',
                todayTextColor: colors.primary,
                dayTextColor: colors.text,
                textDisabledColor: colors.textDisabled,
                monthTextColor: colors.text,
                arrowColor: colors.primary,
                textSectionTitleColor: colors.textSub,
                textMonthFontFamily: fontFamily.bold,
                textDayHeaderFontFamily: fontFamily.semibold,
                textDayFontFamily: fontFamily.medium,
              }}
            />
            <Text style={styles.modalHint}>색칠된 날짜는 복약 일정이 있던 기간이에요</Text>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
};

const getStyles = (colors: ReturnType<typeof useTheme>['colors']) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    content: { padding: sizes.spacing.lg, paddingBottom: sizes.spacing.xl, gap: sizes.spacing.md },

    // ── 날짜 네비게이션 ──
    dateNavBar: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: sizes.spacing.lg,
      paddingVertical: sizes.spacing.sm,
    },
    dateNavBtn: {
      padding: sizes.spacing.xs,
    },
    dateNavCenter: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: sizes.spacing.xs,
      minWidth: 130,
      justifyContent: 'center',
    },
    dateNavLabel: {
      fontSize: sizes.font.md,
      fontFamily: fontFamily.semibold,
      color: colors.text,
    },

    // ── 완료율 카드 ──
    summaryCard: {
      backgroundColor: colors.surface,
      borderRadius: sizes.radius.xxl,
      padding: sizes.spacing.lg + 4,
      ...softShadow(colors),
      gap: sizes.spacing.sm,
      marginBottom: sizes.spacing.sm,
    },
    summaryRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    summaryDate: {
      fontSize: sizes.font.md,
      fontFamily: fontFamily.semibold,
      color: colors.text,
    },
    summaryRate: {
      fontSize: sizes.font.md,
      fontFamily: fontFamily.bold,
      color: colors.primary,
    },
    progressBg: {
      height: 10,
      backgroundColor: colors.divider,
      borderRadius: 5,
      overflow: 'hidden',
    },
    progressFill: {
      height: '100%',
      borderRadius: 5,
    },
    summaryPercent: {
      fontSize: sizes.font.xxl,
      fontFamily: fontFamily.bold,
      color: colors.secondary,
      textAlign: 'right',
    },
    summaryEmpty: {
      fontSize: sizes.font.md,
      fontFamily: fontFamily.medium,
      color: colors.secondary,
      textAlign: 'right',
    },
    summaryLabel: {
      fontSize: sizes.font.xs,
      color: colors.textSub,
      textAlign: 'right',
      marginTop: -4,
    },

    // ── 시간대별 카드 ──
    slotGroup: {
      gap: sizes.spacing.xs,
    },
    slotHeaderRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: sizes.spacing.sm,
      paddingHorizontal: sizes.spacing.xs,
      marginTop: sizes.spacing.sm,
    },
    slotHeaderLabel: {
      fontSize: sizes.font.md,
      fontFamily: fontFamily.bold,
    },
    slotHeaderTime: {
      fontSize: sizes.font.sm,
      fontFamily: fontFamily.medium,
      color: colors.textSub,
    },
    medicationCardWrap: {
      borderRadius: sizes.radius.xxl,
      ...softShadow(colors),
      overflow: 'hidden',
    },

    // ── 빈 상태 ──
    emptyWrap: {
      alignItems: 'center',
      paddingTop: 60,
      gap: sizes.spacing.sm,
    },
    emptyText: {
      fontSize: sizes.font.lg,
      fontFamily: fontFamily.semibold,
      color: colors.textSub,
    },
    emptySubText: {
      fontSize: sizes.font.sm,
      color: colors.textDisabled,
    },

    // ── 캘린더 모달 ──
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.4)',
      justifyContent: 'flex-end',
    },
    modalSheet: {
      backgroundColor: colors.surface,
      paddingTop: sizes.spacing.sm,
      paddingBottom: sizes.spacing.xl,
      paddingHorizontal: sizes.spacing.md,
      borderTopLeftRadius: sizes.radius.xxl,
      borderTopRightRadius: sizes.radius.xxl,
    },
    modalHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: sizes.spacing.md,
      paddingTop: sizes.spacing.sm,
      paddingBottom: sizes.spacing.xs,
    },
    modalHeaderTitle: {
      fontSize: sizes.font.lg,
      fontFamily: fontFamily.bold,
      color: colors.text,
    },
    modalHint: {
      marginTop: sizes.spacing.sm,
      paddingHorizontal: sizes.spacing.md,
      fontSize: sizes.font.xs,
      color: colors.textSub,
      textAlign: 'center',
    },
  });
