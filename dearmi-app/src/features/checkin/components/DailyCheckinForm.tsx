import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { customAlert } from '@/shared/components/CustomAlert';
import { useTheme, sizes, fontFamily } from '@/shared/theme';
import { EmotionSlider } from '@/shared/components/EmotionSlider';
import { TriggerTagSelector } from '@/features/checkin/components/TriggerTagSelector';
import { useCreateCheckin } from '@/features/checkin/hooks/useCheckin';
import { useAuthStore } from '@/features/auth/store/authStore';
import type { DailyCheckin } from '@/shared/types/domain.types';

const FREE_MEMO_LIMIT = 100;

interface DailyCheckinFormProps {
  existingCheckin?: DailyCheckin | null;
  /** 기록할 날짜 (YYYY-MM-DD). 생략 시 오늘 */
  targetDate?: string;
  onClose: () => void;
}

export const DailyCheckinForm: React.FC<DailyCheckinFormProps> = ({
  existingCheckin,
  targetDate,
  onClose,
}) => {
  const { colors } = useTheme();
  const { t } = useTranslation('checkin');
  const user = useAuthStore((s) => s.user);
  const isPremium = user?.plan === 'PREMIUM';
  const memoLimit = isPremium ? undefined : FREE_MEMO_LIMIT;

  const [emotionScore, setEmotionScore] = useState(existingCheckin?.emotionScore ?? 5);
  const [triggerTags, setTriggerTags] = useState<string[]>(existingCheckin?.triggerTags ?? []);
  const [memo, setMemo] = useState(existingCheckin?.memo ?? '');
  const [sleepInput, setSleepInput] = useState(String(existingCheckin?.sleepHours ?? 7));
  // 복약 여부는 복약 탭 완료율 기반 자동 — 폼에서 수동 설정 안 함

  const { mutate: saveCheckin, isPending } = useCreateCheckin();

  const parseSleepHours = (): number => {
    const parsed = parseFloat(sleepInput);
    if (isNaN(parsed) || parsed < 0) return 0;
    if (parsed > 24) return 24;
    return Math.round(parsed * 2) / 2; // 0.5 단위로 반올림
  };

  const handleSave = () => {
    if (memoLimit && memo.length > memoLimit) {
      customAlert(t('common:char_limit_exceeded'), t('common:char_limit_message', { limit: memoLimit }));
      return;
    }

    const sleepHours = parseSleepHours();

    saveCheckin(
      {
        emotionScore,
        triggerTags: triggerTags.length > 0 ? triggerTags : undefined,
        memo: memo.trim() || undefined,
        sleepHours,
        checkedAt: targetDate,
      },
      {
        onSuccess: () => onClose(),
        onError: () => customAlert(t('common:save_failed'), t('common:try_again_later')),
      }
    );
  };

  const adjustSleep = (delta: number) => {
    const current = parseSleepHours();
    const next = Math.max(0, Math.min(24, current + delta));
    setSleepInput(String(next));
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.divider }]}>
        <TouchableOpacity onPress={onClose} hitSlop={12} style={styles.headerBackBtn}>
          <Ionicons name="close" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>{t('form_title')}</Text>
        <View style={{ width: 48 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.field}>
          <Text style={[styles.fieldLabel, { color: colors.textSub }]}>{t('emotion_score')}</Text>
          <EmotionSlider value={emotionScore} onChange={setEmotionScore} />
        </View>

        <View style={styles.field}>
          <Text style={[styles.fieldLabel, { color: colors.textSub }]}>{t('trigger_label')}</Text>
          <TriggerTagSelector selectedTags={triggerTags} onChangeTags={setTriggerTags} />
        </View>

        <View style={styles.field}>
          <View style={styles.fieldLabelRow}>
            <Text style={[styles.fieldLabel, { color: colors.textSub }]}>{t('memo_label')}</Text>
            {memoLimit && (
              <Text style={[
                styles.charCount,
                memo.length > memoLimit
                  ? { color: colors.error, fontFamily: fontFamily.semibold }
                  : memo.length >= memoLimit * 0.9
                  ? { color: colors.warning }
                  : { color: colors.textDisabled },
              ]}>
                {memo.length}/{memoLimit}
              </Text>
            )}
          </View>
          <TextInput
            style={[
              styles.textArea,
              { backgroundColor: colors.surface, borderColor: colors.divider, color: colors.text },
              memo.length > (memoLimit ?? Infinity) && { borderColor: colors.error },
            ]}
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
          <Text style={[styles.fieldLabel, { color: colors.textSub }]}>{t('sleep_label')}</Text>
          <View style={styles.sleepRow}>
            <TouchableOpacity
              style={[styles.sleepStepperBtn, { backgroundColor: colors.primaryLight + '25', borderColor: colors.primaryLight }]}
              onPress={() => adjustSleep(-0.5)}
              activeOpacity={0.7}
            >
              <Ionicons name="remove" size={20} color={colors.primary} />
            </TouchableOpacity>

            <View style={[styles.sleepInputWrap, { backgroundColor: colors.surface, borderColor: colors.divider }]}>
              <TextInput
                style={[styles.sleepInput, { color: colors.text }]}
                value={sleepInput}
                onChangeText={setSleepInput}
                keyboardType="decimal-pad"
                selectTextOnFocus
                returnKeyType="done"
                onBlur={() => setSleepInput(String(parseSleepHours()))}
              />
              <Text style={[styles.sleepUnit, { color: colors.textSub }]}>시간</Text>
            </View>

            <TouchableOpacity
              style={[styles.sleepStepperBtn, { backgroundColor: colors.primaryLight + '25', borderColor: colors.primaryLight }]}
              onPress={() => adjustSleep(0.5)}
              activeOpacity={0.7}
            >
              <Ionicons name="add" size={20} color={colors.primary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* 복약 여부 — 복약 탭 완료율 기반으로 자동 설정 (수동 토글 제거) */}
      </ScrollView>

      {/* 하단 등록 버튼 */}
      <View style={[styles.bottomBar, { backgroundColor: colors.surface, borderTopColor: colors.divider }]}>
        <TouchableOpacity
          style={[styles.saveBtn, { backgroundColor: colors.primary }, isPending && styles.saveBtnDisabled]}
          onPress={handleSave}
          disabled={isPending}
          activeOpacity={0.85}
        >
          {isPending ? (
            <ActivityIndicator color={colors.textInverse} />
          ) : (
            <Text style={[styles.saveBtnText, { color: colors.textInverse }]}>
              {existingCheckin ? t('common:save') : t('write_today')}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    height: sizes.headerHeight,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: sizes.spacing.lg,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: sizes.font.lg,
    fontFamily: fontFamily.bold,
  },
  headerBackBtn: { padding: sizes.spacing.xs },
  content: { padding: sizes.spacing.lg, gap: sizes.spacing.xl, paddingBottom: 120 },
  field: { gap: sizes.spacing.sm },
  fieldLabelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  fieldLabel: {
    fontSize: sizes.font.sm,
    fontFamily: fontFamily.medium,
  },
  charCount: { fontSize: sizes.font.xs },
  charCountOver: { fontFamily: fontFamily.semibold },
  textArea: {
    borderWidth: 1,
    borderRadius: sizes.radius.md,
    paddingHorizontal: sizes.spacing.md,
    paddingTop: sizes.spacing.md,
    paddingBottom: sizes.spacing.md,
    fontSize: sizes.font.md,
    minHeight: 100,
    lineHeight: 22,
  },
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
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  sleepInputWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderRadius: sizes.radius.md,
    paddingHorizontal: sizes.spacing.md,
    height: 48,
    gap: sizes.spacing.xs,
  },
  sleepInput: {
    fontSize: sizes.font.xl,
    fontFamily: fontFamily.bold,
    textAlign: 'center',
    minWidth: 50,
    padding: 0,
  },
  sleepUnit: {
    fontSize: sizes.font.md,
  },
  // 하단 등록 버튼
  bottomBar: {
    padding: sizes.spacing.lg,
    paddingBottom: sizes.spacing.xl,
    borderTopWidth: 1,
  },
  saveBtn: {
    height: sizes.buttonHeight.lg,
    borderRadius: sizes.radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnText: {
    fontSize: sizes.font.md,
    fontFamily: fontFamily.bold,
  },
});
