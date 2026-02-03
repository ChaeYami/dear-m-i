import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Animated,
  Pressable,
  
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

const BOTTOM_SHEET_HEIGHT = 340;

const toDateString = (iso: string) => iso.split('T')[0];

const formatTime = (iso: string) => {
  const d = new Date(iso);
  const h = d.getHours().toString().padStart(2, '0');
  const m = d.getMinutes().toString().padStart(2, '0');
  return `${h}:${m}`;
};

const formatDate = (dateStr: string) => {
  const [y, mo, d] = dateStr.split('-');
  return `${y}년 ${Number(mo)}월 ${Number(d)}일`;
};

export const ScheduleTab: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const today = new Date();
  const [visibleYear, setVisibleYear] = useState(today.getFullYear());
  const [visibleMonth, setVisibleMonth] = useState(today.getMonth() + 1);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const { data: schedules = [] } = useMonthlySchedules(visibleYear, visibleMonth);

  const slideAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(slideAnim, {
      toValue: selectedDate ? 1 : 0,
      useNativeDriver: true,
      tension: 65,
      friction: 11,
    }).start();
  }, [selectedDate]);

  const markedDates = useMemo(() => {
    const marks: Record<string, any> = {};
    schedules.forEach((s) => {
      const d = toDateString(s.scheduledAt);
      marks[d] = {
        marked: true,
        dots: [{ key: 'schedule', color: colors.primary }],
      };
    });
    if (selectedDate) {
      marks[selectedDate] = {
        ...(marks[selectedDate] ?? {}),
        selected: true,
        selectedColor: colors.primary,
      };
    }
    return marks;
  }, [schedules, selectedDate]);

  const selectedSchedules = useMemo(
    () => (selectedDate ? schedules.filter((s) => toDateString(s.scheduledAt) === selectedDate) : []),
    [schedules, selectedDate]
  );

  const handleDayPress = (day: { dateString: string }) => {
    setSelectedDate((prev) => (prev === day.dateString ? null : day.dateString));
  };

  const currentMonth = `${visibleYear}-${String(visibleMonth).padStart(2, '0')}-01`;

  const handleMonthChange = (month: { year: number; month: number }) => {
    setVisibleYear(month.year);
    setVisibleMonth(month.month);
  };

  const translateY = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [BOTTOM_SHEET_HEIGHT, 0],
  });

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>일정</Text>
        <TouchableOpacity
          style={styles.headerNoteBtnWrap}
          onPress={() => navigation.navigate('PrepNoteList')}
          hitSlop={8}
        >
          <Ionicons name="create-outline" size={18} color={colors.primary} />
          <Text style={styles.headerNoteBtn}>준비 메모</Text>
        </TouchableOpacity>
      </View>

      <Calendar
        key={currentMonth}
        current={currentMonth}
        markedDates={markedDates}
        markingType="multi-dot"
        onDayPress={handleDayPress}
        onMonthChange={handleMonthChange}
        enableSwipeMonths
        theme={calendarTheme}
        style={styles.calendar}
      />

      {selectedDate && (
        <Pressable style={styles.overlay} onPress={() => setSelectedDate(null)} />
      )}
      <Animated.View
        style={[styles.bottomSheet, { transform: [{ translateY }] }]}
        pointerEvents={selectedDate ? 'auto' : 'none'}
      >
        <View style={styles.sheetHandle} />
        <Text style={styles.sheetTitle}>
          {selectedDate ? formatDate(selectedDate) : ''}
        </Text>
        {selectedSchedules.length === 0 ? (
          <View style={styles.emptyWrap}>
            <Text style={styles.emptyText}>이 날 일정이 없어요</Text>
            <TouchableOpacity
              style={styles.addInSheetBtn}
              onPress={() =>
                navigation.navigate('ScheduleForm', { defaultDate: selectedDate ?? undefined })
              }
            >
              <Text style={styles.addInSheetText}>+ 일정 추가</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={selectedSchedules}
            keyExtractor={(item) => String(item.id)}
            renderItem={({ item }) => (
              <ScheduleListItem
                schedule={item}
                onPress={() => navigation.navigate('ScheduleDetail', { scheduleId: item.id })}
              />
            )}
            contentContainerStyle={styles.listContent}
          />
        )}
      </Animated.View>

      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('ScheduleForm', { defaultDate: selectedDate ?? undefined })}
        activeOpacity={0.85}
      >
        <Ionicons name="add" size={28} color={colors.textInverse} />
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const ScheduleListItem: React.FC<{
  schedule: HospitalSchedule;
  onPress: () => void;
}> = ({ schedule, onPress }) => (
  <TouchableOpacity style={styles.listItem} onPress={onPress} activeOpacity={0.75}>
    <View style={styles.listItemDot} />
    <View style={styles.listItemBody}>
      <Text style={styles.listItemHospital}>{schedule.hospitalName}</Text>
      {schedule.doctorName && (
        <Text style={styles.listItemDoctor}>{schedule.doctorName} 선생님</Text>
      )}
    </View>
    <Text style={styles.listItemTime}>{formatTime(schedule.scheduledAt)}</Text>
  </TouchableOpacity>
);

const calendarTheme = {
  backgroundColor: 'transparent',
  calendarBackground: 'transparent',
  selectedDayBackgroundColor: colors.primary,
  selectedDayTextColor: colors.textInverse,
  todayTextColor: colors.primary,
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
  'stylesheet.day.basic': {
    base: {
      width: 36,
      height: 36,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
    },
    text: {
      fontSize: sizes.font.md,
      color: colors.text,
    },
    todayText: {
      color: colors.primary,
      fontWeight: '700' as const,
    },
    selectedText: {
      color: colors.textInverse,
    },
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
  headerNoteBtnWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  headerNoteBtn: {
    fontSize: sizes.font.sm,
    color: colors.primary,
    fontWeight: sizes.fontWeight.medium,
  },
  calendar: {
    paddingBottom: sizes.spacing.sm,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.2)',
    zIndex: 10,
  },
  bottomSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: BOTTOM_SHEET_HEIGHT,
    backgroundColor: colors.surfaceSolid,
    borderTopLeftRadius: sizes.radius.xl,
    borderTopRightRadius: sizes.radius.xl,
    zIndex: 11,
    paddingHorizontal: sizes.spacing.lg,
    paddingTop: sizes.spacing.sm,
    shadowColor: colors.glassShadow,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 1,
    shadowRadius: 16,
    elevation: 12,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.disabled,
    alignSelf: 'center',
    marginBottom: sizes.spacing.md,
  },
  sheetTitle: {
    fontSize: sizes.font.lg,
    fontWeight: sizes.fontWeight.bold,
    color: colors.text,
    marginBottom: sizes.spacing.md,
  },
  emptyWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: sizes.spacing.md,
  },
  emptyText: { fontSize: sizes.font.md, color: colors.textSub },
  addInSheetBtn: {
    paddingVertical: sizes.spacing.sm,
    paddingHorizontal: sizes.spacing.lg,
    borderRadius: sizes.radius.full,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  addInSheetText: { fontSize: sizes.font.sm, color: colors.primary, fontWeight: sizes.fontWeight.semibold },
  listContent: { paddingBottom: sizes.spacing.lg },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: sizes.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
    gap: sizes.spacing.md,
  },
  listItemDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
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
