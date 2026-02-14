import React, { useMemo, useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Dimensions,
} from 'react-native';

const SCREEN_WIDTH = Dimensions.get('window').width;
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { CompositeNavigationProp } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { customAlert } from '@/shared/components/CustomAlert';
import { useTheme, sizes, fontFamily } from '@/shared/theme';
import { softShadow, floatingShadow } from '@/shared/theme/shadows';
import {
  useTodayMedication,
  useCheckMedication,
  useDeleteMedicationSchedule,
} from '@/features/medication/hooks/useMedication';
import {
  MedicationCard,
  SLOT_LABELS,
  SLOT_COLORS,
  formatSlotTime,
  type SlotItem,
} from '@/features/medication/components/MedicationCard';
import { LoadingSpinner } from '@/shared/components/LoadingSpinner';
import { ScreenHeader } from '@/shared/components/ScreenHeader';
import { useTabBarSafeBottom } from '@/shared/hooks/useTabBarSafeBottom';
import { useTabBarScrollHide } from '@/shared/hooks/useTabBarScrollHide';
import type { MedicationStackParamList } from '@/navigation/MedicationNavigator';
import type { RootStackParamList } from '@/navigation/RootNavigator';
import type { TimeSlotType } from '@/shared/types/domain.types';
import { DatePickerModal } from '@/features/schedule/components/DatePickerModal';

type Nav = CompositeNavigationProp<
  StackNavigationProp<MedicationStackParamList, 'MedicationHome'>,
  StackNavigationProp<RootStackParamList>
>;
type Route = RouteProp<MedicationStackParamList, 'MedicationHome'>;

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

