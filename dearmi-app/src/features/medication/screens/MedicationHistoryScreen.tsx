import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { Calendar } from 'react-native-calendars';
import { CompositeNavigationProp } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { useTranslation } from 'react-i18next';
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
import type { TimeSlotType } from '@/shared/types/domain.types';

type Nav = CompositeNavigationProp<
  StackNavigationProp<MedicationStackParamList, 'MedicationHistory'>,
  StackNavigationProp<RootStackParamList>
>;

const TIME_SLOTS: TimeSlotType[] = ['MORNING', 'AFTERNOON', 'EVENING', 'BEDTIME'];

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
  const { t } = useTranslation(['settings', 'common']);

  const today = todayStrFn();
  const [selectedDate, setSelectedDate] = useState(today);
  const [showCalendar, setShowCalendar] = useState(false);

  const isToday = selectedDate === today;
  const [, mo, da] = selectedDate.split('-').map(Number);

  const { data, isLoading } = useTodayMedication(isToday ? undefined : selectedDate);
  const { mutate: checkMedication } = useCheckMedication();
  const { mutate: deleteMedicationSchedule } = useDeleteMedicationSchedule();
  const { data: allSchedules = [] } = useAllMedicationSchedules(showCalendar);

  const animateAndSet = (newDate: string, _direction?: 'prev' | 'next') => {
    setSelectedDate(newDate);
  };

  // 이력 화면은 오늘까지만 탐색
  const isNextDisabled = selectedDate >= today;

  const [pendingIds, setPendingIds] = useState<Set<string>>(new Set());

  const handleCheck = (scheduleId: string, status: 'TAKEN' | 'SKIPPED', timeSlot: TimeSlotType) => {
    setPendingIds((prev) => new Set(prev).add(scheduleId));
    checkMedication(
      { scheduleId, req: { logDate: selectedDate, timeSlot, status } },
      { onSettled: () => setPendingIds((prev) => { const next = new Set(prev); next.delete(scheduleId); return next; }) }
    );
  };

  const handleDelete = (scheduleId: string, drugName: string) => {
    customAlert(t('settings:medication_delete_title'), t('settings:medication_delete_confirm_single', { name: drugName }), [
      { text: t('common:cancel'), style: 'cancel' },
      { text: t('common:delete'), style: 'destructive', onPress: () => deleteMedicationSchedule(scheduleId) },
    ]);
  };

  const slotGroups = useMemo<Record<TimeSlotType, SlotItem[]>>(() => {
    const groups: Record<TimeSlotType, SlotItem[]> = {
      MORNING: [], AFTERNOON: [], EVENING: [], BEDTIME: [],
    };
    for (const schedule of data?.schedules ?? []) {
      for (const slot of schedule.slots) {
        groups[slot.timeSlot as TimeSlotType].push({
          scheduleId: schedule.scheduleId,
          drugName: schedule.drugName,
          dosage: schedule.dosage,
          status: slot.status,
          logId: slot.logId,
          notifyTime: slot.notifyTime,
          groupId: slot.groupId,
          groupName: slot.groupName,
          timeSlot: slot.timeSlot as TimeSlotType,
        });
      }
    }
    return groups;
  }, [data]);

  // 그룹/시간 기준 섹션 (HomeScreen과 동일 로직) + notifyTime 기준 오름차순 정렬
  const sections = useMemo(() => {
    const sectionMap = new Map<string, { label: string; color: string; items: SlotItem[]; notifyTime?: string; timeSlot: TimeSlotType }>();
    for (const slot of TIME_SLOTS) {
      for (const item of slotGroups[slot]) {
        let sectionKey: string;
        let label: string;
        let sectionNotifyTime: string | undefined;
        const color = item.groupId ? '#6366F1' : SLOT_COLORS[slot];

        if (item.groupId) {
          sectionKey = item.groupId;
          label = item.groupName ?? SLOT_LABELS[slot];
          sectionNotifyTime = item.notifyTime;
        } else {
          const timeKey = item.notifyTime ? item.notifyTime.slice(0, 5) : slot;
          sectionKey = timeKey;
          label = item.notifyTime ? formatSlotTime(item.notifyTime) : SLOT_LABELS[slot];
          sectionNotifyTime = undefined;
        }

        if (!sectionMap.has(sectionKey)) {
          sectionMap.set(sectionKey, { label, color, items: [], notifyTime: sectionNotifyTime, timeSlot: slot });
        }
        sectionMap.get(sectionKey)!.items.push(item);
      }
    }
    return [...sectionMap.entries()]
      .map(([key, val]) => ({ key, ...val }))
      .sort((a, b) => {
        const ta = a.notifyTime ? a.notifyTime.slice(0, 5) : (/^\d{2}:\d{2}/.test(a.key) ? a.key.slice(0, 5) : '99:99');
        const tb = b.notifyTime ? b.notifyTime.slice(0, 5) : (/^\d{2}:\d{2}/.test(b.key) ? b.key.slice(0, 5) : '99:99');
        return ta.localeCompare(tb);
      });
  }, [slotGroups]);

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
  const hasAnySlots = sections.length > 0;

  // 캘린더 마킹 — 복약 일정 기간 하이라이트 (미래 포함)
  const markedDates = useMemo(() => {
    const marks: Record<string, any> = {};
    const fillBg = colors.primaryLight + '30';
    // 종료일 없는 진행 중 일정은 6개월 후까지 표시
    const maxMarkD = new Date(today);
    maxMarkD.setMonth(maxMarkD.getMonth() + 6);
    for (const s of allSchedules) {
      const start = s.startDate;
      if (!start) continue;
      const startD = new Date(start);
      const endD = s.endDate ? new Date(s.endDate) : maxMarkD;
      const cur = new Date(startD);
      while (cur <= endD) {
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
    if (day.dateString > today) return; // 미래 날짜 선택 차단
    setShowCalendar(false);
    animateAndSet(day.dateString);
  };

  const styles = getStyles(colors);

  const dateLabelSuffix = isToday ? t('settings:medication_today_suffix') : t('settings:medication_past_suffix');

  return (
    <SafeAreaView style={styles.container} edges={embedded ? [] : undefined}>
      {!embedded && <ScreenHeader variant="back" title={t('settings:medication_history_title')} />}

      {/* 날짜 네비게이션 */}
      <View style={styles.dateNavBar}>
        {/* 오늘 버튼 — 오늘이 아닐 때만 표시 (레이아웃 고정을 위해 항상 자리 차지) */}
        <TouchableOpacity
          onPress={() => animateAndSet(today, 'next')}
          hitSlop={8}
          style={[styles.dateNavSide, isToday && { opacity: 0 }]}
          disabled={isToday}
        >
          <Text style={styles.todayBtnText}>{t('settings:medication_today_label')}</Text>
        </TouchableOpacity>

        {/* 날짜 ← → */}
        <View style={styles.dateNavCenter}>
          <TouchableOpacity
            onPress={() => animateAndSet(getPrevDay(selectedDate), 'prev')}
            hitSlop={12}
            style={styles.dateNavBtn}
          >
            <Ionicons name="chevron-back" size={20} color={colors.primary} />
          </TouchableOpacity>
          <Text style={styles.dateNavLabel}>{t('settings:medication_month_day', { month: mo, day: da })}</Text>
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

        {/* 캘린더 버튼 */}
        <TouchableOpacity
          onPress={() => setShowCalendar(true)}
          hitSlop={8}
          style={styles.dateNavSide}
        >
          <Ionicons name="calendar-outline" size={20} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <View style={{ flex: 1 }}>
        {isLoading ? (
          <LoadingSpinner fullscreen />
        ) : (
          <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

            {/* 완료율 카드 */}
            <View style={styles.summaryCard}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryDate}>
                  {t('settings:medication_month_day', { month: mo, day: da })}{dateLabelSuffix}
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
                <Text style={styles.summaryEmpty}>{t('settings:medication_no_today')}</Text>
              ) : (
                <Text style={styles.summaryPercent}>{`${Math.round(completionRate * 100)}%`}</Text>
              )}
              {totalSlots > 0 && <Text style={styles.summaryLabel}>{t('settings:medication_complete')}</Text>}
            </View>

            {/* 시간대별 카드 */}
            {!hasAnySlots ? (
              <View style={styles.emptyWrap}>
                <Text style={styles.emptyText}>{t('settings:medication_no_active_for_date')}</Text>
                <Text style={styles.emptySubText}>{t('settings:medication_check_dates_hint')}</Text>
              </View>
            ) : (
              sections.map((section) => (
                <View key={section.key} style={styles.slotGroup}>
                  <View style={styles.slotHeaderRow}>
                    <Text style={[styles.slotHeaderLabel, { color: section.color }]}>
                      {section.label}
                    </Text>
                    {section.notifyTime && (
                      <Text style={styles.slotHeaderTime}>{formatSlotTime(section.notifyTime)}</Text>
                    )}
                  </View>
                  <View style={styles.medicationCardWrap}>
                    <MedicationCard
                      items={section.items}
                      pendingScheduleIds={pendingIds}
                      onDrugPress={(scheduleId, drugName) =>
                        navigation.navigate('MedicationScheduleDetail', { scheduleId, drugName })
                      }
                      onDelete={(scheduleId, drugName) => handleDelete(scheduleId, drugName)}
                      onTaken={(scheduleId) => handleCheck(scheduleId, 'TAKEN', section.timeSlot)}
                      onSkipped={(scheduleId) => handleCheck(scheduleId, 'SKIPPED', section.timeSlot)}
                    />
                  </View>
                </View>
              ))
            )}
          </ScrollView>
        )}
      </View>

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
              <Text style={styles.modalHeaderTitle}>{t('settings:medication_select_date_title')}</Text>
              <TouchableOpacity onPress={() => setShowCalendar(false)} hitSlop={12}>
                <Ionicons name="close" size={22} color={colors.text} />
              </TouchableOpacity>
            </View>
            <Calendar
              current={selectedDate}
              maxDate={today}
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
            <Text style={styles.modalHint}>{t('settings:medication_calendar_legend')}</Text>
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
      justifyContent: 'space-between',
      paddingHorizontal: sizes.spacing.lg,
      paddingVertical: sizes.spacing.sm,
    },
    dateNavSide: {
      width: 52,
      alignItems: 'center',
    },
    todayBtnText: {
      fontSize: sizes.font.sm,
      fontFamily: fontFamily.semibold,
      color: colors.primary,
    },
    dateNavCenter: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: sizes.spacing.sm,
    },
    dateNavBtn: {
      padding: sizes.spacing.xs,
    },
    dateNavLabel: {
      fontSize: sizes.font.md,
      fontFamily: fontFamily.semibold,
      color: colors.text,
      minWidth: 90,
      textAlign: 'center',
    },

    // ── 완료율 섹션 ──
    summaryCard: {
      gap: sizes.spacing.sm,
      marginBottom: sizes.spacing.xs,
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
