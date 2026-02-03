import React from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, sizes } from '@/constants';
import type { MedicationLogStatus } from '@/shared/types/domain.types';

interface Props {
  drugName: string;
  dosage?: string;
  status: MedicationLogStatus | null;
  isPending?: boolean;
  onDrugPress: () => void;
  onDelete: () => void;
  onTaken: () => void;
  onSkipped: () => void;
}

export const TimeSlotRow: React.FC<Props> = ({
  drugName,
  dosage,
  status,
  isPending,
  onDrugPress,
  onDelete,
  onTaken,
  onSkipped,
}) => {
  const isTaken = status === 'TAKEN';
  const isSkipped = status === 'SKIPPED';

  return (
    <View style={styles.row}>
      <TouchableOpacity style={styles.info} onPress={onDrugPress} onLongPress={onDelete} activeOpacity={0.7}>
        <View style={styles.drugNameRow}>
          <Text style={styles.drugName} numberOfLines={1}>{drugName}</Text>
          <Ionicons name="chevron-forward" size={14} color={colors.textDisabled} />
        </View>
        {dosage ? <Text style={styles.dosage}>{dosage}</Text> : null}
      </TouchableOpacity>

      {isPending ? (
        <ActivityIndicator size="small" color={colors.primary} />
      ) : (
        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.btn, isTaken && styles.btnTaken]}
            onPress={onTaken}
            activeOpacity={0.75}
          >
            {isTaken && <Ionicons name="checkmark" size={14} color={colors.success} />}
            <Text style={[styles.btnText, isTaken && styles.btnTextActive]}>
              복용
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.btn, isSkipped && styles.btnSkipped]}
            onPress={onSkipped}
            activeOpacity={0.75}
          >
            <Text style={[styles.btnText, isSkipped && styles.btnTextSkipped]}>
              건너뜀
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: sizes.spacing.sm,
    paddingHorizontal: sizes.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
    gap: sizes.spacing.sm,
  },
  info: { flex: 1 },
  drugNameRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 4,
  },
  drugName: {
    fontSize: sizes.font.md,
    fontWeight: sizes.fontWeight.medium,
    color: colors.text,
  },
  dosage: {
    fontSize: sizes.font.xs,
    color: colors.textSub,
    marginTop: 2,
  },
  actions: {
    flexDirection: 'row',
    gap: sizes.spacing.xs,
  },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: sizes.spacing.sm,
    paddingVertical: 6,
    borderRadius: sizes.radius.md,
    borderWidth: 1,
    borderColor: colors.divider,
    backgroundColor: colors.surfaceSolid,
    minWidth: 58,
    justifyContent: 'center',
  },
  btnTaken: {
    backgroundColor: colors.successLight,
    borderColor: colors.success,
  },
  btnSkipped: {
    backgroundColor: colors.skeleton,
    borderColor: colors.textDisabled,
  },
  btnText: {
    fontSize: sizes.font.xs,
    fontWeight: sizes.fontWeight.medium,
    color: colors.textSub,
  },
  btnTextActive: {
    color: colors.success,
  },
  btnTextSkipped: {
    color: colors.textDisabled,
  },
});