export const MedicationHomeScreen: React.FC<{ embedded?: boolean }> = ({ embedded = false }) => {
  const { colors } = useTheme();
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const tabBarSafeBottom = useTabBarSafeBottom();
  const scrollHandlers = useTabBarScrollHide();

  const today = todayStrFn();
  const paramDate = route.params?.date;
  const direction = route.params?.direction;
  const selectedDate = paramDate ?? today;
  const isToday = selectedDate === today;

  // 방향별 슬라이드 인 애니메이션
  const slideAnim = useRef(new Animated.Value(
    direction === 'prev' ? -SCREEN_WIDTH : direction === 'next' ? SCREEN_WIDTH : 0
  )).current;
  useEffect(() => {
    if (!direction) return;
    Animated.spring(slideAnim, {
      toValue: 0,
      tension: 68,
      friction: 11,
      useNativeDriver: true,
    }).start();
  }, []);

  const { data, isLoading } = useTodayMedication(isToday ? undefined : selectedDate);
  const { mutate: checkMedication, isPending: isChecking } = useCheckMedication();
  const { mutate: deleteMedicationSchedule } = useDeleteMedicationSchedule();

  const [pendingIds, setPendingIds] = useState<Set<string>>(new Set());
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showDatePicker, setShowDatePicker] = useState(false);

  const toggleSelect = (scheduleId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(scheduleId) ? next.delete(scheduleId) : next.add(scheduleId);
      return next;
    });
  };

  const handleDeleteSelected = () => {
    if (selectedIds.size === 0) return;
    customAlert('복약 일정 삭제', `${selectedIds.size}개 약품을 삭제할까요?`, [
      { text: '취소', style: 'cancel' },
      {
        text: '삭제',
        style: 'destructive',
        onPress: () => {
          selectedIds.forEach((id) => deleteMedicationSchedule(id));
          setSelectedIds(new Set());
          setIsEditMode(false);
        },
      },
    ]);
  };

  const handleDelete = (scheduleId: string, drugName: string) => {
    customAlert('복약 일정 삭제', `'${drugName}'을(를) 삭제할까요?`, [
      { text: '취소', style: 'cancel' },
      { text: '삭제', style: 'destructive', onPress: () => deleteMedicationSchedule(scheduleId) },
    ]);
  };

  const handleCheck = (scheduleId: string, status: 'TAKEN' | 'SKIPPED', timeSlot: TimeSlotType, logDate?: string) => {
    setPendingIds((prev) => new Set(prev).add(scheduleId));
    checkMedication(
      { scheduleId, req: { logDate: logDate ?? selectedDate, timeSlot, status } },
      { onSettled: () => setPendingIds((prev) => { const next = new Set(prev); next.delete(scheduleId); return next; }) }
    );
  };

  // 시간대별 SlotItem 그룹 생성
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

  const allScheduleIds = useMemo(() => {
    const ids: string[] = [];
    for (const slot of TIME_SLOTS) {
      for (const item of slotGroups[slot]) {
        if (!ids.includes(item.scheduleId)) ids.push(item.scheduleId);
      }
    }
    return ids;
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
  const [, mo, da] = selectedDate.split('-').map(Number);
  const dateLabel = isToday ? `${mo}월 ${da}일` : `${mo}월 ${da}일 (지난 기록)`;

  const isFutureDate = selectedDate > today;

  const handleGoPrev = () => {
    navigation.replace('MedicationHome', { date: getPrevDay(selectedDate), direction: 'prev' });
  };

  const handleGoNext = () => {
    navigation.replace('MedicationHome', { date: getNextDay(selectedDate), direction: 'next' });
  };

  const handleDatePicked = (date: string) => {
    setShowDatePicker(false);
    if (date !== selectedDate) {
      navigation.replace('MedicationHome', { date, direction: date < selectedDate ? 'prev' : 'next' });
    }
  };

  // 14일 후까지만 미래 탐색 허용
  const maxBrowseDate = (() => {
    const d = new Date();
    d.setDate(d.getDate() + 14);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  })();
  const isNextDisabled = selectedDate >= maxBrowseDate;

  if (isLoading) return <LoadingSpinner fullscreen />;

  const hasAnySlots = TIME_SLOTS.some((s) => slotGroups[s].length > 0);

  const styles = getStyles(colors, tabBarSafeBottom);

  return (
    <SafeAreaView style={styles.container} edges={embedded ? [] : undefined}>
      {!embedded && (
        <ScreenHeader
          variant={isToday ? 'tab' : 'back'}
          title={isToday ? '복약 관리' : '복약 기록'}
          {...(isToday ? { hasNotification: true } : {})}
        />
      )}

      {/* 날짜 네비게이션 바 — 독립 화면(비embedded)에서만 표시 */}
      {!embedded && <View style={styles.dateNavBar}>
        {/* 오늘 버튼 — 오늘이 아닐 때만 표시 (레이아웃 고정을 위해 항상 자리 차지) */}
        <TouchableOpacity
          onPress={() => navigation.replace('MedicationHome', {})}
          hitSlop={8}
          style={[styles.dateNavSide, isToday && { opacity: 0 }]}
          disabled={isToday}
        >
          <Text style={styles.todayBtnText}>오늘</Text>
        </TouchableOpacity>

        {/* 날짜 ← → */}
        <View style={styles.dateNavCenter}>
          <TouchableOpacity onPress={handleGoPrev} hitSlop={12} style={styles.dateNavBtn}>
            <Ionicons name="chevron-back" size={20} color={colors.primary} />
          </TouchableOpacity>
          <Text style={styles.dateNavLabel}>{mo}월 {da}일</Text>
          <TouchableOpacity
            onPress={handleGoNext}
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
          onPress={() => setShowDatePicker(true)}
          hitSlop={8}
          style={styles.dateNavSide}
        >
          <Ionicons name="calendar-outline" size={20} color={colors.primary} />
        </TouchableOpacity>
      </View>}

      {!embedded && (
        <DatePickerModal
          visible={showDatePicker}
          initialDate={selectedDate}
          maxDate={maxBrowseDate}
          onConfirm={handleDatePicked}
          onClose={() => setShowDatePicker(false)}
        />
      )}

      {/* 편집 모드: 전체 선택 + 삭제 바 */}
      {isEditMode && (
        <View style={styles.editBar}>
          <TouchableOpacity
            style={styles.selectAllBtn}
            onPress={() => {
              if (selectedIds.size === allScheduleIds.length) {
                setSelectedIds(new Set());
              } else {
                setSelectedIds(new Set(allScheduleIds));
              }
            }}
          >
            <Ionicons
              name={selectedIds.size === allScheduleIds.length ? 'checkbox' : 'square-outline'}
              size={20}
              color={colors.primary}
            />
            <Text style={styles.selectAllText}>전체 선택</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.deleteSelectedBtn, selectedIds.size === 0 && styles.deleteSelectedBtnDisabled]}
            onPress={handleDeleteSelected}
            disabled={selectedIds.size === 0}
          >
            <Ionicons name="trash-outline" size={16} color={selectedIds.size > 0 ? colors.error : colors.textDisabled} />
            <Text style={[styles.deleteSelectedText, selectedIds.size === 0 && styles.deleteSelectedTextDisabled]}>
              삭제 ({selectedIds.size})
            </Text>
          </TouchableOpacity>
        </View>
      )}

      <Animated.View style={{ flex: 1, transform: [{ translateX: slideAnim }] }}>
      <ScrollView contentContainerStyle={styles.content} {...scrollHandlers}>
        {/* 완료율 카드 */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryDate}>{dateLabel}</Text>
            <View style={styles.summaryRateRow}>
              <Text style={styles.summaryRate}>{takenSlots} / {totalSlots}</Text>
              {isToday && hasAnySlots && (
                <TouchableOpacity
                  onPress={() => {
                    if (isEditMode) { setIsEditMode(false); setSelectedIds(new Set()); }
                    else { setIsEditMode(true); }
                  }}
                  hitSlop={8}
                >
                  <Ionicons
                    name={isEditMode ? 'checkmark-circle' : 'create-outline'}
                    size={18}
                    color={isEditMode ? colors.primary : colors.textSub}
                  />
                </TouchableOpacity>
              )}
            </View>
          </View>
          <View style={styles.progressBg}>
            <LinearGradient
              colors={[colors.secondary, colors.secondaryLight]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[
                styles.progressFill,
                { width: `${Math.round(completionRate * 100)}%` },
              ]}
            />
          </View>
          {totalSlots === 0 ? (
            <Text style={styles.summaryEmpty}>오늘 복약 일정이 없습니다</Text>
          ) : (
            <Text style={styles.summaryPercent}>{`${Math.round(completionRate * 100)}%`}</Text>
          )}
          {totalSlots > 0 && (
            <Text style={styles.summaryLabel}>완료</Text>
          )}
        </View>

        {/* 시간대별 카드 */}
        {!hasAnySlots ? (
          <View style={styles.emptyWrap}>
            <Text style={styles.emptyText}>
              {isToday
                ? '등록된 복약 일정이 없어요'
                : isFutureDate
                ? '이 날짜에 예정된 복약 일정이 없어요'
                : '이 날짜에 활성 복약 일정이 없어요'}
            </Text>
            <Text style={styles.emptySubText}>
              {isToday
                ? '+ 버튼을 눌러 복약 일정을 추가해보세요'
                : isFutureDate
                ? '복약 일정 등록 후 미리 확인할 수 있어요'
                : '복약 일정의 시작/종료일을 확인해주세요'}
            </Text>
            {!isToday && (
              <TouchableOpacity
                onPress={() => navigation.replace('MedicationHome', {})}
                style={[styles.emptyGoTodayBtn, { backgroundColor: colors.primaryMuted, borderColor: colors.primary + '40' }]}
              >
                <Ionicons name="today-outline" size={14} color={colors.primary} />
                <Text style={[styles.emptyGoTodayText, { color: colors.primary }]}>오늘 복약으로 이동</Text>
              </TouchableOpacity>
            )}
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
                    <Text style={[styles.slotHeaderTime, { color: colors.textSub }]}>
                      {formatSlotTime(notifyTime)}
                    </Text>
                  )}
                </View>

                <View style={styles.medicationCardWrap}>
                  <MedicationCard
                    items={slotGroups[slot]}
                    pendingScheduleIds={pendingIds}
                    isEditMode={isEditMode}
                    selectedIds={selectedIds}
                    checkDisabled={isFutureDate}
                    onToggleSelect={toggleSelect}
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

      {/* FAB */}
      {isToday && (
        <TouchableOpacity
          style={styles.fab}
          onPress={() => navigation.navigate('MedicationForm', {})}
          activeOpacity={0.85}
        >
          <LinearGradient
            colors={[colors.primaryVivid, colors.primaryVividDark]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.fabGradient}
          >
            <Ionicons name="add" size={30} color={colors.textInverse} />
          </LinearGradient>
        </TouchableOpacity>
      )}

    </SafeAreaView>
  );
};

