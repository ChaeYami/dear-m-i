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
import { LinearGradient } from 'expo-linear-gradient';
import type { StackNavigationProp } from '@react-navigation/stack';
import { useTranslation } from 'react-i18next';
import { useTheme, sizes, fontFamily } from '@/shared/theme';
import { softShadow, floatingShadow } from '@/shared/theme/shadows';
import { AnimatedPressable } from '@/shared/components/AnimatedPressable';
import { ScreenHeader } from '@/shared/components/ScreenHeader';
import { useResetStackOnTabFocus } from '@/shared/hooks/useResetStackOnTabFocus';
import { useTabBarSafeBottom } from '@/shared/hooks/useTabBarSafeBottom';
import { useMonthlySchedules, useAllSchedules } from '@/features/schedule/hooks/useSchedule';
import type { ScheduleStackParamList } from '@/navigation/ScheduleNavigator';
import type { HospitalSchedule } from '@/shared/types/domain.types';

type Nav = StackNavigationProp<ScheduleStackParamList, 'ScheduleTab'>;
type ViewMode = 'monthly' | 'weekly' | 'all';

const WEEK_DAYS_LABEL = ['일', '월', '화', '수', '목', '금', '토'];

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
  useResetStackOnTabFocus();
  const { colors } = useTheme();
  const navigation = useNavigation<Nav>();
  const { t } = useTranslation('common');
  const today = new Date();
  const todayStr = getTodayString();
  const [viewMode, setViewMode] = useState<ViewMode>('monthly');
  const [visibleYear, setVisibleYear] = useState(today.getFullYear());
  const [visibleMonth, setVisibleMonth] = useState(today.getMonth() + 1);
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);

  const tabBarSafeBottom = useTabBarSafeBottom();

  const { data: schedules = [] } = useMonthlySchedules(visibleYear, visibleMonth);
  const { data: allSchedules = [] } = useAllSchedules(viewMode === 'all');

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
    if (viewMode === 'all') {
      return [...allSchedules].sort((a, b) => b.scheduledAt.localeCompare(a.scheduledAt));
    }
    if (viewMode === 'weekly') {
      const weekDates = getWeekDates(new Date(selectedDate));
      return schedules
        .filter((s) => weekDates.includes(toDateString(s.scheduledAt)))
        .sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt));
    }
    return [...schedules].sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt));
  }, [schedules, allSchedules, viewMode, selectedDate]);

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

  const isPast = useCallback((iso: string) => {
    return toDateString(iso) < todayStr;
  }, [todayStr]);

  const calendarTheme = useMemo(() => ({
    backgroundColor: 'transparent',
    calendarBackground: 'transparent',
    selectedDayBackgroundColor: colors.primary,
    selectedDayTextColor: colors.textInverse,
    todayTextColor: colors.primary,
    todayBackgroundColor: colors.primaryMuted,
    dayTextColor: colors.text,
    textDisabledColor: colors.textDisabled,
    dotColor: colors.primary,
    monthTextColor: colors.text,
    arrowColor: colors.primary,
    textSectionTitleColor: colors.textSub,
    textMonthFontSize: sizes.font.lg,
    textMonthFontFamily: fontFamily.bold,
    textDayHeaderFontSize: sizes.font.sm,
    textDayHeaderFontFamily: fontFamily.semibold,
    textDayFontSize: sizes.font.md + 1,
    textDayFontFamily: fontFamily.medium,
    'stylesheet.calendar.header': {
      header: {
        flexDirection: 'row' as const,
        justifyContent: 'space-between' as const,
        alignItems: 'center' as const,
        paddingHorizontal: 10,
        paddingVertical: 14,
      },
      dayTextAtIndex0: { color: colors.error },
      dayTextAtIndex6: { color: colors.primary },
    },
    'stylesheet.day.basic': {
      base: {
        width: 40,
        height: 40,
        alignItems: 'center' as const,
        justifyContent: 'center' as const,
        borderRadius: 14,
      },
      selected: {
        borderRadius: 14,
      },
      today: {
        borderRadius: 14,
      },
    },
  }), [colors]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScreenHeader variant="tab" title={t('tab_schedule')} rightContent={
        <TouchableOpacity
          style={[styles.prepNoteBtn, { backgroundColor: colors.primary }]}
          onPress={() => navigation.navigate('PrepNoteList')}
          hitSlop={8}
        >
          <Ionicons name="create-outline" size={16} color={colors.textInverse} />
          <Text style={[styles.prepNoteBtnText, { color: colors.textInverse, fontFamily: fontFamily.semibold }]}>준비 메모</Text>
        </TouchableOpacity>
      } />

      <View style={[styles.viewToggle, { backgroundColor: colors.disabled }]}>
        {(['monthly', 'weekly', 'all'] as const).map((mode) => {
          const label = mode === 'monthly' ? '월간' : mode === 'weekly' ? '주간' : '전체';
          const active = viewMode === mode;
          return (
            <TouchableOpacity
              key={mode}
              style={[
                styles.toggleBtn,
                active && {
                  backgroundColor: colors.surface,
                  shadowColor: colors.glassShadow,
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 1,
                  shadowRadius: 4,
                  elevation: 2,
                },
              ]}
              onPress={() => setViewMode(mode)}
            >
              <Text style={[
                styles.toggleBtnText,
                { color: colors.textSub, fontFamily: fontFamily.medium },
                active && { color: colors.primary, fontFamily: fontFamily.bold },
              ]}>
                {label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: tabBarSafeBottom + 80 }]}
      >
        {viewMode === 'monthly' && (
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
            renderHeader={(date: any) => {
              const d: Date = date instanceof Date ? date : new Date(date);
              const isCurrentMonth =
                d.getFullYear() === today.getFullYear() && d.getMonth() === today.getMonth();
              return (
                <View style={styles.calendarHeader}>
                  <Text style={[styles.calendarHeaderText, { color: colors.text, fontFamily: fontFamily.bold }]}>
                    {d.getFullYear()}년 {d.getMonth() + 1}월
                  </Text>
                  {!isCurrentMonth && (
                    <TouchableOpacity
                      style={[styles.todayBtn, { borderColor: colors.primary }]}
                      onPress={goToToday}
                      hitSlop={8}
                    >
                      <Text style={[styles.todayBtnText, { color: colors.primary, fontFamily: fontFamily.semibold }]}>오늘</Text>
                    </TouchableOpacity>
                  )}
                </View>
              );
            }}
          />
        )}

        {viewMode === 'weekly' && (
          <WeekStrip
            selectedDate={selectedDate}
            schedules={schedules}
            colors={colors}
            todayStr={todayStr}
            onDayPress={handleDayPress}
            onPrevWeek={() => {
              const d = new Date(selectedDate);
              d.setDate(d.getDate() - 7);
              const newDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
              setSelectedDate(newDate);
              setVisibleYear(d.getFullYear());
              setVisibleMonth(d.getMonth() + 1);
            }}
            onNextWeek={() => {
              const d = new Date(selectedDate);
              d.setDate(d.getDate() + 7);
              const newDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
              setSelectedDate(newDate);
              setVisibleYear(d.getFullYear());
              setVisibleMonth(d.getMonth() + 1);
            }}
            onToday={goToToday}
          />
        )}

        <View style={styles.scheduleList}>
          <View style={styles.listHeader}>
            <Text style={[styles.listTitle, { color: colors.text, fontFamily: fontFamily.bold }]}>
              {viewMode === 'all'
                ? '전체 일정'
                : viewMode === 'monthly'
                ? `${visibleMonth}월 일정`
                : `${formatDateFull(selectedDate)} 주간`}
            </Text>
            <Text style={[styles.listCount, { color: colors.textSub, fontFamily: fontFamily.medium }]}>{displaySchedules.length}건</Text>
          </View>

          {groupedSchedules.length === 0 ? (
            <View style={[styles.emptyWrap, { backgroundColor: colors.surface, borderRadius: sizes.radius.xxl }, softShadow(colors)]}>
              <Ionicons name="calendar-outline" size={48} color={colors.primaryLight} />
              <Text style={[styles.emptyTitle, { color: colors.textSub, fontFamily: fontFamily.semibold }]}>일정이 없어요</Text>
              <Text style={[styles.emptySubText, { color: colors.textDisabled, fontFamily: fontFamily.medium }]}>
                새 일정을 추가해 보세요
              </Text>
            </View>
          ) : (
            groupedSchedules.map(({ date, items }) => (
              <View key={date} style={styles.dateGroup}>
                <Text style={[styles.dateLabel, { color: colors.textSub, fontFamily: fontFamily.semibold }]}>{formatDateFull(date)}</Text>
                {items.map((item) => (
                  <ScheduleListItem
                    key={item.id}
                    schedule={item}
                    isToday={date === todayStr}
                    isPast={isPast(item.scheduledAt)}
                    onPress={() => navigation.navigate('ScheduleDetail', { scheduleId: item.id })}
                    colors={colors}
                  />
                ))}
              </View>
            ))
          )}
        </View>
      </ScrollView>

      <AnimatedPressable
        onPress={() => navigation.navigate('ScheduleForm', { defaultDate: selectedDate })}
        style={[styles.fab, { bottom: tabBarSafeBottom + sizes.spacing.md }, floatingShadow(colors)]}
        scaleValue={0.92}
      >
        <LinearGradient
          colors={[colors.primaryVivid, colors.primaryVividDark]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.fabGradient}
        >
          <Ionicons name="add" size={30} color={colors.textInverse} />
        </LinearGradient>
      </AnimatedPressable>
    </SafeAreaView>
  );
};

/** 주간 캘린더 (7일 가로 스트립) */
const WeekStrip: React.FC<{
  selectedDate: string;
  schedules: HospitalSchedule[];
  colors: any;
  todayStr: string;
  onDayPress: (day: { dateString: string }) => void;
  onPrevWeek: () => void;
  onNextWeek: () => void;
  onToday: () => void;
}> = ({ selectedDate, schedules, colors, todayStr, onDayPress, onPrevWeek, onNextWeek, onToday }) => {
  const weekDates = useMemo(() => getWeekDates(new Date(selectedDate)), [selectedDate]);
  const scheduleDateSet = useMemo(
    () => new Set(schedules.map((s) => toDateString(s.scheduledAt))),
    [schedules]
  );

  const start = new Date(weekDates[0]);
  const end = new Date(weekDates[6]);
  const headerLabel =
    start.getMonth() === end.getMonth()
      ? `${start.getFullYear()}년 ${start.getMonth() + 1}월`
      : `${start.getFullYear()}년 ${start.getMonth() + 1}월 - ${end.getMonth() + 1}월`;

  const isCurrentWeek = weekDates.includes(todayStr);

  return (
    <View style={styles.weekStripWrap}>
      {/* 헤더: 좌우 화살표 + 월/년 + (오늘 버튼) */}
      <View style={styles.weekStripHeader}>
        <TouchableOpacity onPress={onPrevWeek} hitSlop={8}>
          <Ionicons name="chevron-back" size={20} color={colors.primary} />
        </TouchableOpacity>
        <Text style={[styles.calendarHeaderText, { color: colors.text, fontFamily: fontFamily.bold }]}>
          {headerLabel}
        </Text>
        <TouchableOpacity onPress={onNextWeek} hitSlop={8}>
          <Ionicons name="chevron-forward" size={20} color={colors.primary} />
        </TouchableOpacity>
        {!isCurrentWeek && (
          <TouchableOpacity
            style={[styles.todayBtn, { borderColor: colors.primary, marginLeft: sizes.spacing.sm }]}
            onPress={onToday}
            hitSlop={8}
          >
            <Text style={[styles.todayBtnText, { color: colors.primary, fontFamily: fontFamily.semibold }]}>오늘</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* 요일 헤더 */}
      <View style={styles.weekStripRow}>
        {WEEK_DAYS_LABEL.map((label, idx) => (
          <View key={label} style={styles.weekStripCell}>
            <Text
              style={[
                styles.weekStripDayLabel,
                {
                  color:
                    idx === 0 ? colors.error : idx === 6 ? colors.primary : colors.textSub,
                  fontFamily: fontFamily.semibold,
                },
              ]}
            >
              {label}
            </Text>
          </View>
        ))}
      </View>

      {/* 날짜 행 */}
      <View style={styles.weekStripRow}>
        {weekDates.map((dateStr) => {
          const d = new Date(dateStr);
          const isSelected = dateStr === selectedDate;
          const isToday = dateStr === todayStr;
          const hasSchedule = scheduleDateSet.has(dateStr);
          return (
            <TouchableOpacity
              key={dateStr}
              style={styles.weekStripCell}
              onPress={() => onDayPress({ dateString: dateStr })}
              activeOpacity={0.7}
            >
              <View
                style={[
                  styles.weekStripDateCircle,
                  isSelected && { backgroundColor: colors.primary },
                  !isSelected && isToday && { backgroundColor: colors.primaryLight + '30' },
                ]}
              >
                <Text
                  style={[
                    styles.weekStripDateText,
                    {
                      color: isSelected
                        ? colors.textInverse
                        : isToday
                        ? colors.primary
                        : colors.text,
                      fontFamily: isSelected || isToday ? fontFamily.bold : fontFamily.medium,
                    },
                  ]}
                >
                  {d.getDate()}
                </Text>
              </View>
              {hasSchedule && (
                <View
                  style={[
                    styles.weekStripDot,
                    { backgroundColor: isSelected ? colors.textInverse : colors.primary },
                  ]}
                />
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const ScheduleListItem: React.FC<{
  schedule: HospitalSchedule;
  isToday: boolean;
  isPast: boolean;
  onPress: () => void;
  colors: any;
}> = ({ schedule, isToday, isPast, onPress, colors }) => (
  <AnimatedPressable
    onPress={onPress}
    style={[
      styles.listItem,
      { backgroundColor: colors.surface },
      softShadow(colors),
      isToday && { backgroundColor: colors.primaryMuted },
    ]}
  >
    <View
      style={[
        styles.listItemBar,
        { backgroundColor: isPast ? colors.secondary : colors.primary },
        isToday && { backgroundColor: colors.primary },
      ]}
    />
    <View style={styles.listItemBody}>
      <Text style={[styles.listItemHospital, { color: colors.text, fontFamily: fontFamily.semibold }]}>{schedule.hospitalName}</Text>
      {schedule.doctorName && (
        <Text style={[styles.listItemDoctor, { color: colors.textSub, fontFamily: fontFamily.medium }]}>{schedule.doctorName} 선생님</Text>
      )}
    </View>
    <Text style={[styles.listItemTime, { color: colors.textSub, fontFamily: fontFamily.medium }]}>{formatTime(schedule.scheduledAt)}</Text>
    <Ionicons name="chevron-forward" size={16} color={colors.textDisabled} />
  </AnimatedPressable>
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
  calendarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: sizes.spacing.md,
    paddingVertical: sizes.spacing.xs,
  },
  calendarHeaderText: {
    fontSize: sizes.font.lg,
  },
  weekStripWrap: {
    paddingHorizontal: sizes.spacing.lg,
    paddingTop: sizes.spacing.sm,
    paddingBottom: sizes.spacing.md,
    gap: sizes.spacing.sm,
  },
  weekStripHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: sizes.spacing.md,
    paddingVertical: sizes.spacing.xs,
  },
  weekStripRow: {
    flexDirection: 'row',
  },
  weekStripCell: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 4,
  },
  weekStripDayLabel: {
    fontSize: sizes.font.xs,
  },
  weekStripDateCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  weekStripDateText: {
    fontSize: sizes.font.md,
  },
  weekStripDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    marginTop: 2,
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
  scrollContent: {},
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
    paddingVertical: sizes.spacing.md,
  },
  listTitle: {
    fontSize: sizes.font.md,
  },
  listCount: {
    fontSize: sizes.font.sm,
  },
  dateGroup: {
    gap: sizes.spacing.sm,
  },
  dateLabel: {
    fontSize: sizes.font.xs,
    marginTop: sizes.spacing.sm,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: sizes.radius.xxl,
    padding: sizes.spacing.md,
    gap: sizes.spacing.md,
    overflow: 'hidden',
  },
  listItemBar: {
    width: 4,
    height: '70%',
    borderRadius: 2,
    minHeight: 32,
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
    paddingVertical: sizes.spacing.xxl + 8,
    paddingHorizontal: sizes.spacing.lg,
    gap: sizes.spacing.sm,
    marginTop: sizes.spacing.sm,
  },
  emptyTitle: {
    fontSize: sizes.font.md,
    marginTop: sizes.spacing.xs,
  },
  emptySubText: {
    fontSize: sizes.font.sm,
  },
  fab: {
    position: 'absolute',
    right: sizes.spacing.xl,
    width: 60,
    height: 60,
    borderRadius: 30,
    zIndex: 5,
  },
  fabGradient: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
