import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  FlatList,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import type { StackNavigationProp } from '@react-navigation/stack';
import { useTranslation } from 'react-i18next';
import { useTheme, sizes, fontFamily } from '@/shared/theme';
import { softShadow, floatingShadow } from '@/shared/theme/shadows';
import { AnimatedPressable } from '@/shared/components/AnimatedPressable';
import { ScreenHeader } from '@/shared/components/ScreenHeader';
import { SectionTitle } from '@/shared/components/SectionTitle';
import { useResetStackOnTabFocus } from '@/shared/hooks/useResetStackOnTabFocus';
import { useTabBarSafeBottom } from '@/shared/hooks/useTabBarSafeBottom';
import { useTabBarScrollHide } from '@/shared/hooks/useTabBarScrollHide';
import { useMonthlySchedules, useAllSchedules } from '@/features/schedule/hooks/useSchedule';
import { DatePickerModal } from '@/features/schedule/components/DatePickerModal';
import type { ScheduleStackParamList } from '@/navigation/ScheduleNavigator';
import type { HospitalSchedule } from '@/shared/types/domain.types';

type Nav = StackNavigationProp<ScheduleStackParamList, 'ScheduleTab'>;
type ViewMode = 'week' | 'all';

const WEEK_DAYS_LABEL = ['일', '월', '화', '수', '목', '금', '토'];

const toDateString = (iso: string) => iso.split('T')[0];

