import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Calendar } from 'react-native-calendars';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { colors, sizes } from '@/constants';
import { useMonthlySchedules } from '@/features/schedule/hooks/useSchedule';
import type { ScheduleStackParamList } from '@/navigation/ScheduleNavigator';
import type { HospitalSchedule } from '@/shared/types/domain.types';

type Nav = StackNavigationProp<ScheduleStackParamList, 'ScheduleTab'>;
type ViewMode = 'monthly' | 'weekly';

const toDateString = (iso: string) => iso.split('T')[0];

const formatTime = (iso: string) => {
  // ISO 문자열에서 직접 시/분 추출 (타임존 변환 방지)
  const timePart = iso.includes('T') ? iso.split('T')[1] : iso;
  const [h, m] = timePart.split(':');
  return `${h}:${m}`;
};

const formatDateFull = (dateStr: string) => {
  const [, mo, d] = dateStr.split('-');
  return `${Number(mo)}월 ${Number(d)}일`;
};

const getWeekDates = (baseDate: Date): string[] => {
  const day = baseDate.getDay();
  const start = new Date(baseDate);
  start.setDate(start.getDate() - day);
  const dates: string[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    dates.push(d.toISOString().split('T')[0]);
  }
  return dates;
};

const getTodayString = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

export const ScheduleTab: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const today = new Date();
  const todayStr = getTodayString();
  const [viewMode, setViewMode] = useState<ViewMode>('monthly');
  const [visibleYear, setVisibleYear] = useState(today.getFullYear());
  const [visibleMonth, setVisibleMonth] = useState(today.getMonth() + 1);
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);

  const { data: schedules = [] } = useMonthlySchedules(visibleYear, visibleMonth);

  const markedDates = useMemo(() => {
    const marks: Record<string, any> = {};
    schedules.forEach((s) => {
      const d = toDateString(s.scheduledAt);
      marks[d] = {
        marked: true,
        dots: [{ key: 'schedule', color: colors.primary }],
      };
    });
    // 오늘 하이라이트
    if (!marks[todayStr]) {
      marks[todayStr] = {};
    }
    if (selectedDate !== todayStr) {
      marks[todayStr] = {
        ...marks[todayStr],
        customStyles: {
          container: { backgroundColor: colors.primaryLight + '30', borderRadius: 18 },
          text: { color: colors.primary, fontWeight: '700' },
        },
      };
    }
    // 선택된 날
    if (selectedDate) {
      marks[selectedDate] = {
        ...(marks[selectedDate] ?? {}),
        selected: true,
        selectedColor: colors.primary,
      };
    }
    return marks;
  }, [schedules, selectedDate, todayStr]);

  const displaySchedules = useMemo(() => {
    if (viewMode === 'weekly') {
      const weekDates = getWeekDates(new Date(selectedDate));
      return schedules
        .filter((s) => weekDates.includes(toDateString(s.scheduledAt)))
        .sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt));
    }
    return [...schedules].sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt));
  }, [schedules, viewMode, selectedDate]);

  const groupedSchedules = useMemo(() => {
    const map = new Map<string, HospitalSchedule[]>();
    displaySchedules.forEach((s) => {
      const d = toDateString(s.scheduledAt);
      if (!map.has(d)) map.set(d, []);
      map.get(d)!.push(s);
    });
    return Array.from(map.entries()).map(([date, items]) => ({ date, items }));
  }, [displaySchedules]);

  const handleDayPress = (day: { dateString: string }) => {
    setSelectedDate(day.dateString);

    // 해당 날짜 일정 확인
    const daySchedules = schedules.filter((s) => toDateString(s.scheduledAt) === day.dateString);
    if (daySchedules.length === 1) {
      // 일정 1개 → 바로 상세보기
      navigation.navigate('ScheduleDetail', { scheduleId: daySchedules[0].id });
    } else if (daySchedules.length === 0) {
      // 일정 없음 → 해당 날짜로 등록 화면
      navigation.navigate('ScheduleForm', { defaultDate: day.dateString });
    }
    // 2개 이상이면 아래 목록에서 선택
  };

  const goToToday = useCallback(() => {
    const now = new Date();
    setVisibleYear(now.getFullYear());
    setVisibleMonth(now.getMonth() + 1);
    setSelectedDate(getTodayString());
  }, []);

  const currentMonth = `${visibleYear}-${String(visibleMonth).padStart(2, '0')}-01`;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>일정</Text>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.todayBtn} onPress={goToToday} hitSlop={8}>
            <Text style={styles.todayBtnText}>오늘</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.prepNoteBtn}
            onPress={() => navigation.navigate('PrepNoteList')}
            hitSlop={8}
          >
            <Ionicons name="create-outline" size={16} color={colors.textInverse} />
            <Text style={styles.prepNoteBtnText}>준비 메모</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.viewToggle}>
        <TouchableOpacity
          style={[styles.toggleBtn, viewMode === 'monthly' && styles.toggleBtnActive]}
          onPress={() => setViewMode('monthly')}
        >
          <Text style={[styles.toggleBtnText, viewMode === 'monthly' && styles.toggleBtnTextActive]}>
            월간
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.toggleBtn, viewMode === 'weekly' && styles.toggleBtnActive]}
          onPress={() => setViewMode('weekly')}
        >
          <Text style={[styles.toggleBtnText, viewMode === 'weekly' && styles.toggleBtnTextActive]}>
            주간
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <Calendar
          key={currentMonth}
          current={currentMonth}
          markedDates={markedDates}
          markingType="multi-dot"
          onDayPress={handleDayPress}
          onMonthChange={(month) => {
            setVisibleYear(month.year);
            setVisibleMonth(month.month);
          }}
          enableSwipeMonths
          theme={calendarTheme}
          style={styles.calendar}
        />

        <View style={styles.scheduleList}>
          <View style={styles.listHeader}>
            <Text style={styles.listTitle}>
              {viewMode === 'monthly'
                ? `${visibleMonth}월 일정`
                : `${formatDateFull(selectedDate)} 주간`}
            </Text>
            <Text style={styles.listCount}>{displaySchedules.length}건</Text>
          </View>

          {groupedSchedules.length === 0 ? (
            <View style={styles.emptyWrap}>
              <Ionicons name="calendar-outline" size={36} color={colors.textDisabled} />
              <Text style={styles.emptyText}>일정이 없어요</Text>
            </View>
          ) : (
            groupedSchedules.map(({ date, items }) => (
              <View key={date}>
                <Text style={styles.dateLabel}>{formatDateFull(date)}</Text>
                {items.map((item) => (
                  <ScheduleListItem
                    key={item.id}
                    schedule={item}
                    isToday={date === todayStr}
                    onPress={() => navigation.navigate('ScheduleDetail', { scheduleId: item.id })}
                  />
                ))}
              </View>
            ))
          )}
        </View>
      </ScrollView>

      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('ScheduleForm', { defaultDate: selectedDate })}
        activeOpacity={0.85}
      >
        <Ionicons name="add" size={28} color={colors.textInverse} />
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const ScheduleListItem: React.FC<{
  schedule: HospitalSchedule;
  isToday: boolean;
  onPress: () => void;
}> = ({ schedule, isToday, onPress }) => (
  <TouchableOpacity
    style={[styles.listItem, isToday && styles.listItemToday]}
    onPress={onPress}
    activeOpacity={0.75}
  >
    <View style={[styles.listItemDot, isToday && styles.listItemDotToday]} />
    <View style={styles.listItemBody}>
      <Text style={styles.listItemHospital}>{schedule.hospitalName}</Text>
      {schedule.doctorName && (
        <Text style={styles.listItemDoctor}>{schedule.doctorName} 선생님</Text>
      )}
    </View>
    <Text style={styles.listItemTime}>{formatTime(schedule.scheduledAt)}</Text>
    <Ionicons name="chevron-forward" size={16} color={colors.textDisabled} />
  </TouchableOpacity>
);

