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
import { useTheme, sizes, fontFamily } from '@/shared/theme';
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
  const { colors } = useTheme();
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
          text: { color: colors.primary, fontFamily: fontFamily.bold },
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
  }, [schedules, selectedDate, todayStr, colors]);

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

  const calendarTheme = useMemo(() => ({
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
  }), [colors]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: colors.text, fontFamily: fontFamily.bold }]}>일정</Text>
        <View style={styles.headerRight}>
          <TouchableOpacity style={[styles.todayBtn, { borderColor: colors.primary }]} onPress={goToToday} hitSlop={8}>
            <Text style={[styles.todayBtnText, { color: colors.primary, fontFamily: fontFamily.semibold }]}>오늘</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.prepNoteBtn, { backgroundColor: colors.primary }]}
            onPress={() => navigation.navigate('PrepNoteList')}
            hitSlop={8}
          >
            <Ionicons name="create-outline" size={16} color={colors.textInverse} />
            <Text style={[styles.prepNoteBtnText, { color: colors.textInverse, fontFamily: fontFamily.semibold }]}>준비 메모</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={[styles.viewToggle, { backgroundColor: colors.disabled }]}>
        <TouchableOpacity
          style={[
            styles.toggleBtn,
            viewMode === 'monthly' && {
              backgroundColor: colors.surface,
              shadowColor: colors.glassShadow,
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 1,
              shadowRadius: 4,
              elevation: 2,
            },
          ]}
          onPress={() => setViewMode('monthly')}
        >
          <Text style={[
            styles.toggleBtnText,
            { color: colors.textSub, fontFamily: fontFamily.medium },
            viewMode === 'monthly' && { color: colors.primary, fontFamily: fontFamily.bold },
          ]}>
            월간
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.toggleBtn,
            viewMode === 'weekly' && {
              backgroundColor: colors.surface,
              shadowColor: colors.glassShadow,
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 1,
              shadowRadius: 4,
              elevation: 2,
            },
          ]}
          onPress={() => setViewMode('weekly')}
        >
          <Text style={[
            styles.toggleBtnText,
            { color: colors.textSub, fontFamily: fontFamily.medium },
            viewMode === 'weekly' && { color: colors.primary, fontFamily: fontFamily.bold },
          ]}>
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
            <Text style={[styles.listTitle, { color: colors.text, fontFamily: fontFamily.bold }]}>
              {viewMode === 'monthly'
                ? `${visibleMonth}월 일정`
                : `${formatDateFull(selectedDate)} 주간`}
            </Text>
            <Text style={[styles.listCount, { color: colors.textSub }]}>{displaySchedules.length}건</Text>
          </View>

          {groupedSchedules.length === 0 ? (
            <View style={styles.emptyWrap}>
              <Ionicons name="calendar-outline" size={36} color={colors.textDisabled} />
              <Text style={[styles.emptyText, { color: colors.textSub }]}>일정이 없어요</Text>
            </View>
          ) : (
            groupedSchedules.map(({ date, items }) => (
              <View key={date}>
                <Text style={[styles.dateLabel, { color: colors.textSub, fontFamily: fontFamily.semibold }]}>{formatDateFull(date)}</Text>
                {items.map((item) => (
                  <ScheduleListItem
                    key={item.id}
                    schedule={item}
                    isToday={date === todayStr}
                    onPress={() => navigation.navigate('ScheduleDetail', { scheduleId: item.id })}
                    colors={colors}
                  />
                ))}
              </View>
            ))
          )}
        </View>
      </ScrollView>

      <TouchableOpacity
        style={[styles.fab, { backgroundColor: colors.primary, shadowColor: colors.glassShadow }]}
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
  colors: any;
}> = ({ schedule, isToday, onPress, colors }) => (
  <TouchableOpacity
    style={[
      styles.listItem,
      { backgroundColor: colors.surface, borderColor: colors.divider },
      isToday && { borderColor: colors.primaryLight, backgroundColor: colors.primaryLight + '08' },
    ]}
    onPress={onPress}
    activeOpacity={0.75}
  >
    <View style={[styles.listItemDot, { backgroundColor: isToday ? colors.primary : colors.textDisabled }]} />
    <View style={styles.listItemBody}>
      <Text style={[styles.listItemHospital, { color: colors.text, fontFamily: fontFamily.semibold }]}>{schedule.hospitalName}</Text>
      {schedule.doctorName && (
        <Text style={[styles.listItemDoctor, { color: colors.textSub }]}>{schedule.doctorName} 선생님</Text>
      )}
    </View>
    <Text style={[styles.listItemTime, { color: colors.textSub, fontFamily: fontFamily.medium }]}>{formatTime(schedule.scheduledAt)}</Text>
    <Ionicons name="chevron-forward" size={16} color={colors.textDisabled} />
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    height: sizes.headerHeight,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: sizes.spacing.lg,
  },
  headerTitle: {
    fontSize: sizes.font.xl,
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
  },
  todayBtnText: {
    fontSize: sizes.font.sm,
  },
  prepNoteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: sizes.spacing.md,
    paddingVertical: sizes.spacing.xs + 2,
    borderRadius: sizes.radius.full,
  },
  prepNoteBtnText: {
    fontSize: sizes.font.sm,
  },
  viewToggle: {
    flexDirection: 'row',
    marginHorizontal: sizes.spacing.lg,
    marginBottom: sizes.spacing.sm,
    borderRadius: sizes.radius.full,
    padding: 2,
  },
  toggleBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: sizes.spacing.xs + 2,
    borderRadius: sizes.radius.full,
  },
  toggleBtnText: {
    fontSize: sizes.font.sm,
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
  },
  listCount: {
    fontSize: sizes.font.sm,
  },
  dateLabel: {
    fontSize: sizes.font.xs,
    marginTop: sizes.spacing.sm,
    marginBottom: sizes.spacing.xs,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: sizes.radius.lg,
    padding: sizes.spacing.md,
    marginBottom: sizes.spacing.sm,
    gap: sizes.spacing.md,
    borderWidth: 1,
  },
  listItemDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  listItemBody: { flex: 1 },
  listItemHospital: {
    fontSize: sizes.font.md,
  },
  listItemDoctor: {
    fontSize: sizes.font.sm,
    marginTop: 2,
  },
  listItemTime: {
    fontSize: sizes.font.sm,
  },
  emptyWrap: {
    alignItems: 'center',
    paddingVertical: sizes.spacing.xxl,
    gap: sizes.spacing.sm,
  },
  emptyText: {
    fontSize: sizes.font.md,
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
    zIndex: 5,
  },
});
