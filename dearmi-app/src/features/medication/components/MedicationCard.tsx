import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, sizes, fontFamily } from '@/shared/theme';
import { TimeSlotRow } from './TimeSlotRow';
import type { TimeSlotType, MedicationLogStatus } from '@/shared/types/domain.types';
import i18n from '@/locales/i18n';

export interface SlotItem {
  scheduleId: string;
  drugName: string;
  dosage?: string;
  status: MedicationLogStatus | null;
  logId: string | null;
  notifyTime?: string;
  groupId?: string | null;
  groupName?: string | null;
  timeSlot: TimeSlotType;
}

interface Props {
  items: SlotItem[];
  pendingScheduleIds: Set<string>;
  isEditMode?: boolean;
  selectedSlotKeys?: Set<string>;
  checkDisabled?: boolean;
  onToggleSelect?: (scheduleId: string, timeSlot: TimeSlotType) => void;
  onDrugPress: (scheduleId: string, drugName: string) => void;
  onDelete: (scheduleId: string, drugName: string) => void;
  onTaken: (scheduleId: string, currentStatus: MedicationLogStatus | null) => void;
  onSkipped: (scheduleId: string, currentStatus: MedicationLogStatus | null) => void;
}

export const MedicationCard: React.FC<Props> = ({
  items,
  pendingScheduleIds,
  isEditMode,
  selectedSlotKeys,
  checkDisabled,
  onToggleSelect,
  onDrugPress,
  onDelete,
  onTaken,
  onSkipped,
}) => {
  const { colors } = useTheme();

  return (
    <View style={[styles.card, { backgroundColor: colors.surface }]}>
      {items.map((item) => (
        <View key={item.scheduleId} style={styles.rowWrap}>
          {isEditMode && (
            <TouchableOpacity
              style={styles.checkbox}
              onPress={() => onToggleSelect?.(item.scheduleId, item.timeSlot)}
              hitSlop={8}
            >
              <Ionicons
                name={selectedSlotKeys?.has(`${item.scheduleId}:${item.timeSlot}`) ? 'checkbox' : 'square-outline'}
                size={22}
                color={selectedSlotKeys?.has(`${item.scheduleId}:${item.timeSlot}`) ? colors.primary : colors.textDisabled}
              />
            </TouchableOpacity>
          )}
          <View style={styles.rowContent}>
            <TimeSlotRow
              drugName={item.drugName}
              dosage={item.dosage}
              status={item.status}
              isPending={pendingScheduleIds.has(item.scheduleId)}
              checkDisabled={checkDisabled}
              onDrugPress={() => isEditMode ? onToggleSelect?.(item.scheduleId, item.timeSlot) : onDrugPress(item.scheduleId, item.drugName)}
              onDelete={() => onDelete(item.scheduleId, item.drugName)}
              onTaken={() => onTaken(item.scheduleId, item.status)}
              onSkipped={() => onSkipped(item.scheduleId, item.status)}
            />
          </View>
        </View>
      ))}
    </View>
  );
};

export const getSlotLabels = (): Record<TimeSlotType, string> => ({
  MORNING: i18n.t('common:time_morning'),
  AFTERNOON: i18n.t('common:time_afternoon'),
  EVENING: i18n.t('common:time_evening'),
  BEDTIME: i18n.t('common:time_bedtime'),
});

export const SLOT_LABELS: Record<TimeSlotType, string> = new Proxy({} as Record<TimeSlotType, string>, {
  get: (_, key: string) => getSlotLabels()[key as TimeSlotType] ?? key,
});

export const SLOT_COLORS: Record<TimeSlotType, string> = {
  MORNING: '#F59E0B',
  AFTERNOON: '#3B82F6',
  EVENING: '#8B5CF6',
  BEDTIME: '#374151',
};

export const formatSlotTime = (t?: string) => {
  if (!t) return '';
  return t.slice(0, 5); // "HH:mm:ss" → "HH:mm"
};

const styles = StyleSheet.create({
  card: {
    borderRadius: sizes.radius.xxl,
    overflow: 'hidden',
  },
  rowWrap: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    paddingLeft: sizes.spacing.md,
    paddingRight: sizes.spacing.xs,
    paddingVertical: sizes.spacing.sm,
  },
  rowContent: {
    flex: 1,
  },
});
