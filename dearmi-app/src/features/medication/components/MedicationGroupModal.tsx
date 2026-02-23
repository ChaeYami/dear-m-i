import React, { useState, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Pressable,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme, sizes, fontFamily } from '@/shared/theme';
import {
  useCreateMedicationSlotGroup,
  useAssignMedicationSlotGroup,
} from '@/features/medication/hooks/useMedication';
import type { TimeSlotType } from '@/shared/types/domain.types';

interface Props {
  visible: boolean;
  selectedSlotKeys: Set<string>; // "scheduleId:timeSlot"
  onSuccess: () => void;
  onClose: () => void;
}

const SUGGESTIONS = ['아침', '점심', '저녁', '취침전'];

export const MedicationGroupModal: React.FC<Props> = ({
  visible,
  selectedSlotKeys,
  onSuccess,
  onClose,
}) => {
  const { colors } = useTheme();
  const { t } = useTranslation(['settings', 'common']);
  const [groupName, setGroupName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const inputRef = useRef<TextInput>(null);

  const { mutateAsync: createGroup } = useCreateMedicationSlotGroup();
  const { mutateAsync: assignGroup } = useAssignMedicationSlotGroup();

  const handleClose = () => {
    setGroupName('');
    onClose();
  };

  const handleConfirm = async () => {
    const name = groupName.trim();
    if (!name || isSubmitting) return;

    // Parse selectedSlotKeys into { scheduleId → timeSlots[] }
    const scheduleMap = new Map<string, string[]>();
    for (const key of selectedSlotKeys) {
      const colonIdx = key.indexOf(':');
      if (colonIdx === -1) continue;
      const scheduleId = key.slice(0, colonIdx);
      const timeSlot = key.slice(colonIdx + 1) as TimeSlotType;
      if (!scheduleMap.has(scheduleId)) scheduleMap.set(scheduleId, []);
      scheduleMap.get(scheduleId)!.push(timeSlot);
    }

    setIsSubmitting(true);
    try {
      const res = await createGroup(name);
      const groupId = res.data.data?.id;
      if (!groupId) throw new Error('No groupId returned');

      await Promise.all(
        [...scheduleMap.entries()].map(([scheduleId, timeSlots]) =>
          assignGroup({ scheduleId, timeSlots, groupId })
        )
      );

      setGroupName('');
      onSuccess();
    } catch {
      // error handled by query — just re-enable button
    } finally {
      setIsSubmitting(false);
    }
  };

  const styles = getStyles(colors);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
      <Pressable style={styles.backdrop} onPress={handleClose}>
        <Pressable style={styles.sheet} onPress={() => {}}>
          <Text style={styles.title}>{t('medication_group_action')}</Text>

          {/* 제안 칩 */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.suggestionsRow}
          >
            <Text style={styles.suggestLabel}>{t('medication_group_suggestions')}</Text>
            {SUGGESTIONS.map((s) => (
              <TouchableOpacity
                key={s}
                style={[
                  styles.chip,
                  groupName === s && { backgroundColor: colors.primary, borderColor: colors.primary },
                ]}
                onPress={() => {
                  setGroupName(s);
                  inputRef.current?.blur();
                }}
              >
                <Text style={[styles.chipText, groupName === s && { color: colors.textInverse }]}>
                  {s}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* 이름 입력 */}
          <TextInput
            ref={inputRef}
            style={[styles.input, { color: colors.text, borderColor: groupName.trim() ? colors.primary : colors.divider }]}
            placeholder={t('medication_group_name_placeholder')}
            placeholderTextColor={colors.textDisabled}
            value={groupName}
            onChangeText={setGroupName}
            maxLength={50}
            returnKeyType="done"
            onSubmitEditing={handleConfirm}
          />

          {/* 버튼 행 */}
          <View style={styles.btnRow}>
            <TouchableOpacity style={[styles.btn, styles.cancelBtn]} onPress={handleClose}>
              <Text style={[styles.btnText, { color: colors.textSub }]}>{t('common:cancel')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.btn, styles.confirmBtn, { backgroundColor: colors.primary }, (!groupName.trim() || isSubmitting) && styles.confirmBtnDisabled]}
              onPress={handleConfirm}
              disabled={!groupName.trim() || isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color={colors.textInverse} />
              ) : (
                <Text style={[styles.btnText, { color: colors.textInverse }]}>{t('medication_group_confirm')}</Text>
              )}
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

const getStyles = (colors: ReturnType<typeof useTheme>['colors']) =>
  StyleSheet.create({
    backdrop: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.45)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: sizes.spacing.lg,
    },
    sheet: {
      width: '100%',
      backgroundColor: colors.surface,
      borderRadius: sizes.radius.xxl,
      padding: sizes.spacing.xl,
      gap: sizes.spacing.md,
    },
    title: {
      fontSize: sizes.font.lg,
      fontFamily: fontFamily.bold,
      color: colors.text,
      marginBottom: sizes.spacing.xs,
    },
    suggestionsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: sizes.spacing.sm,
      paddingVertical: sizes.spacing.xs,
    },
    suggestLabel: {
      fontSize: sizes.font.sm,
      fontFamily: fontFamily.medium,
      color: colors.textSub,
      marginRight: sizes.spacing.xs,
    },
    chip: {
      paddingHorizontal: sizes.spacing.md,
      paddingVertical: sizes.spacing.xs + 2,
      borderRadius: sizes.radius.full,
      borderWidth: 1,
      borderColor: colors.divider,
      backgroundColor: colors.background,
    },
    chipText: {
      fontSize: sizes.font.sm,
      fontFamily: fontFamily.semibold,
      color: colors.text,
    },
    input: {
      borderWidth: 1.5,
      borderRadius: sizes.radius.lg,
      paddingHorizontal: sizes.spacing.md,
      paddingVertical: sizes.spacing.sm + 2,
      fontSize: sizes.font.md,
      fontFamily: fontFamily.regular,
      backgroundColor: colors.background,
    },
    btnRow: {
      flexDirection: 'row',
      gap: sizes.spacing.sm,
      marginTop: sizes.spacing.xs,
    },
    btn: {
      flex: 1,
      paddingVertical: sizes.spacing.md,
      borderRadius: sizes.radius.lg,
      alignItems: 'center',
      justifyContent: 'center',
    },
    cancelBtn: {
      backgroundColor: colors.disabled,
    },
    confirmBtn: {
      // backgroundColor set inline
    },
    confirmBtnDisabled: {
      opacity: 0.45,
    },
    btnText: {
      fontSize: sizes.font.md,
      fontFamily: fontFamily.semibold,
    },
  });
