import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, sizes } from '@/constants';
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
  onTaken,
  onSkipped,
}) => {
  const accentColor = SLOT_COLORS[timeSlot];
  const notifyTime = items[0]?.notifyTime;

  return (
    <View style={styles.card}>
      {/* 섹션 헤더 */}
      <View style={[styles.header, { borderLeftColor: accentColor }]}>
        <Text style={[styles.slotLabel, { color: accentColor }]}>
          {SLOT_LABELS[timeSlot]}
        </Text>
        {notifyTime ? (
          <Text style={styles.slotTime}>{formatTime(notifyTime)}</Text>
        ) : null}
      </View>

      {/* 약품 행 목록 */}
      {items.map((item) => (
        <TimeSlotRow
          key={item.scheduleId}
          drugName={item.drugName}
          dosage={item.dosage}
          status={item.status}
          isPending={pendingScheduleIds.has(item.scheduleId)}
          onTaken={() => onTaken(item.scheduleId)}
          onSkipped={() => onSkipped(item.scheduleId)}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: sizes.radius.lg,
    borderWidth: 1,
    borderColor: colors.divider,
    overflow: 'hidden',
    marginBottom: sizes.spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: sizes.spacing.md,
    paddingVertical: sizes.spacing.sm,
    borderLeftWidth: 4,
    backgroundColor: colors.background,
    gap: sizes.spacing.sm,
  },
  slotLabel: {
    fontSize: sizes.font.md,
    fontWeight: sizes.fontWeight.bold,
  },
  slotTime: {
    fontSize: sizes.font.sm,
    color: colors.textSub,
  },
});
