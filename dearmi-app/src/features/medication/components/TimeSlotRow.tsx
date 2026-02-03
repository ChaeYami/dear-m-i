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
  onTaken: () => void;
  onSkipped: () => void;
}

export const TimeSlotRow: React.FC<Props> = ({
  drugName,
  dosage,
  status,
  isPending,
  onTaken,
  onSkipped,
}) => {
  const isTaken = status === 'TAKEN';
  const isSkipped = status === 'SKIPPED';

  return (
    <View style={styles.row}>
      <View style={styles.info}>
        <Text style={styles.drugName} numberOfLines={1}>{drugName}</Text>
        {dosage ? <Text style={styles.dosage}>{dosage}</Text> : null}
      </View>

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