const getStyles = (colors: ReturnType<typeof useTheme>['colors'], tabBarSafeBottom: number) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    content: { padding: sizes.spacing.lg, paddingBottom: tabBarSafeBottom + 80, gap: sizes.spacing.md },
    summaryCard: {
      gap: sizes.spacing.sm,
      marginBottom: sizes.spacing.xs,
    },
    summaryRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    summaryRateRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
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
    slotGroup: {
      gap: sizes.spacing.xs,
    },
    slotHeaderRow: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
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
    },
    medicationCardWrap: {
      borderRadius: sizes.radius.xxl,
      ...softShadow(colors),
      overflow: 'hidden',
    },
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
    toolRow: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: sizes.spacing.sm,
      paddingHorizontal: sizes.spacing.lg,
      paddingBottom: sizes.spacing.sm,
    },
    toolChip: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      gap: 4,
      paddingHorizontal: sizes.spacing.md,
      paddingVertical: sizes.spacing.xs + 2,
      borderRadius: sizes.radius.full,
      borderWidth: 1,
    },
    toolChipText: {
      fontSize: sizes.font.sm,
      fontFamily: fontFamily.semibold,
    },
    editBar: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      justifyContent: 'space-between' as const,
      paddingHorizontal: sizes.spacing.lg,
      paddingVertical: sizes.spacing.md,
      marginHorizontal: sizes.spacing.md,
      marginTop: sizes.spacing.xs,
      backgroundColor: colors.surface,
      borderRadius: sizes.radius.xxl,
      ...softShadow(colors),
    },
    selectAllBtn: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: sizes.spacing.sm,
    },
    selectAllText: {
      fontSize: sizes.font.sm,
      color: colors.text,
      fontFamily: fontFamily.medium,
    },
    deleteSelectedBtn: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: sizes.spacing.xs,
      paddingHorizontal: sizes.spacing.md,
      paddingVertical: sizes.spacing.sm,
      borderRadius: sizes.radius.full,
      backgroundColor: colors.errorLight,
    },
    deleteSelectedBtnDisabled: {
      backgroundColor: colors.disabled,
    },
    deleteSelectedText: {
      fontSize: sizes.font.sm,
      color: colors.error,
      fontFamily: fontFamily.semibold,
    },
    deleteSelectedTextDisabled: {
      color: colors.textDisabled,
    },

    // ── 날짜 네비게이션 바 ──
    dateNavBar: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      justifyContent: 'space-between' as const,
      paddingHorizontal: sizes.spacing.lg,
      paddingVertical: sizes.spacing.sm,
    },
    dateNavSide: {
      width: 52,
      alignItems: 'center' as const,
    },
    todayBtnText: {
      fontSize: sizes.font.sm,
      fontFamily: fontFamily.semibold,
      color: colors.primary,
    },
    dateNavCenter: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
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
      textAlign: 'center' as const,
    },

    // ── 과거 날짜 빈 상태 버튼 ──
    emptyGoTodayBtn: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: sizes.spacing.xs,
      marginTop: sizes.spacing.sm,
      paddingHorizontal: sizes.spacing.lg,
      paddingVertical: sizes.spacing.sm,
      borderRadius: sizes.radius.full,
      borderWidth: 1,
    },
    emptyGoTodayText: {
      fontSize: sizes.font.sm,
      fontFamily: fontFamily.semibold,
    },

    // ── FAB ──
    fab: {
      position: 'absolute',
      bottom: tabBarSafeBottom + sizes.spacing.md,
      right: sizes.spacing.xl,
      width: 60,
      height: 60,
      borderRadius: 30,
      ...floatingShadow(colors),
    },
    fabGradient: {
      width: 60,
      height: 60,
      borderRadius: 30,
      alignItems: 'center',
      justifyContent: 'center',
    },
  });