const calendarTheme = {
  backgroundColor: 'transparent',
  calendarBackground: 'transparent',
  selectedDayBackgroundColor: colors.primary,
  selectedDayTextColor: colors.textInverse,
  todayTextColor: colors.primary,
  todayBackgroundColor: colors.primaryLight + '30',
  dayTextColor: colors.text,
  textDisabledColor: colors.textDisabled,
  dotColor: colors.primary,
  monthTextColor: colors.text,
  arrowColor: colors.primary,
  textSectionTitleColor: colors.textSub,
  textMonthFontSize: sizes.font.lg,
  textMonthFontWeight: '700' as const,
  textDayHeaderFontSize: sizes.font.sm,
  textDayHeaderFontWeight: '600' as const,
  textDayFontSize: sizes.font.md,
  textDayFontWeight: '400' as const,
  'stylesheet.calendar.header': {
    header: {
      flexDirection: 'row' as const,
      justifyContent: 'space-between' as const,
      alignItems: 'center' as const,
      paddingHorizontal: 10,
      paddingVertical: 12,
    },
    dayTextAtIndex0: { color: colors.error },
    dayTextAtIndex6: { color: colors.primary },
  },
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    height: sizes.headerHeight,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: sizes.spacing.lg,
  },
  headerTitle: {
    fontSize: sizes.font.xl,
    fontWeight: sizes.fontWeight.bold,
    color: colors.text,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: sizes.spacing.sm,
  },
  todayBtn: {
    paddingHorizontal: sizes.spacing.md,
    paddingVertical: sizes.spacing.xs,
    borderRadius: sizes.radius.full,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  todayBtnText: {
    fontSize: sizes.font.sm,
    color: colors.primary,
    fontWeight: sizes.fontWeight.semibold,
  },
  prepNoteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.primary,
    paddingHorizontal: sizes.spacing.md,
    paddingVertical: sizes.spacing.xs + 2,
    borderRadius: sizes.radius.full,
  },
  prepNoteBtnText: {
    fontSize: sizes.font.sm,
    color: colors.textInverse,
    fontWeight: sizes.fontWeight.semibold,
  },
  viewToggle: {
    flexDirection: 'row',
    marginHorizontal: sizes.spacing.lg,
    marginBottom: sizes.spacing.sm,
    backgroundColor: colors.disabled,
    borderRadius: sizes.radius.full,
    padding: 2,
  },
  toggleBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: sizes.spacing.xs + 2,
    borderRadius: sizes.radius.full,
  },
  toggleBtnActive: {
    backgroundColor: colors.surfaceSolid,
    shadowColor: colors.glassShadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 2,
  },
  toggleBtnText: {
    fontSize: sizes.font.sm,
    color: colors.textSub,
    fontWeight: sizes.fontWeight.medium,
  },
  toggleBtnTextActive: {
    color: colors.primary,
    fontWeight: sizes.fontWeight.bold,
  },
  scrollContent: {
    paddingBottom: sizes.tabBarSafeBottom + 80,
  },
  calendar: {
    paddingBottom: sizes.spacing.sm,
  },
  scheduleList: {
    paddingHorizontal: sizes.spacing.lg,
    gap: sizes.spacing.sm,
  },
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: sizes.spacing.sm,
  },
  listTitle: {
    fontSize: sizes.font.md,
    fontWeight: sizes.fontWeight.bold,
    color: colors.text,
  },
  listCount: {
    fontSize: sizes.font.sm,
    color: colors.textSub,
  },
  dateLabel: {
    fontSize: sizes.font.xs,
    fontWeight: sizes.fontWeight.semibold,
    color: colors.textSub,
    marginTop: sizes.spacing.sm,
    marginBottom: sizes.spacing.xs,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceSolid,
    borderRadius: sizes.radius.lg,
    padding: sizes.spacing.md,
    marginBottom: sizes.spacing.sm,
    gap: sizes.spacing.md,
    borderWidth: 1,
    borderColor: colors.divider,
  },
  listItemToday: {
    borderColor: colors.primaryLight,
    backgroundColor: colors.primaryLight + '08',
  },
  listItemDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.textDisabled,
  },
  listItemDotToday: {
    backgroundColor: colors.primary,
  },
  listItemBody: { flex: 1 },
  listItemHospital: {
    fontSize: sizes.font.md,
    fontWeight: sizes.fontWeight.semibold,
    color: colors.text,
  },
  listItemDoctor: {
    fontSize: sizes.font.sm,
    color: colors.textSub,
    marginTop: 2,
  },
  listItemTime: {
    fontSize: sizes.font.sm,
    color: colors.textSub,
    fontWeight: sizes.fontWeight.medium,
  },
  emptyWrap: {
    alignItems: 'center',
    paddingVertical: sizes.spacing.xxl,
    gap: sizes.spacing.sm,
  },
  emptyText: {
    fontSize: sizes.font.md,
    color: colors.textSub,
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
    zIndex: 5,
  },
});
