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
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { Calendar } from 'react-native-calendars';
import { CompositeNavigationProp } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { customAlert } from '@/shared/components/CustomAlert';
import { useTheme, sizes, fontFamily } from '@/shared/theme';
import { softShadow, floatingShadow } from '@/shared/theme/shadows';
import { AnimatedPressable } from '@/shared/components/AnimatedPressable';
import { SectionTitle } from '@/shared/components/SectionTitle';
import {
  useTodayMedication,
  useCheckMedication,
  useDeleteMedicationSchedule,
  useMedicationHistory,
  useAllMedicationSchedules,
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
import { useResetStackOnTabFocus } from '@/shared/hooks/useResetStackOnTabFocus';
import { useTabBarSafeBottom } from '@/shared/hooks/useTabBarSafeBottom';
import { useTabBarScrollHide } from '@/shared/hooks/useTabBarScrollHide';
import { useAuthStore } from '@/features/auth/store/authStore';
import type { MedicationStackParamList } from '@/navigation/MedicationNavigator';
import type { RootStackParamList } from '@/navigation/RootNavigator';
import type { TimeSlotType, MedicationLogItem, MedicationLogStatus } from '@/shared/types/domain.types';

type Nav = CompositeNavigationProp<
  StackNavigationProp<MedicationStackParamList, 'MedicationHome'>,
  StackNavigationProp<RootStackParamList>
>;
type Route = RouteProp<MedicationStackParamList, 'MedicationHome'>;

const TIME_SLOTS: TimeSlotType[] = ['MORNING', 'AFTERNOON', 'EVENING', 'BEDTIME'];

const HISTORY_SLOT_LABELS: Record<TimeSlotType, string> = {
  MORNING: '아침', AFTERNOON: '점심', EVENING: '저녁', BEDTIME: '취침 전',
};

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

const formatHistoryDate = (dateStr: string) => {
  const d = new Date(dateStr);
  return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일`;
};

interface HistorySlotGroup {
  timeSlot: TimeSlotType;
  logs: MedicationLogItem[];
}

interface HistorySection {
  title: string;
  date: string;
  slots: HistorySlotGroup[];
  takenCount: number;
  totalCount: number;
}

export const MedicationHomeScreen: React.FC = () => {
  useResetStackOnTabFocus();
  const { colors } = useTheme();
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const tabBarSafeBottom = useTabBarSafeBottom();
  const scrollHandlers = useTabBarScrollHide();
  const plan = useAuthStore((s) => s.user?.plan);
  const isFree = plan === 'FREE' || !plan;

  const today = todayStrFn();
  const paramDate = route.params?.date;
  const selectedDate = paramDate ?? today;
  const isToday = selectedDate === today;

  const { data, isLoading } = useTodayMedication(isToday ? undefined : selectedDate);
  const { mutate: checkMedication, isPending: isChecking } = useCheckMedication();
  const { mutate: deleteMedicationSchedule } = useDeleteMedicationSchedule();

  // 복약 이력
  const { data: history, isLoading: historyLoading } = useMedicationHistory();
  const [showCalendar, setShowCalendar] = useState(false);
  const { data: allSchedules = [] } = useAllMedicationSchedules(showCalendar);

  const STATUS_CONFIG: Record<MedicationLogStatus, { label: string; color: string }> = useMemo(() => ({
    TAKEN: { label: '복용', color: colors.success },
    SKIPPED: { label: '건너뜀', color: colors.textDisabled },
    MISSED: { label: '미복용', color: colors.error },
  }), [colors]);

  const [pendingIds, setPendingIds] = useState<Set<string>>(new Set());
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

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

  // ── 복약 이력 (날짜 → 시간대별 그룹) ──
  const historySections = useMemo<HistorySection[]>(() => {
    if (!history?.logs) return [];
    // 1. 날짜별 그룹
    const dateMap = new Map<string, MedicationLogItem[]>();
    for (const log of history.logs) {
      const list = dateMap.get(log.logDate) ?? [];
      list.push(log);
      dateMap.set(log.logDate, list);
    }
    // 2. 각 날짜 내에서 시간대별 그룹 (아침→점심→저녁→취침전 순서 보장)
    return Array.from(dateMap.entries()).map(([date, logs]) => {
      const slotMap = new Map<TimeSlotType, MedicationLogItem[]>();
      for (const log of logs) {
        const list = slotMap.get(log.timeSlot) ?? [];
        list.push(log);
        slotMap.set(log.timeSlot, list);
      }
      const slots: HistorySlotGroup[] = TIME_SLOTS
        .filter((s) => slotMap.has(s))
        .map((s) => ({ timeSlot: s, logs: slotMap.get(s)! }));
      return {
        title: formatHistoryDate(date),
        date,
        slots,
        takenCount: logs.filter((l) => l.status === 'TAKEN').length,
        totalCount: logs.length,
      };
    });
  }, [history]);

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
    if (day.dateString === today) {
      navigation.setParams({ date: undefined });
    } else {
      navigation.push('MedicationHome', { date: day.dateString });
    }
  };

  const isFutureDate = selectedDate > today;

  const handleGoPrev = () => {
    navigation.replace('MedicationHome', { date: getPrevDay(selectedDate) });
  };

  const handleGoNext = () => {
    const next = getNextDay(selectedDate);
    navigation.replace('MedicationHome', { date: next });
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
    <SafeAreaView style={styles.container}>
      <ScreenHeader
        variant={isToday ? 'tab' : 'back'}
        title={isToday ? '복약 관리' : '복약 기록'}
        {...(isToday ? { hasNotification: true } : {})}
      />

      {/* 과거 날짜 네비게이션 바 */}
      {!isToday && (
        <View style={styles.dateNavBar}>
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
      )}

      {/* 처방전 + 편집 버튼 툴바 */}
      {isToday && (
        <View style={styles.toolRow}>
          <TouchableOpacity
            onPress={() => navigation.navigate('PrescriptionList')}
            style={[styles.toolChip, { borderColor: colors.accent + '33', backgroundColor: colors.accentMuted }]}
            hitSlop={8}
          >
            <Ionicons name="receipt-outline" size={14} color={colors.accent} />
            <Text style={[styles.toolChipText, { color: colors.accent }]}>처방전</Text>
          </TouchableOpacity>

          {hasAnySlots && (
            <TouchableOpacity
              onPress={() => {
                if (isEditMode) {
                  setIsEditMode(false);
                  setSelectedIds(new Set());
                } else {
                  setIsEditMode(true);
                }
              }}
              hitSlop={8}
              style={[
                styles.toolChip,
                isEditMode
                  ? { borderColor: colors.primary + '44', backgroundColor: colors.primaryMuted }
                  : { borderColor: colors.divider, backgroundColor: colors.surface },
              ]}
            >
              <Ionicons
                name={isEditMode ? 'checkmark' : 'create-outline'}
                size={14}
                color={isEditMode ? colors.primary : colors.textSub}
              />
              <Text style={[styles.toolChipText, { color: isEditMode ? colors.primary : colors.textSub }]}>
                {isEditMode ? '완료' : '편집'}
              </Text>
            </TouchableOpacity>
          )}
        </View>
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

      <ScrollView contentContainerStyle={styles.content} {...scrollHandlers}>
        {/* 완료율 카드 */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryDate}>{dateLabel}</Text>
            <Text style={styles.summaryRate}>
              {takenSlots} / {totalSlots}
            </Text>
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

        {/* ── 복약 이력 섹션 (오늘 화면에서만) ── */}
        {isToday && (
          <>
            <View style={styles.historySectionHeader}>
              <View style={styles.historyTitleGroup}>
                <SectionTitle size="md">복약 이력</SectionTitle>
                <TouchableOpacity
                  onPress={() => setShowCalendar(true)}
                  hitSlop={12}
                >
                  <Ionicons name="calendar-outline" size={18} color={colors.primary} />
                </TouchableOpacity>
              </View>
            </View>

            {/* FREE 플랜 배너 */}
            {isFree && (
              <View style={styles.freeBanner}>
                <Text style={styles.freeBannerText}>
                  무료 플랜은 최근 30일 이력만 조회됩니다.
                </Text>
                <TouchableOpacity
                  onPress={() => navigation.navigate('Paywall')}
                  hitSlop={8}
                >
                  <Text style={styles.freeBannerUpgrade}>업그레이드</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* 이력 리스트 */}
            {historyLoading ? (
              <View style={styles.historyLoadingWrap}>
                <LoadingSpinner />
              </View>
            ) : historySections.length === 0 ? (
              <View style={styles.historyEmptyWrap}>
                <Text style={styles.historyEmptyText}>복약 이력이 없어요</Text>
                <Text style={styles.historyEmptySubText}>복약 일정을 등록하고 체크해보세요</Text>
              </View>
            ) : (
              historySections.map((section) => (
                <View key={section.date}>
                  {/* 날짜 헤더 (탭하면 해당 날짜 복약 화면으로) */}
                  <TouchableOpacity
                    style={styles.historySectionRow}
                    onPress={() => navigation.push('MedicationHome', { date: section.date })}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.historySectionDate}>{section.title}</Text>
                    <View style={styles.historySectionRight}>
                      <Text style={styles.historySectionRate}>
                        {section.takenCount}/{section.totalCount} 복용
                      </Text>
                      <Ionicons name="chevron-forward" size={16} color={colors.textSub} />
                    </View>
                  </TouchableOpacity>

                  {/* 시간대별 그룹 카드 */}
                  <View style={[styles.historyCard, softShadow(colors)]}>
                    {section.slots.map((slot, sIdx) => (
                      <View key={slot.timeSlot}>
                        {sIdx > 0 && <View style={styles.historyDivider} />}
                        {/* 시간대 헤더 */}
                        <View style={styles.historySlotHeader}>
                          <Text style={[styles.historySlotHeaderText, { color: SLOT_COLORS[slot.timeSlot] }]}>
                            {HISTORY_SLOT_LABELS[slot.timeSlot]}
                          </Text>
                        </View>
                        {/* 약별 행 */}
                        {slot.logs.map((item) => {
                          const statusCfg = STATUS_CONFIG[item.status];
                          return (
                            <View key={item.logId} style={styles.historyDrugRow}>
                              <Text style={styles.historyDrugTitle} numberOfLines={1}>
                                {item.drugName || '알 수 없는 약'}
                              </Text>
                              <View style={[styles.historyStatusBadge, { backgroundColor: statusCfg.color + '18' }]}>
                                <Text style={[styles.historyStatusText, { color: statusCfg.color }]}>
                                  {statusCfg.label}
                                </Text>
                              </View>
                              <TouchableOpacity
                                hitSlop={12}
                                onPress={() => {
                                  customAlert(
                                    item.drugName || '',
                                    `${HISTORY_SLOT_LABELS[item.timeSlot]} 복약 상태를 변경합니다.`,
                                    [
                                      { text: '복용', onPress: () => handleCheck(item.scheduleId, 'TAKEN', item.timeSlot, item.logDate) },
                                      { text: '건너뜀', onPress: () => handleCheck(item.scheduleId, 'SKIPPED', item.timeSlot, item.logDate) },
                                      { text: '취소', style: 'cancel' },
                                    ]
                                  );
                                }}
                              >
                                <Ionicons name="ellipsis-vertical" size={16} color={colors.textDisabled} />
                              </TouchableOpacity>
                            </View>
                          );
                        })}
                      </View>
                    ))}
                  </View>
                </View>
              ))
            )}
          </>
        )}
      </ScrollView>

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

      {/* 날짜 선택 캘린더 모달 (복약 일정 기간 하이라이트) */}
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
              current={today}
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

const getStyles = (colors: ReturnType<typeof useTheme>['colors'], tabBarSafeBottom: number) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    content: { padding: sizes.spacing.lg, paddingBottom: tabBarSafeBottom + 80, gap: sizes.spacing.md },
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
      justifyContent: 'flex-end' as const,
      alignItems: 'center' as const,
      gap: sizes.spacing.sm,
      paddingHorizontal: sizes.spacing.lg,
      paddingBottom: sizes.spacing.sm,
    },
    toolChip: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
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
      justifyContent: 'center' as const,
      paddingHorizontal: sizes.spacing.lg,
      paddingVertical: sizes.spacing.sm,
      gap: sizes.spacing.xl,
    },
    dateNavBtn: {
      padding: sizes.spacing.xs,
    },
    dateNavLabel: {
      fontSize: sizes.font.md,
      fontFamily: fontFamily.semibold,
      color: colors.text,
      minWidth: 100,
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

    // ── 복약 이력 인라인 ──
    historySectionHeader: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      marginTop: sizes.spacing.xl,
      paddingVertical: sizes.spacing.sm,
    },
    historyTitleGroup: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: sizes.spacing.sm,
    },
    freeBanner: {
      backgroundColor: colors.warningLight,
      paddingHorizontal: sizes.spacing.md,
      paddingVertical: sizes.spacing.sm,
      borderRadius: sizes.radius.lg,
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      justifyContent: 'space-between' as const,
    },
    freeBannerText: {
      fontSize: sizes.font.sm,
      color: '#92400E',
      flex: 1,
    },
    freeBannerUpgrade: {
      fontSize: sizes.font.sm,
      fontFamily: fontFamily.bold,
      color: colors.primary,
      marginLeft: sizes.spacing.sm,
    },
    historyLoadingWrap: {
      paddingVertical: sizes.spacing.xl,
      alignItems: 'center' as const,
    },
    historyEmptyWrap: {
      alignItems: 'center' as const,
      paddingVertical: sizes.spacing.xl,
      gap: sizes.spacing.sm,
    },
    historyEmptyText: {
      fontSize: sizes.font.md,
      fontFamily: fontFamily.semibold,
      color: colors.textSub,
    },
    historyEmptySubText: {
      fontSize: sizes.font.sm,
      color: colors.textDisabled,
    },
    historySectionRow: {
      flexDirection: 'row' as const,
      justifyContent: 'space-between' as const,
      alignItems: 'center' as const,
      paddingVertical: sizes.spacing.sm,
      marginTop: sizes.spacing.sm,
    },
    historySectionDate: {
      fontSize: sizes.font.sm,
      fontFamily: fontFamily.semibold,
      color: colors.text,
    },
    historySectionRight: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: sizes.spacing.xs,
    },
    historySectionRate: {
      fontSize: sizes.font.xs,
      color: colors.textSub,
    },
    historyCard: {
      backgroundColor: colors.surface,
      borderRadius: sizes.radius.xxl,
      overflow: 'hidden',
    },
    historyDivider: {
      height: 1,
      backgroundColor: colors.divider,
      marginHorizontal: sizes.spacing.lg,
    },
    historySlotHeader: {
      paddingHorizontal: sizes.spacing.lg,
      paddingTop: sizes.spacing.md,
      paddingBottom: sizes.spacing.xs,
    },
    historySlotHeaderText: {
      fontSize: sizes.font.sm,
      fontFamily: fontFamily.bold,
    },
    historyDrugRow: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      justifyContent: 'space-between' as const,
      paddingHorizontal: sizes.spacing.lg,
      paddingVertical: sizes.spacing.sm,
      gap: sizes.spacing.sm,
    },
    historyDrugTitle: {
      fontSize: sizes.font.sm,
      fontFamily: fontFamily.regular,
      color: colors.text,
      flex: 1,
    },
    historyStatusBadge: {
      paddingHorizontal: sizes.spacing.sm,
      paddingVertical: 3,
      borderRadius: sizes.radius.full,
    },
    historyStatusText: {
      fontSize: sizes.font.xs,
      fontFamily: fontFamily.semibold,
    },

    // ── 캘린더 모달 ──
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.4)',
      justifyContent: 'flex-end' as const,
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
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      justifyContent: 'space-between' as const,
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
      textAlign: 'center' as const,
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
