import React from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useTheme, sizes, fontFamily } from '@/shared/theme';
import { AnimatedPressable } from '@/shared/components/AnimatedPressable';
import type { MedicationLogStatus } from '@/shared/types/domain.types';

interface Props {
  drugName: string;
  dosage?: string;
  status: MedicationLogStatus | null;
  isPending?: boolean;
  checkDisabled?: boolean;
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
  checkDisabled,
  onDrugPress,
  onDelete,
  onTaken,
  onSkipped,
}) => {
  const { colors } = useTheme();
  const { t } = useTranslation('settings');
  const isTaken = status === 'TAKEN';
  const isSkipped = status === 'SKIPPED';

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
        paddingHorizontal: sizes.spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: colors.divider,
        gap: sizes.spacing.sm,
      }}
    >
      <AnimatedPressable
        onPress={onDrugPress}
        onLongPress={onDelete}
        style={{ flex: 1 }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <Text
            style={{
              fontFamily: fontFamily.medium,
              fontSize: sizes.font.md,
              color: colors.text,
            }}
            numberOfLines={1}
          >
            {drugName}
          </Text>
          <Ionicons name="chevron-forward" size={14} color={colors.textDisabled} />
        </View>
        {dosage ? (
          <Text
            style={{
              fontFamily: fontFamily.regular,
              fontSize: sizes.font.xs,
              color: colors.textSub,
              marginTop: 2,
            }}
          >
            {dosage}
          </Text>
        ) : null}
      </AnimatedPressable>

      {isPending ? (
        <ActivityIndicator size="small" color={colors.primary} />
      ) : (
        <View style={{ flexDirection: 'row', gap: 6 }}>
          <TouchableOpacity
            style={[
              {
                flexDirection: 'row',
                alignItems: 'center',
                gap: 4,
                paddingHorizontal: 14,
                paddingVertical: 8,
                borderRadius: sizes.radius.full,
                borderWidth: 1.5,
                borderColor: colors.divider,
                backgroundColor: colors.surface,
                minWidth: 64,
                justifyContent: 'center',
              },
              isTaken && {
                backgroundColor: colors.successLight,
                borderColor: colors.success,
              },
              checkDisabled && { opacity: 0.35 },
            ]}
            onPress={checkDisabled ? undefined : onTaken}
            activeOpacity={checkDisabled ? 1 : 0.75}
            disabled={checkDisabled}
          >
            {isTaken && <Ionicons name="checkmark-circle" size={15} color={colors.success} />}
            <Text
              style={{
                fontFamily: fontFamily.semibold,
                fontSize: sizes.font.sm,
                color: isTaken ? colors.success : colors.textSub,
              }}
            >
              {t('medication_status_taken')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              {
                flexDirection: 'row',
                alignItems: 'center',
                paddingHorizontal: 14,
                paddingVertical: 8,
                borderRadius: sizes.radius.full,
                borderWidth: 1.5,
                borderColor: colors.divider,
                backgroundColor: colors.surface,
                minWidth: 64,
                justifyContent: 'center',
              },
              isSkipped && {
                backgroundColor: colors.disabled,
                borderColor: colors.textDisabled,
              },
              checkDisabled && { opacity: 0.35 },
            ]}
            onPress={checkDisabled ? undefined : onSkipped}
            activeOpacity={checkDisabled ? 1 : 0.75}
            disabled={checkDisabled}
          >
            <Text
              style={{
                fontFamily: fontFamily.semibold,
                fontSize: sizes.font.sm,
                color: isSkipped ? colors.textDisabled : colors.textSub,
              }}
            >
              {t('medication_status_skipped')}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};