const formatTime = (iso: string) => {
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
  const [viewMode, setViewMode] = useState<ViewMode>('week');
  const [visibleYear, setVisibleYear] = useState(today.getFullYear());
  const [visibleMonth, setVisibleMonth] = useState(today.getMonth() + 1);
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [pickerOpen, setPickerOpen] = useState(false);

  const tabBarSafeBottom = useTabBarSafeBottom();
  const scrollHandlers = useTabBarScrollHide();

  const { data: monthlySchedules = [] } = useMonthlySchedules(visibleYear, visibleMonth);
  const { data: allSchedules = [] } = useAllSchedules(true);

  const highlightedDates = useMemo(
    () => new Set(allSchedules.map((s) => toDateString(s.scheduledAt))),
    [allSchedules],
  );

  // 선택된 날짜의 일정
  const selectedDaySchedules = useMemo(() => {
    if (viewMode !== 'week') return [];
    return allSchedules
      .filter((s) => toDateString(s.scheduledAt) === selectedDate)
      .sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt));
  }, [allSchedules, selectedDate, viewMode]);

  // 주간 일정 (선택된 날짜 제외)
  const weekSchedules = useMemo(() => {
    if (viewMode !== 'week') return [];
    const weekDates = getWeekDates(new Date(selectedDate));
    return monthlySchedules
      .filter((s) => {
        const d = toDateString(s.scheduledAt);
        return weekDates.includes(d) && d !== selectedDate;
      })
      .sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt));
  }, [monthlySchedules, viewMode, selectedDate]);

  // 전체 보기용
  const allDisplaySchedules = useMemo(() => {
    if (viewMode !== 'all') return [];
    return [...allSchedules].sort((a, b) => b.scheduledAt.localeCompare(a.scheduledAt));
  }, [allSchedules, viewMode]);

  const allGrouped = useMemo(() => {
    const map = new Map<string, HospitalSchedule[]>();
    allDisplaySchedules.forEach((s) => {
      const d = toDateString(s.scheduledAt);
      if (!map.has(d)) map.set(d, []);
      map.get(d)!.push(s);
    });
    return Array.from(map.entries()).map(([date, items]) => ({ date, items }));
  }, [allDisplaySchedules]);

  const weekGrouped = useMemo(() => {
    const map = new Map<string, HospitalSchedule[]>();
    weekSchedules.forEach((s) => {
      const d = toDateString(s.scheduledAt);
      if (!map.has(d)) map.set(d, []);
      map.get(d)!.push(s);
    });
    return Array.from(map.entries()).map(([date, items]) => ({ date, items }));
  }, [weekSchedules]);

  const handleDayPress = useCallback((dateString: string) => {
    setSelectedDate(dateString);
  }, []);

  const goToToday = useCallback(() => {
    const now = new Date();
    setVisibleYear(now.getFullYear());
    setVisibleMonth(now.getMonth() + 1);
    setSelectedDate(getTodayString());
  }, []);

  const handlePrevMonth = () => {
    let y = visibleYear;
    let m = visibleMonth - 1;
    if (m === 0) { m = 12; y -= 1; }
    setVisibleYear(y);
    setVisibleMonth(m);
    if (viewMode === 'week') setSelectedDate(`${y}-${String(m).padStart(2, '0')}-01`);
  };

  const handleNextMonth = () => {
    let y = visibleYear;
    let m = visibleMonth + 1;
    if (m === 13) { m = 1; y += 1; }
    setVisibleYear(y);
    setVisibleMonth(m);
    if (viewMode === 'week') setSelectedDate(`${y}-${String(m).padStart(2, '0')}-01`);
  };

  const isPast = useCallback((iso: string) => toDateString(iso) < todayStr, [todayStr]);

  const isOnToday =
    visibleYear === today.getFullYear() && visibleMonth === today.getMonth() + 1 && selectedDate === todayStr;

  const monthLabel = `${visibleYear}.${String(visibleMonth).padStart(2, '0')}`;
  const totalWeekCount = selectedDaySchedules.length + weekSchedules.length;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScreenHeader variant="tab" title={t('tab_schedule')} hasNotification />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: tabBarSafeBottom + 80 }]}
        {...scrollHandlers}
      >
        {/* 준비 메모 */}
        <View style={styles.toolRow}>
          <TouchableOpacity
            onPress={() => navigation.navigate('PrepNoteList')}
            style={[styles.prepNoteChip, { backgroundColor: colors.accentMuted, borderColor: colors.accent + '33' }]}
            hitSlop={8}
          >
            <Ionicons name="create-outline" size={14} color={colors.accent} />
            <Text style={[styles.prepNoteChipText, { color: colors.accent, fontFamily: fontFamily.semibold }]}>
              준비 메모
            </Text>
          </TouchableOpacity>
        </View>

        {/* 통합 카드 */}
        <View style={[styles.unifiedCard, { backgroundColor: colors.surface }, softShadow(colors)]}>
          {/* 필터 */}
          <View style={[styles.viewToggle, { backgroundColor: colors.disabled }]}>
            {(['week', 'all'] as const).map((mode) => {
              const label = mode === 'week' ? '주간' : '전체';
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

          {/* 월 헤더바 */}
          <View style={styles.monthBar}>
            <View style={styles.monthBarLeft}>
              {!isOnToday && (
                <TouchableOpacity onPress={goToToday} hitSlop={8}>
                  <Text style={[styles.recentBtnText, { color: colors.textSub, fontFamily: fontFamily.medium }]}>최근</Text>
                </TouchableOpacity>
              )}
            </View>
            <View style={styles.monthBarCenter}>
              <TouchableOpacity onPress={handlePrevMonth} hitSlop={8}>
                <Ionicons name="chevron-back" size={18} color={colors.textSub} />
              </TouchableOpacity>
              <Text style={[styles.monthLabel, { color: colors.text, fontFamily: fontFamily.bold }]}>
                {monthLabel}
              </Text>
              <TouchableOpacity onPress={handleNextMonth} hitSlop={8}>
                <Ionicons name="chevron-forward" size={18} color={colors.textSub} />
              </TouchableOpacity>
            </View>
            <View style={styles.monthBarRight}>
              <TouchableOpacity onPress={() => setPickerOpen(true)} hitSlop={8}>
                <Ionicons name="calendar-outline" size={20} color={colors.text} />
              </TouchableOpacity>
            </View>
          </View>

          {/* 주간 캘린더 */}
          {viewMode === 'week' && (
            <WeekStrip
              selectedDate={selectedDate}
              visibleYear={visibleYear}
              visibleMonth={visibleMonth}
              highlightedDates={highlightedDates}
              colors={colors}
              todayStr={todayStr}
              onDayPress={handleDayPress}
              onWeekChange={(weekDates) => {
                if (!weekDates.includes(selectedDate)) {
                  setSelectedDate(weekDates[3]);
                }
              }}
            />
          )}

          {/* ── 주간 모드 리스트 ── */}
          {viewMode === 'week' && (
            <View style={styles.scheduleList}>
              {/* 선택 날짜 일정 */}
              <View style={styles.listHeader}>
                <SectionTitle size="sm">{formatDateFull(selectedDate)}</SectionTitle>
                <Text style={[styles.listCount, { color: colors.textSub, fontFamily: fontFamily.medium }]}>
                  {selectedDaySchedules.length}건
                </Text>
              </View>
              {selectedDaySchedules.length === 0 ? (
                <Text style={[styles.noItemText, { color: colors.textDisabled, fontFamily: fontFamily.medium }]}>
                  일정 없음
                </Text>
              ) : (
                selectedDaySchedules.map((item) => (
                  <ScheduleListItem
                    key={item.id}
                    schedule={item}
                    isTodayItem={selectedDate === todayStr}
                    isPast={isPast(item.scheduledAt)}
                    onPress={() => navigation.navigate('ScheduleDetail', { scheduleId: item.id })}
                    colors={colors}
                  />
                ))
              )}

            </View>
          )}

          {/* ── 전체 모드 리스트 ── */}
          {viewMode === 'all' && (
            <View style={styles.scheduleList}>
              <View style={styles.listHeader}>
                <SectionTitle size="sm">전체 일정</SectionTitle>
                <Text style={[styles.listCount, { color: colors.textSub, fontFamily: fontFamily.medium }]}>
                  {allDisplaySchedules.length}건
                </Text>
              </View>
              {allGrouped.length === 0 ? (
                <View style={styles.emptyWrap}>
                  <Ionicons name="calendar-outline" size={40} color={colors.primaryLight} />
                  <Text style={[styles.emptyTitle, { color: colors.textSub, fontFamily: fontFamily.semibold }]}>
                    일정이 없어요
                  </Text>
                  <Text style={[styles.emptySubText, { color: colors.textDisabled, fontFamily: fontFamily.medium }]}>
                    새 일정을 추가해 보세요
                  </Text>
                </View>
              ) : (
                allGrouped.map(({ date, items }) => (
                  <View key={date} style={styles.dateGroup}>
                    <Text style={[styles.dateLabel, { color: colors.textSub, fontFamily: fontFamily.semibold }]}>
                      {formatDateFull(date)}
                    </Text>
                    {items.map((item) => (
                      <ScheduleListItem
                        key={item.id}
                        schedule={item}
                        isTodayItem={date === todayStr}
                        isPast={isPast(item.scheduledAt)}
                        onPress={() => navigation.navigate('ScheduleDetail', { scheduleId: item.id })}
                        colors={colors}
                      />
                    ))}
                  </View>
                ))
              )}
            </View>
          )}
        </View>

        {/* 주간 일정 — 별도 카드 */}
        {viewMode === 'week' && (
          <View style={[styles.weekCard, { backgroundColor: colors.surface }, softShadow(colors)]}>
            <View style={styles.listHeader}>
              <SectionTitle size="sm" muted>주간 일정</SectionTitle>
              <Text style={[styles.listCount, { color: colors.textSub, fontFamily: fontFamily.medium }]}>
                {weekSchedules.length}건
              </Text>
            </View>
            {weekGrouped.length === 0 ? (
              <Text style={[styles.noItemText, { color: colors.textDisabled, fontFamily: fontFamily.medium }]}>
                일정 없음
              </Text>
            ) : (
              weekGrouped.map(({ date, items }) => (
                <View key={date} style={styles.dateGroup}>
                  <Text style={[styles.dateLabel, { color: colors.textSub, fontFamily: fontFamily.semibold }]}>
                    {formatDateFull(date)}
                  </Text>
                  {items.map((item) => (
                    <ScheduleListItem
                      key={item.id}
                      schedule={item}
                      isTodayItem={date === todayStr}
                      isPast={isPast(item.scheduledAt)}
                      onPress={() => navigation.navigate('ScheduleDetail', { scheduleId: item.id })}
                      colors={colors}
                    />
                  ))}
                </View>
              ))
            )}
          </View>
        )}
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

      <DatePickerModal
        visible={pickerOpen}
        initialDate={selectedDate}
        highlightedDates={highlightedDates}
        todayStr={todayStr}
        onClose={() => setPickerOpen(false)}
        onConfirm={(date) => {
          setSelectedDate(date);
          const d = new Date(date);
          setVisibleYear(d.getFullYear());
          setVisibleMonth(d.getMonth() + 1);
          setPickerOpen(false);
        }}
      />
    </SafeAreaView>
  );
};

// ── 유틸 ──

const getMonthWeeks = (year: number, month: number): string[][] => {
  const firstDay = new Date(year, month - 1, 1);
  const lastDay = new Date(year, month, 0);
  const weeks: string[][] = [];
  const startSunday = new Date(firstDay);
  startSunday.setDate(startSunday.getDate() - startSunday.getDay());
  const cur = new Date(startSunday);
  while (cur <= lastDay || cur.getDay() !== 0) {
    const week: string[] = [];
    for (let i = 0; i < 7; i++) {
      week.push(`${cur.getFullYear()}-${String(cur.getMonth() + 1).padStart(2, '0')}-${String(cur.getDate()).padStart(2, '0')}`);
      cur.setDate(cur.getDate() + 1);
    }
    weeks.push(week);
    if (cur > lastDay && cur.getDay() === 0) break;
  }
  return weeks;
};

const findWeekIndex = (weeks: string[][], dateStr: string): number => {
  for (let i = 0; i < weeks.length; i++) {
    if (weeks[i].includes(dateStr)) return i;
  }
  return 0;
};

const SCREEN_WIDTH = Dimensions.get('window').width;

// ── WeekStrip ──

const WeekStrip: React.FC<{
  selectedDate: string;
  visibleYear: number;
  visibleMonth: number;
  highlightedDates: Set<string>;
  colors: any;
  todayStr: string;
  onDayPress: (dateString: string) => void;
  onWeekChange: (weekDates: string[]) => void;
}> = ({ selectedDate, visibleYear, visibleMonth, highlightedDates, colors, todayStr, onDayPress, onWeekChange }) => {
  const flatListRef = useRef<FlatList>(null);
  const weeks = useMemo(() => getMonthWeeks(visibleYear, visibleMonth), [visibleYear, visibleMonth]);
  const activeIndex = useMemo(() => findWeekIndex(weeks, selectedDate), [weeks, selectedDate]);
  const prevIndexRef = useRef(activeIndex);
  const cardWidth = SCREEN_WIDTH - sizes.spacing.lg * 2 - sizes.spacing.md * 2;

  useEffect(() => {
    if (flatListRef.current && activeIndex !== prevIndexRef.current) {
      flatListRef.current.scrollToIndex({ index: activeIndex, animated: true });
      prevIndexRef.current = activeIndex;
    }
  }, [activeIndex]);

  useEffect(() => {
    prevIndexRef.current = activeIndex;
    setTimeout(() => {
      flatListRef.current?.scrollToIndex({ index: activeIndex, animated: false });
    }, 50);
  }, [visibleYear, visibleMonth]);

  const handleMomentumEnd = useCallback(
    (e: any) => {
      const idx = Math.round(e.nativeEvent.contentOffset.x / cardWidth);
      const clamped = Math.max(0, Math.min(idx, weeks.length - 1));
      if (clamped !== prevIndexRef.current) {
        prevIndexRef.current = clamped;
        onWeekChange(weeks[clamped]);
      }
    },
    [weeks, cardWidth, onWeekChange],
  );

  const renderWeek = useCallback(
    ({ item: weekDates }: { item: string[] }) => (
      <View style={[styles.weekStripPage, { width: cardWidth }]}>
        {weekDates.map((dateStr, idx) => {
          const d = new Date(dateStr);
          const isSelected = dateStr === selectedDate;
          const isToday = dateStr === todayStr;
          const hasSchedule = highlightedDates.has(dateStr);
          const isCurrentMonth = d.getMonth() + 1 === visibleMonth;
          const dayLabel = WEEK_DAYS_LABEL[idx];
          const dayColor = idx === 0 ? colors.error : idx === 6 ? colors.primary : colors.textSub;

          return (
            <TouchableOpacity
              key={dateStr}
              style={[
                styles.weekStripCell,
                isSelected && { backgroundColor: colors.primaryMuted, borderRadius: sizes.radius.lg },
              ]}
              onPress={() => onDayPress(dateStr)}
              activeOpacity={0.7}
            >
              <Text
                style={{
                  fontSize: sizes.font.xs,
                  color: isSelected ? colors.primary : dayColor,
                  fontFamily: isSelected ? fontFamily.bold : fontFamily.semibold,
                }}
              >
                {dayLabel}
              </Text>
              <Text
                style={{
                  fontSize: sizes.font.md,
                  color: isSelected
                    ? colors.primary
                    : isToday
                    ? colors.primary
                    : !isCurrentMonth
                    ? colors.textDisabled
                    : colors.text,
                  fontFamily: isSelected || isToday ? fontFamily.bold : fontFamily.medium,
                }}
              >
                {d.getDate()}
              </Text>
              {hasSchedule && (
                <View
                  style={[
                    styles.weekStripDot,
                    { backgroundColor: colors.primary },
                  ]}
                />
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    ),
    [selectedDate, todayStr, highlightedDates, colors, cardWidth, visibleMonth, onDayPress],
  );

  return (
    <View style={styles.weekStripWrap}>
      <FlatList
        ref={flatListRef}
        data={weeks}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={(_, i) => `week-${i}`}
        renderItem={renderWeek}
        getItemLayout={(_, index) => ({ length: cardWidth, offset: cardWidth * index, index })}
        onMomentumScrollEnd={handleMomentumEnd}
        initialScrollIndex={activeIndex}
        style={{ flexGrow: 0 }}
        snapToInterval={cardWidth}
        decelerationRate="fast"
      />
    </View>
  );
};

// ── ScheduleListItem ──

const ScheduleListItem: React.FC<{
  schedule: HospitalSchedule;
  isTodayItem: boolean;
  isPast: boolean;
  onPress: () => void;
  colors: any;
}> = ({ schedule, isTodayItem, isPast, onPress, colors }) => (
  <AnimatedPressable
    onPress={onPress}
    style={[
      styles.listItem,
      { backgroundColor: colors.background },
      isTodayItem && { backgroundColor: colors.primaryMuted },
    ]}
  >
    <View
      style={[
        styles.listItemBar,
        { backgroundColor: isPast ? colors.secondary : colors.primary },
        isTodayItem && { backgroundColor: colors.primary },
      ]}
    />
    <View style={styles.listItemBody}>
      <Text style={[styles.listItemHospital, { color: colors.text, fontFamily: fontFamily.semibold }]}>
        {schedule.hospitalName}
      </Text>
      {schedule.doctorName && (
        <Text style={[styles.listItemDoctor, { color: colors.textSub, fontFamily: fontFamily.medium }]}>
          {schedule.doctorName} 선생님
        </Text>
      )}
    </View>
    <Text style={[styles.listItemTime, { color: colors.textSub, fontFamily: fontFamily.medium }]}>
      {formatTime(schedule.scheduledAt)}
    </Text>
    <Ionicons name="chevron-forward" size={16} color={colors.textDisabled} />
  </AnimatedPressable>
);

// ── 스타일 ──

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: {
    paddingTop: sizes.spacing.xs,
  },
  toolRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: sizes.spacing.lg,
    paddingBottom: sizes.spacing.sm,
  },
  prepNoteChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: sizes.spacing.md,
    paddingVertical: sizes.spacing.xs + 2,
    borderRadius: sizes.radius.full,
    borderWidth: 1,
  },
  prepNoteChipText: {
    fontSize: sizes.font.sm,
  },
  unifiedCard: {
    marginHorizontal: sizes.spacing.lg,
    borderRadius: sizes.radius.xxl,
    paddingTop: sizes.spacing.sm,
    paddingBottom: sizes.spacing.md,
  },
  weekCard: {
    marginHorizontal: sizes.spacing.lg,
    marginTop: sizes.spacing.md,
    borderRadius: sizes.radius.xxl,
    padding: sizes.spacing.md,
    gap: sizes.spacing.sm,
  },
  viewToggle: {
    flexDirection: 'row',
    marginHorizontal: sizes.spacing.md,
    marginBottom: sizes.spacing.xs,
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
  monthBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: sizes.spacing.md,
    paddingVertical: sizes.spacing.sm,
  },
  monthBarLeft: {
    width: 40,
    alignItems: 'flex-start',
  },
  monthBarCenter: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: sizes.spacing.sm,
  },
  monthBarRight: {
    width: 40,
    alignItems: 'flex-end',
  },
  recentBtnText: {
    fontSize: sizes.font.sm,
  },
  monthLabel: {
    fontSize: sizes.font.lg,
    letterSpacing: 0.3,
  },
  weekStripWrap: {
    paddingHorizontal: sizes.spacing.sm,
  },
  weekStripPage: {
    flexDirection: 'row',
  },
  weekStripCell: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: sizes.spacing.xs,
    gap: 2,
  },
  weekStripDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    marginTop: 1,
  },
  scheduleList: {
    paddingHorizontal: sizes.spacing.md,
    paddingTop: sizes.spacing.sm,
    gap: sizes.spacing.sm,
  },
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: sizes.spacing.xs,
  },
  listCount: {
    fontSize: sizes.font.sm,
  },
  noItemText: {
    fontSize: sizes.font.sm,
    paddingVertical: sizes.spacing.sm,
    textAlign: 'center',
  },
  dateGroup: {
    gap: sizes.spacing.sm,
  },
  dateLabel: {
    fontSize: sizes.font.xs,
    marginTop: sizes.spacing.xs,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: sizes.radius.lg,
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
    paddingVertical: sizes.spacing.xl,
    paddingHorizontal: sizes.spacing.lg,
    gap: sizes.spacing.sm,
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
