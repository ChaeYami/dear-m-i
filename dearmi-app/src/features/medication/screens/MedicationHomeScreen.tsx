import React, { useMemo, useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Dimensions,
  RefreshControl,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';

const SCREEN_WIDTH = Dimensions.get('window').width;
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { CompositeNavigationProp } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { useTranslation } from 'react-i18next';
import { customAlert } from '@/shared/components/CustomAlert';
import { useTheme, sizes, fontFamily } from '@/shared/theme';
import { softShadow, floatingShadow } from '@/shared/theme/shadows';
import {
  useTodayMedication,
  useCheckMedication,
  useUncheckMedication,
  useDeleteMedicationSchedule,
} from '@/features/medication/hooks/useMedication';
import { useScreenRefresh } from '@/shared/hooks/useScreenRefresh';
import { QUERY_KEYS } from '@/constants/cacheKeys';
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
import type { TimeSlotType, MedicationLogStatus } from '@/shared/types/domain.types';
import { DatePickerModal } from '@/features/schedule/components/DatePickerModal';
import { MedicationGroupModal } from '@/features/medication/components/MedicationGroupModal';

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

interface MedicationHomeProps {
  embedded?: boolean;
  /** embedded 모드에서 부모가 편집 상태를 제어할 때 사용 */
  editMode?: boolean;
  onEditModeChange?: (v: boolean) => void;
}

export const MedicationHomeScreen: React.FC<MedicationHomeProps> = ({
  embedded = false,
  editMode,
  onEditModeChange,
}) => {
  const { colors } = useTheme();
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { t } = useTranslation(['settings', 'common', 'sideeffect']);
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
  const { mutate: checkMedication } = useCheckMedication();
  const { mutate: uncheckMedication } = useUncheckMedication();
  const { mutate: deleteMedicationSchedule } = useDeleteMedicationSchedule();
  const { refreshing, onRefresh } = useScreenRefresh([
    QUERY_KEYS.todayMedication(isToday ? undefined : selectedDate),
    QUERY_KEYS.allMedicationSchedules(),
  ]);

  const [pendingIds, setPendingIds] = useState<Set<string>>(new Set());
  const [localEditMode, setLocalEditMode] = useState(false);
  const isEditMode = embedded ? (editMode ?? false) : localEditMode;
  const setIsEditMode = (v: boolean) => {
    if (embedded && onEditModeChange) onEditModeChange(v);
    else setLocalEditMode(v);
  };
  // 선택 단위: "scheduleId:timeSlot"
  type SlotKey = `${string}:${TimeSlotType}`;
  const [selectedSlotKeys, setSelectedSlotKeys] = useState<Set<SlotKey>>(new Set());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showGroupModal, setShowGroupModal] = useState(false);

  const scrollViewRef = useRef<ScrollView>(null);

  const makeSlotKey = (scheduleId: string, timeSlot: TimeSlotType): `${string}:${TimeSlotType}` =>
    `${scheduleId}:${timeSlot}`;

  const toggleSelect = (scheduleId: string, timeSlot: TimeSlotType) => {
    const key = makeSlotKey(scheduleId, timeSlot);
    setSelectedSlotKeys((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };

  const handleDeleteSelected = () => {
    if (selectedSlotKeys.size === 0) return;
    // 고유 scheduleId 추출
    const scheduleIds = [...new Set([...selectedSlotKeys].map((k) => k.split(':')[0]))];
    customAlert(t('settings:medication_delete_title'), t('settings:medication_delete_confirm_count', { count: scheduleIds.length }), [
      { text: t('common:cancel'), style: 'cancel' },
      {
        text: t('common:delete'),
        style: 'destructive',
        onPress: () => {
          scheduleIds.forEach((id) => deleteMedicationSchedule(id));
          setSelectedSlotKeys(new Set());
          setIsEditMode(false);
        },
      },
    ]);
  };

  const handleDelete = (scheduleId: string, drugName: string) => {
    customAlert(t('settings:medication_delete_title'), t('settings:medication_delete_confirm_single', { name: drugName }), [
      { text: t('common:cancel'), style: 'cancel' },
      { text: t('common:delete'), style: 'destructive', onPress: () => deleteMedicationSchedule(scheduleId) },
    ]);
  };

  /** 약품 행 탭 → 상세 보기 / 수정 / 삭제 액션 시트 */
  const showItemActions = (scheduleId: string, drugName: string) => {
    customAlert(drugName, '', [
      {
        text: t('settings:medication_action_detail'),
        onPress: () => navigation.navigate('MedicationScheduleDetail', { scheduleId, drugName }),
      },
      {
        text: t('settings:medication_action_edit'),
        onPress: () => navigation.navigate('MedicationForm', { scheduleId }),
      },
      {
        text: t('common:delete'),
        style: 'destructive',
        onPress: () => handleDelete(scheduleId, drugName),
      },
      { text: t('common:cancel'), style: 'cancel' },
    ]);
  };

  const handleCheck = (
    scheduleId: string,
    requestedStatus: 'TAKEN' | 'SKIPPED',
    timeSlot: TimeSlotType,
    currentStatus: MedicationLogStatus | null,
    logDate?: string,
  ) => {
    const date = logDate ?? selectedDate;
    setPendingIds((prev) => new Set(prev).add(scheduleId));
    const onSettled = () =>
      setPendingIds((prev) => { const next = new Set(prev); next.delete(scheduleId); return next; });

    if (currentStatus === requestedStatus) {
      // 같은 버튼 재클릭 → 상태 초기화
      uncheckMedication({ scheduleId, date, timeSlot }, { onSettled });
    } else {
      checkMedication({ scheduleId, req: { logDate: date, timeSlot, status: requestedStatus } }, { onSettled });
    }
  };

  // 시간대별 SlotItem 빌드 (groupId/groupName/timeSlot 포함)
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

  // 그룹 기반 섹션 계산
  // - groupId 있으면 그룹명 + 시간 표시
  // - groupId 없으면 실제 notifyTime(HH:mm)을 키/라벨로 사용 (슬롯 타입 라벨 숨김)
  const sections = useMemo(() => {
    const sectionMap = new Map<string, { label: string; color: string; items: SlotItem[]; notifyTime?: string }>();
    for (const slot of TIME_SLOTS) {
      for (const item of slotGroups[slot]) {
        let sectionKey: string;
        let label: string;
        let sectionNotifyTime: string | undefined;
        const color = item.groupId ? '#6366F1' : SLOT_COLORS[slot];

        if (item.groupId) {
          sectionKey = item.groupId;
          label = item.groupName ?? SLOT_LABELS[slot];
          sectionNotifyTime = item.notifyTime; // 그룹은 시간 별도 표시
        } else {
          // 시간 기준 섹션: 실제 notify 시간으로 묶음, 라벨 = "HH:mm"
          const timeKey = item.notifyTime ? item.notifyTime.slice(0, 5) : slot;
          sectionKey = timeKey;
          label = item.notifyTime ? formatSlotTime(item.notifyTime) : SLOT_LABELS[slot];
          sectionNotifyTime = undefined; // 라벨이 곧 시간이므로 별도 표시 불필요
        }

        if (!sectionMap.has(sectionKey)) {
          sectionMap.set(sectionKey, { label, color, items: [], notifyTime: sectionNotifyTime });
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

  // 편집 모드 전체선택용 모든 슬롯 키
  const allSlotKeys = useMemo(() => {
    const keys: `${string}:${TimeSlotType}`[] = [];
    for (const slot of TIME_SLOTS) {
      for (const item of slotGroups[slot]) {
        keys.push(`${item.scheduleId}:${slot}`);
      }
    }
    return keys;
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
  const dateLabel = isToday
    ? t('settings:medication_month_day', { month: mo, day: da })
    : t('settings:medication_month_day_past', { month: mo, day: da });

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

  const hasAnySlots = sections.length > 0;

  const styles = getStyles(colors, tabBarSafeBottom);

  return (
    <SafeAreaView style={styles.container} edges={embedded ? [] : undefined}>
      {!embedded && (
        <ScreenHeader
          variant={isToday ? 'tab' : 'back'}
          title={isToday ? t('settings:medication_management_tab') : t('settings:medication_history_tab')}
          {...(isToday ? { hasNotification: true } : {})}
          rightContent={isToday && hasAnySlots ? (
            <TouchableOpacity
              onPress={() => {
                if (isEditMode) { setIsEditMode(false); setSelectedSlotKeys(new Set()); }
                else { setIsEditMode(true); }
              }}
              hitSlop={8}
              style={[styles.headerEditBtn, isEditMode && { backgroundColor: colors.primaryMuted }]}
            >
              <Ionicons
                name={isEditMode ? 'close' : 'create-outline'}
                size={18}
                color={isEditMode ? colors.primary : colors.text}
              />
            </TouchableOpacity>
          ) : undefined}
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
          <Text style={styles.todayBtnText}>{t('settings:medication_today_label')}</Text>
        </TouchableOpacity>

        {/* 날짜 ← → */}
        <View style={styles.dateNavCenter}>
          <TouchableOpacity onPress={handleGoPrev} hitSlop={12} style={styles.dateNavBtn}>
            <Ionicons name="chevron-back" size={20} color={colors.primary} />
          </TouchableOpacity>
          <Text style={styles.dateNavLabel}>{t('settings:medication_month_day', { month: mo, day: da })}</Text>
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
              if (selectedSlotKeys.size === allSlotKeys.length) {
                setSelectedSlotKeys(new Set());
              } else {
                setSelectedSlotKeys(new Set(allSlotKeys));
              }
            }}
          >
            <Ionicons
              name={selectedSlotKeys.size === allSlotKeys.length && allSlotKeys.length > 0 ? 'checkbox' : 'square-outline'}
              size={20}
              color={colors.primary}
            />
            <Text style={styles.selectAllText}>{t('common:select_all')}</Text>
          </TouchableOpacity>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <TouchableOpacity
              style={[styles.groupBtn, selectedSlotKeys.size === 0 && styles.deleteSelectedBtnDisabled]}
              onPress={() => selectedSlotKeys.size > 0 && setShowGroupModal(true)}
              disabled={selectedSlotKeys.size === 0}
            >
              <Ionicons name="layers-outline" size={16} color={selectedSlotKeys.size > 0 ? colors.primary : colors.textDisabled} />
              <Text style={[styles.groupBtnText, selectedSlotKeys.size === 0 && styles.deleteSelectedTextDisabled]}>
                {t('settings:medication_group_action')}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.deleteSelectedBtn, selectedSlotKeys.size === 0 && styles.deleteSelectedBtnDisabled]}
              onPress={handleDeleteSelected}
              disabled={selectedSlotKeys.size === 0}
            >
              <Ionicons name="trash-outline" size={16} color={selectedSlotKeys.size > 0 ? colors.error : colors.textDisabled} />
              <Text style={[styles.deleteSelectedText, selectedSlotKeys.size === 0 && styles.deleteSelectedTextDisabled]}>
                {t('settings:medication_delete_with_count', { count: selectedSlotKeys.size })}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      <Animated.View style={{ flex: 1, transform: [{ translateX: slideAnim }] }}>
      <ScrollView
        ref={scrollViewRef}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        {...scrollHandlers}
      >
        {/* 빠른 기록 — 부작용 기록 */}
        {isToday && (
          <TouchableOpacity
            style={[styles.sideEffectChip, { backgroundColor: colors.errorLight, borderColor: colors.error + '40' }]}
            onPress={() => navigation.navigate('SideEffectLog' as any)}
            activeOpacity={0.75}
          >
            <Ionicons name="medical-outline" size={14} color={colors.error} />
            <Text style={[styles.sideEffectChipText, { color: colors.error }]}>
              {t('sideeffect:quick_side_effect')}
            </Text>
          </TouchableOpacity>
        )}

        {/* 완료율 카드 */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryDate}>{dateLabel}</Text>
            <View style={styles.summaryRateRow}>
              <Text style={styles.summaryRate}>{takenSlots} / {totalSlots}</Text>
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
            <Text style={styles.summaryEmpty}>{t('settings:medication_no_today')}</Text>
          ) : (
            <Text style={styles.summaryPercent}>{`${Math.round(completionRate * 100)}%`}</Text>
          )}
          {totalSlots > 0 && (
            <Text style={styles.summaryLabel}>{t('settings:medication_complete')}</Text>
          )}
        </View>

        {/* 시간대별 카드 */}
        {!hasAnySlots ? (
          <View style={styles.emptyWrap}>
            <Text style={styles.emptyText}>
              {isToday
                ? t('settings:medication_empty_title')
                : isFutureDate
                ? t('settings:medication_no_today_planned')
                : t('settings:medication_no_active_for_date')}
            </Text>
            <Text style={styles.emptySubText}>
              {isToday
                ? t('settings:medication_empty_desc')
                : isFutureDate
                ? t('settings:medication_register_first')
                : t('settings:medication_check_dates_hint')}
            </Text>
            {!isToday && (
              <TouchableOpacity
                onPress={() => navigation.replace('MedicationHome', {})}
                style={[styles.emptyGoTodayBtn, { backgroundColor: colors.primaryMuted, borderColor: colors.primary + '40' }]}
              >
                <Ionicons name="today-outline" size={14} color={colors.primary} />
                <Text style={[styles.emptyGoTodayText, { color: colors.primary }]}>{t('settings:medication_go_today')}</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          sections.map((section) => {
            const firstItem = section.items[0];
            return (
              <View
                key={section.key}
                style={styles.slotGroup}
              >
                <View style={styles.slotHeaderRow}>
                  <Text style={[styles.slotHeaderLabel, { color: section.color }]}>
                    {section.label}
                  </Text>
                  {section.notifyTime && (
                    <Text style={[styles.slotHeaderTime, { color: colors.textSub }]}>
                      {formatSlotTime(section.notifyTime)}
                    </Text>
                  )}
                </View>

                <View style={styles.medicationCardWrap}>
                  <MedicationCard
                    items={section.items}
                    pendingScheduleIds={pendingIds}
                    isEditMode={isEditMode}
                    selectedSlotKeys={selectedSlotKeys}
                    checkDisabled={isFutureDate}
                    onToggleSelect={(scheduleId, timeSlot) => toggleSelect(scheduleId, timeSlot)}
                    onDrugPress={(scheduleId, drugName) => showItemActions(scheduleId, drugName)}
                    onDelete={(scheduleId, drugName) => handleDelete(scheduleId, drugName)}
                    onTaken={(scheduleId, currentStatus) => handleCheck(scheduleId, 'TAKEN', firstItem.timeSlot, currentStatus)}
                    onSkipped={(scheduleId, currentStatus) => handleCheck(scheduleId, 'SKIPPED', firstItem.timeSlot, currentStatus)}
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

      <MedicationGroupModal
        visible={showGroupModal}
        selectedSlotKeys={selectedSlotKeys}
        allSlotItems={TIME_SLOTS.flatMap((s) => slotGroups[s])}
        onSuccess={() => {
          setShowGroupModal(false);
          setSelectedSlotKeys(new Set());
          setIsEditMode(false);
        }}
        onClose={() => setShowGroupModal(false)}
      />
    </SafeAreaView>
  );
};

const getStyles = (colors: ReturnType<typeof useTheme>['colors'], tabBarSafeBottom: number) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    content: { padding: sizes.spacing.lg, paddingBottom: tabBarSafeBottom + 80, gap: sizes.spacing.md },
    sideEffectChip: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      alignSelf: 'flex-start' as const,
      gap: 5,
      paddingHorizontal: sizes.spacing.md,
      paddingVertical: sizes.spacing.xs + 2,
      borderRadius: sizes.radius.full,
      borderWidth: 1,
    },
    sideEffectChipText: {
      fontSize: sizes.font.sm,
      fontFamily: fontFamily.semibold,
    },
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
      gap: 10,
    },
    headerEditBtn: {
      width: 38,
      height: 38,
      borderRadius: 19,
      backgroundColor: colors.surface,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      borderWidth: 1,
      borderColor: colors.cardBorder,
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
    groupBtn: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: sizes.spacing.xs,
      paddingHorizontal: sizes.spacing.md,
      paddingVertical: sizes.spacing.sm,
      borderRadius: sizes.radius.full,
      backgroundColor: colors.primaryMuted,
    },
    groupBtnText: {
      fontSize: sizes.font.sm,
      color: colors.primary,
      fontFamily: fontFamily.semibold,
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
      bottom: tabBarSafeBottom,
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
