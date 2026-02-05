import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import type { StackNavigationProp } from '@react-navigation/stack';
import { useTheme, sizes, fontFamily } from '@/shared/theme';
import { softShadow, floatingShadow } from '@/shared/theme/shadows';
import { AnimatedPressable } from '@/shared/components/AnimatedPressable';
import { useTodayMedication, useCheckMedication, useDeleteMedicationSchedule } from '@/features/medication/hooks/useMedication';
import { MedicationCard, type SlotItem } from '@/features/medication/components/MedicationCard';
import { LoadingSpinner } from '@/shared/components/LoadingSpinner';
import { ScreenHeader } from '@/shared/components/ScreenHeader';
import { useResetStackOnTabFocus } from '@/shared/hooks/useResetStackOnTabFocus';
import type { MedicationStackParamList } from '@/navigation/MedicationNavigator';
import type { TimeSlotType } from '@/shared/types/domain.types';

type Nav = StackNavigationProp<MedicationStackParamList, 'MedicationHome'>;

const TIME_SLOTS: TimeSlotType[] = ['MORNING', 'AFTERNOON', 'EVENING', 'BEDTIME'];

const todayStr = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

export const MedicationHomeScreen: React.FC = () => {
  useResetStackOnTabFocus();
  const { colors } = useTheme();
  const navigation = useNavigation<Nav>();
  const { data, isLoading } = useTodayMedication();
  const { mutate: checkMedication, isPending: isChecking } = useCheckMedication();
  const { mutate: deleteMedicationSchedule } = useDeleteMedicationSchedule();

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
    Alert.alert('복약 일정 삭제', `${selectedIds.size}개 약품을 삭제할까요?`, [
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
    Alert.alert('복약 일정 삭제', `'${drugName}'을(를) 삭제할까요?`, [
      { text: '취소', style: 'cancel' },
      { text: '삭제', style: 'destructive', onPress: () => deleteMedicationSchedule(scheduleId) },
    ]);
  };

  const handleCheck = (scheduleId: string, status: 'TAKEN' | 'SKIPPED', timeSlot: TimeSlotType) => {
    setPendingIds((prev) => new Set(prev).add(scheduleId));
    checkMedication(
      { scheduleId, req: { logDate: todayStr(), timeSlot, status } },
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

  // 전체 scheduleId 목록 (편집 모드용)
  const allScheduleIds = useMemo(() => {
    const ids: string[] = [];
    for (const slot of TIME_SLOTS) {
      for (const item of slotGroups[slot]) {
        if (!ids.includes(item.scheduleId)) ids.push(item.scheduleId);
      }
    }
    return ids;
  }, [slotGroups]);

  // 완료율 계산
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
  const today = new Date();
  const dateLabel = `${today.getMonth() + 1}월 ${today.getDate()}일`;

  if (isLoading) return <LoadingSpinner fullscreen />;

  const hasAnySlots = TIME_SLOTS.some((s) => slotGroups[s].length > 0);

  const styles = getStyles(colors);

  return (
    <SafeAreaView style={styles.container}>
      <ScreenHeader
        variant="tab"
        title="복약 관리"
        rightContent={
          hasAnySlots ? (
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
            >
              <Text style={styles.editBtn}>{isEditMode ? '완료' : '편집'}</Text>
            </TouchableOpacity>
          ) : undefined
        }
      />

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

      <ScrollView contentContainerStyle={styles.content}>
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
          <Text style={styles.summaryPercent}>
            {totalSlots === 0
              ? '오늘 복약 일정이 없습니다'
              : `${Math.round(completionRate * 100)}%`}
          </Text>
          {totalSlots > 0 && (
            <Text style={styles.summaryLabel}>완료</Text>
          )}
        </View>

        {/* 시간대별 카드 */}
        {!hasAnySlots ? (
          <View style={styles.emptyWrap}>
            <Text style={styles.emptyText}>등록된 복약 일정이 없어요</Text>
            <Text style={styles.emptySubText}>+ 버튼을 눌러 복약 일정을 추가해보세요</Text>
          </View>
        ) : (
          TIME_SLOTS.map((slot) =>
            slotGroups[slot].length > 0 ? (
              <AnimatedPressable
                key={slot}
                style={styles.medicationCardWrap}
              >
                <MedicationCard
                  timeSlot={slot}
                  items={slotGroups[slot]}
                  pendingScheduleIds={pendingIds}
                  isEditMode={isEditMode}
                  selectedIds={selectedIds}
                  onToggleSelect={toggleSelect}
                  onDrugPress={(scheduleId, drugName) =>
                    navigation.navigate('MedicationScheduleDetail', { scheduleId, drugName })
                  }
                  onDelete={(scheduleId, drugName) => handleDelete(scheduleId, drugName)}
                  onTaken={(scheduleId) => handleCheck(scheduleId, 'TAKEN', slot)}
                  onSkipped={(scheduleId) => handleCheck(scheduleId, 'SKIPPED', slot)}
                />
              </AnimatedPressable>
            ) : null
          )
        )}

        {/* 복약 이력 버튼 */}
        <AnimatedPressable
          style={styles.historyBtn}
          onPress={() => navigation.navigate('MedicationHistory')}
        >
          <Text style={styles.historyBtnText}>복약 이력 보기</Text>
        </AnimatedPressable>
      </ScrollView>

      {/* FAB */}
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
    </SafeAreaView>
  );
};

const getStyles = (colors: ReturnType<typeof useTheme>['colors']) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    content: { padding: sizes.spacing.lg, paddingBottom: sizes.tabBarSafeBottom + 80, gap: sizes.spacing.md },
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
    summaryLabel: {
      fontSize: sizes.font.xs,
      color: colors.textSub,
      textAlign: 'right',
      marginTop: -4,
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
    historyBtn: {
      paddingVertical: sizes.spacing.md,
      borderRadius: sizes.radius.xxl,
      backgroundColor: colors.surface,
      ...softShadow(colors),
      alignItems: 'center',
      marginTop: sizes.spacing.sm,
    },
    historyBtnText: {
      fontSize: sizes.font.md,
      color: colors.primary,
      fontFamily: fontFamily.medium,
    },
    editBtn: {
      fontSize: sizes.font.md,
      color: colors.primary,
      fontFamily: fontFamily.semibold,
      minWidth: 48,
      textAlign: 'right' as const,
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
    fab: {
      position: 'absolute',
      bottom: sizes.tabBarSafeBottom + sizes.spacing.md,
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
    fabIcon: { fontSize: 28, color: colors.textInverse, lineHeight: 32 },
  });
