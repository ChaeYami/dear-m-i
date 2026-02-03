import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Switch,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { colors, sizes } from '@/constants';
import { EmotionSlider } from '@/shared/components/EmotionSlider';
import { TriggerTagSelector } from '@/features/checkin/components/TriggerTagSelector';
import { useCreateCheckin } from '@/features/checkin/hooks/useCheckin';
import { useAuthStore } from '@/features/auth/store/authStore';
import type { DailyCheckin } from '@/shared/types/domain.types';

const FREE_MEMO_LIMIT = 100;
const SLEEP_OPTIONS = Array.from({ length: 25 }, (_, i) => i * 0.5); // 0, 0.5, 1.0 ... 12.0

interface DailyCheckinFormProps {
  existingCheckin?: DailyCheckin | null;
  onClose: () => void;
}

export const DailyCheckinForm: React.FC<DailyCheckinFormProps> = ({
  existingCheckin,
  onClose,
}) => {
  const { t } = useTranslation('checkin');
  const user = useAuthStore((s) => s.user);
  const isPremium = user?.plan === 'PREMIUM';
  const memoLimit = isPremium ? undefined : FREE_MEMO_LIMIT;

  const [emotionScore, setEmotionScore] = useState(existingCheckin?.emotionScore ?? 5);
  const [triggerTags, setTriggerTags] = useState<string[]>(existingCheckin?.triggerTags ?? []);
  const [memo, setMemo] = useState(existingCheckin?.memo ?? '');
  const [sleepHours, setSleepHours] = useState<number>(existingCheckin?.sleepHours ?? 7);
  const [tookMedication, setTookMedication] = useState(existingCheckin?.tookMedication ?? false);
  const [showSleepPicker, setShowSleepPicker] = useState(false);

  const { mutate: saveCheckin, isPending } = useCreateCheckin();

  const handleSave = () => {
    if (memoLimit && memo.length > memoLimit) {
      Alert.alert(t('common:char_limit_exceeded'), t('common:char_limit_message', { limit: memoLimit }));
      return;
    }

    saveCheckin(
      {
        emotionScore,
        triggerTags: triggerTags.length > 0 ? triggerTags : undefined,
        memo: memo.trim() || undefined,
        sleepHours,
        tookMedication,
      },
      {
        onSuccess: () => onClose(),
        onError: () => Alert.alert(t('common:save_failed'), t('common:try_again_later')),
      }
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose} hitSlop={12}>
          <Text style={styles.headerCancel}>{t('common:cancel')}</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('form_title')}</Text>
        <TouchableOpacity onPress={handleSave} disabled={isPending} hitSlop={12}>
          <Text style={[styles.headerSave, isPending && styles.headerSaveDisabled]}>
            {isPending ? t('common:saving') : t('common:save')}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.field}>
          <Text style={styles.fieldLabel}>{t('emotion_score')}</Text>
          <EmotionSlider value={emotionScore} onChange={setEmotionScore} />
        </View>

        <View style={styles.field}>
          <Text style={styles.fieldLabel}>{t('trigger_label')}</Text>
          <TriggerTagSelector selectedTags={triggerTags} onChangeTags={setTriggerTags} />
        </View>

        <View style={styles.field}>
          <View style={styles.fieldLabelRow}>
            <Text style={styles.fieldLabel}>{t('memo_label')}</Text>
            {memoLimit && (
              <Text style={[styles.charCount, memo.length > memoLimit && styles.charCountOver]}>
                {memo.length}/{memoLimit}
              </Text>
            )}
          </View>
          <TextInput
            style={[styles.textArea, memo.length > (memoLimit ?? Infinity) && styles.textAreaError]}
            placeholder={t('memo_placeholder')}
            placeholderTextColor={colors.textDisabled}
            value={memo}
            onChangeText={setMemo}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.fieldLabel}>{t('sleep_label')}</Text>
          <TouchableOpacity
            style={styles.sleepSelector}
            onPress={() => setShowSleepPicker((v) => !v)}
            activeOpacity={0.8}
          >
            <Text style={styles.sleepValue}>{t('sleep_unit', { hours: sleepHours })}</Text>
            <Ionicons
              name={showSleepPicker ? 'chevron-up' : 'chevron-down'}
              size={16}
              color={colors.textSub}
            />
          </TouchableOpacity>
          {showSleepPicker && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.sleepGrid}>
              {SLEEP_OPTIONS.map((h) => (
                <TouchableOpacity
                  key={h}
                  style={[styles.sleepChip, h === sleepHours && styles.sleepChipSelected]}
                  onPress={() => {
                    setSleepHours(h);
                    setShowSleepPicker(false);
                  }}
                >
                  <Text style={[styles.sleepChipText, h === sleepHours && styles.sleepChipTextSelected]}>
                    {h}h
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
        </View>

        <View style={styles.medRow}>
          <Text style={styles.fieldLabel}>{t('medication_toggle')}</Text>
          <Switch
            value={tookMedication}
            onValueChange={setTookMedication}
            trackColor={{ false: colors.disabled, true: colors.primaryLight }}
            thumbColor={tookMedication ? colors.primary : '#f4f3f4'}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    height: sizes.headerHeight,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: sizes.spacing.lg,
    backgroundColor: colors.surfaceSolid,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  headerTitle: {
    fontSize: sizes.font.lg,
    fontWeight: sizes.fontWeight.bold,
    color: colors.text,
  },
  headerCancel: { fontSize: sizes.font.md, color: colors.textSub },
  headerSave: {
    fontSize: sizes.font.md,
    fontWeight: sizes.fontWeight.semibold,
    color: colors.primary,
  },
  headerSaveDisabled: { opacity: 0.4 },
  content: { padding: sizes.spacing.lg, gap: sizes.spacing.xl, paddingBottom: 40 },
  field: { gap: sizes.spacing.sm },
  fieldLabelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  fieldLabel: {
    fontSize: sizes.font.sm,
    fontWeight: sizes.fontWeight.medium,
    color: colors.textSub,
  },
  charCount: { fontSize: sizes.font.xs, color: colors.textDisabled },
  charCountOver: { color: colors.error, fontWeight: sizes.fontWeight.semibold },
  textArea: {
    backgroundColor: colors.surfaceSolid,
    borderWidth: 1,
    borderColor: colors.divider,
    borderRadius: sizes.radius.md,
    paddingHorizontal: sizes.spacing.md,
    paddingTop: sizes.spacing.md,
    paddingBottom: sizes.spacing.md,
    fontSize: sizes.font.md,
    color: colors.text,
    minHeight: 100,
    lineHeight: 22,
  },
  textAreaError: { borderColor: colors.error },
  sleepSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surfaceSolid,
    borderWidth: 1,
    borderColor: colors.divider,
    borderRadius: sizes.radius.md,
    paddingHorizontal: sizes.spacing.md,
    paddingVertical: sizes.spacing.md,
  },
  sleepValue: { fontSize: sizes.font.md, color: colors.text },
  sleepGrid: {
    maxHeight: 44,
  },
  sleepChip: {
    paddingHorizontal: sizes.spacing.md,
    paddingVertical: sizes.spacing.sm,
    borderRadius: sizes.radius.full,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.divider,
    marginRight: sizes.spacing.xs,
  },
  sleepChipSelected: {
    backgroundColor: colors.primaryLight + '25',
    borderColor: colors.primary,
  },
  sleepChipText: {
    fontSize: sizes.font.sm,
    color: colors.textSub,
  },
  sleepChipTextSelected: {
    color: colors.primary,
    fontWeight: sizes.fontWeight.semibold,
  },
  medRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surfaceSolid,
    borderRadius: sizes.radius.md,
    padding: sizes.spacing.md,
    borderWidth: 1,
    borderColor: colors.divider,
  },
});
