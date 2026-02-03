import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Switch,
  ScrollView,
  StyleSheet,
  
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { colors, sizes } from '@/constants';
import { EmotionSlider } from '@/shared/components/EmotionSlider';
import { TriggerTagSelector } from '@/features/checkin/components/TriggerTagSelector';
import { useCreateCheckin } from '@/features/checkin/hooks/useCheckin';
import { useAuthStore } from '@/features/auth/store/authStore';
import type { DailyCheckin } from '@/shared/types/domain.types';

const FREE_MEMO_LIMIT = 100;

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
  const [sleepInput, setSleepInput] = useState(String(existingCheckin?.sleepHours ?? 7));
  const [tookMedication, setTookMedication] = useState(existingCheckin?.tookMedication ?? false);

  const { mutate: saveCheckin, isPending } = useCreateCheckin();

  const parseSleepHours = (): number => {
    const parsed = parseFloat(sleepInput);
    if (isNaN(parsed) || parsed < 0) return 0;
    if (parsed > 24) return 24;
    return Math.round(parsed * 2) / 2; // 0.5 단위로 반올림
  };

  const handleSave = () => {
    if (memoLimit && memo.length > memoLimit) {
      Alert.alert(t('common:char_limit_exceeded'), t('common:char_limit_message', { limit: memoLimit }));
      return;
    }

    const sleepHours = parseSleepHours();

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

  const adjustSleep = (delta: number) => {
    const current = parseSleepHours();
    const next = Math.max(0, Math.min(24, current + delta));
    setSleepInput(String(next));
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose} hitSlop={12} style={styles.headerBackBtn}>
          <Ionicons name="close" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('form_title')}</Text>
        <View style={{ width: 48 }} />
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

        {/* 수면 시간 — 직접 입력 + 스테퍼 */}
        <View style={styles.field}>
          <Text style={styles.fieldLabel}>{t('sleep_label')}</Text>
          <View style={styles.sleepRow}>
            <TouchableOpacity
              style={styles.sleepStepperBtn}
              onPress={() => adjustSleep(-0.5)}
              activeOpacity={0.7}
            >
              <Ionicons name="remove" size={20} color={colors.primary} />
            </TouchableOpacity>

            <View style={styles.sleepInputWrap}>
              <TextInput
                style={styles.sleepInput}
                value={sleepInput}
                onChangeText={setSleepInput}
                keyboardType="decimal-pad"
                selectTextOnFocus
                returnKeyType="done"
                onBlur={() => setSleepInput(String(parseSleepHours()))}
              />
              <Text style={styles.sleepUnit}>시간</Text>
            </View>

            <TouchableOpacity
              style={styles.sleepStepperBtn}
              onPress={() => adjustSleep(0.5)}
              activeOpacity={0.7}
            >
              <Ionicons name="add" size={20} color={colors.primary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* 복약 여부 */}
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

      {/* 하단 등록 버튼 */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={[styles.saveBtn, isPending && styles.saveBtnDisabled]}
          onPress={handleSave}
          disabled={isPending}
          activeOpacity={0.85}
        >
          {isPending ? (
            <ActivityIndicator color={colors.textInverse} />
          ) : (
            <Text style={styles.saveBtnText}>
              {existingCheckin ? t('common:save') : t('write_today')}
            </Text>
          )}
        </TouchableOpacity>
      </View>
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
  headerBackBtn: { padding: sizes.spacing.xs },
  content: { padding: sizes.spacing.lg, gap: sizes.spacing.xl, paddingBottom: 120 },
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
  // 수면 시간 — 스테퍼 + 직접 입력
  sleepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: sizes.spacing.md,
  },
  sleepStepperBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primaryLight + '25',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.primaryLight,
  },
  sleepInputWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceSolid,
    borderWidth: 1,
    borderColor: colors.divider,
    borderRadius: sizes.radius.md,
    paddingHorizontal: sizes.spacing.md,
    height: 48,
    gap: sizes.spacing.xs,
  },
  sleepInput: {
    fontSize: sizes.font.xl,
    fontWeight: sizes.fontWeight.bold,
    color: colors.text,
    textAlign: 'center',
    minWidth: 50,
    padding: 0,
  },
  sleepUnit: {
    fontSize: sizes.font.md,
    color: colors.textSub,
  },
  // 복약 여부
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
  // 하단 등록 버튼
  bottomBar: {
    padding: sizes.spacing.lg,
    paddingBottom: sizes.spacing.xl,
    backgroundColor: colors.surfaceSolid,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
  },
  saveBtn: {
    height: sizes.buttonHeight.lg,
    backgroundColor: colors.primary,
    borderRadius: sizes.radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnText: {
    fontSize: sizes.font.md,
    fontWeight: sizes.fontWeight.bold,
    color: colors.textInverse,
  },
});
