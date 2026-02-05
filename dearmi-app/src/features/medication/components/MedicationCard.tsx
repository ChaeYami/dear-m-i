import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, sizes, fontFamily } from '@/shared/theme';
import { TimeSlotRow } from './TimeSlotRow';
import type { TimeSlotType, MedicationLogStatus } from '@/shared/types/domain.types';

export interface SlotItem {
  scheduleId: string;
  drugName: string;
  dosage?: string;
  status: MedicationLogStatus | null;
  logId: string | null;
  notifyTime?: string;
}

interface Props {
  timeSlot: TimeSlotType;
  items: SlotItem[];
  pendingScheduleIds: Set<string>;
  isEditMode?: boolean;
  selectedIds?: Set<string>;
  onToggleSelect?: (scheduleId: string) => void;
  onDrugPress: (scheduleId: string, drugName: string) => void;
  onDelete: (scheduleId: string, drugName: string) => void;
  onTaken: (scheduleId: string) => void;
  onSkipped: (scheduleId: string) => void;
}

const SLOT_LABELS: Record<TimeSlotType, string> = {
  MORNING: '아침',
  AFTERNOON: '점심',
  EVENING: '저녁',
  BEDTIME: '취침 전',
};

const SLOT_COLORS: Record<TimeSlotType, string> = {
  MORNING: '#F59E0B',
  AFTERNOON: '#3B82F6',
  EVENING: '#8B5CF6',
  BEDTIME: '#374151',
};

const formatTime = (t?: string) => {
  if (!t) return '';
  return t.slice(0, 5); // "HH:mm:ss" → "HH:mm"
};

export const MedicationCard: React.FC<Props> = ({
  timeSlot,
  items,
  pendingScheduleIds,
  isEditMode,
  selectedIds,
  onToggleSelect,
  onDrugPress,
  onDelete,
  onTaken,
  onSkipped,
}) => {
  const { colors } = useTheme();
  const accentColor = SLOT_COLORS[timeSlot];
  const notifyTime = items[0]?.notifyTime;

  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.divider }]}>
      {/* 섹션 헤더 */}
      <View style={[styles.header, { borderLeftColor: accentColor, backgroundColor: colors.background }]}>
        <Text style={[styles.slotLabel, { color: accentColor }]}>
          {SLOT_LABELS[timeSlot]}
        </Text>
        {notifyTime ? (
          <Text style={[styles.slotTime, { color: colors.textSub }]}>{formatTime(notifyTime)}</Text>
        ) : null}
      </View>

      {/* 약품 행 목록 */}
      {items.map((item) => (
        <View key={item.scheduleId} style={styles.rowWrap}>
          {isEditMode && (
            <TouchableOpacity
              style={styles.checkbox}
              onPress={() => onToggleSelect?.(item.scheduleId)}
              hitSlop={8}
            >
              <Ionicons
                name={selectedIds?.has(item.scheduleId) ? 'checkbox' : 'square-outline'}
                size={22}
                color={selectedIds?.has(item.scheduleId) ? colors.primary : colors.textDisabled}
              />
            </TouchableOpacity>
          )}
          <View style={styles.rowContent}>
            <TimeSlotRow
              drugName={item.drugName}
              dosage={item.dosage}
              status={item.status}
              isPending={pendingScheduleIds.has(item.scheduleId)}
              onDrugPress={() => isEditMode ? onToggleSelect?.(item.scheduleId) : onDrugPress(item.scheduleId, item.drugName)}
              onDelete={() => onDelete(item.scheduleId, item.drugName)}
              onTaken={() => onTaken(item.scheduleId)}
              onSkipped={() => onSkipped(item.scheduleId)}
            />
          </View>
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: sizes.radius.lg,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: sizes.spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: sizes.spacing.md,
    paddingVertical: sizes.spacing.sm,
    borderLeftWidth: 4,
    gap: sizes.spacing.sm,
  },
  slotLabel: {
    fontSize: sizes.font.md,
    fontFamily: fontFamily.bold,
  },
  slotTime: {
    fontSize: sizes.font.sm,
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
