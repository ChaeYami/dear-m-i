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
      Alert.alert('글자 수 초과', `무료 플랜은 ${memoLimit}자까지 입력할 수 있습니다.`);
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
        onError: () => Alert.alert('저장 실패', '잠시 후 다시 시도해 주세요.'),
      }
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose} hitSlop={12}>
          <Text style={styles.headerCancel}>취소</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>오늘의 기분</Text>
        <TouchableOpacity onPress={handleSave} disabled={isPending} hitSlop={12}>
          <Text style={[styles.headerSave, isPending && styles.headerSaveDisabled]}>
            {isPending ? '저장 중...' : '저장'}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* 감정 점수 */}
        <View style={styles.field}>
          <Text style={styles.fieldLabel}>감정 점수</Text>
          <EmotionSlider value={emotionScore} onChange={setEmotionScore} />
        </View>

        {/* 트리거 태그 */}
        <View style={styles.field}>
          <Text style={styles.fieldLabel}>오늘 기분에 영향을 준 것</Text>
          <TriggerTagSelector selectedTags={triggerTags} onChangeTags={setTriggerTags} />
        </View>

        {/* 메모 */}
        <View style={styles.field}>
          <View style={styles.fieldLabelRow}>
            <Text style={styles.fieldLabel}>메모 (선택)</Text>
            {memoLimit && (
              <Text style={[styles.charCount, memo.length > memoLimit && styles.charCountOver]}>
                {memo.length}/{memoLimit}
              </Text>
            )}
          </View>
          <TextInput
            style={[styles.textArea, memo.length > (memoLimit ?? Infinity) && styles.textAreaError]}
            placeholder="오늘 하루를 자유롭게 기록하세요"
            placeholderTextColor={colors.text.disabled}
            value={memo}
            onChangeText={setMemo}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>

        {/* 수면 시간 */}
        <View style={styles.field}>
          <Text style={styles.fieldLabel}>수면 시간</Text>
          <TouchableOpacity
            style={styles.sleepSelector}
            onPress={() => setShowSleepPicker((v) => !v)}
            activeOpacity={0.8}
          >
            <Text style={styles.sleepValue}>{sleepHours}시간</Text>
            <Text style={styles.dropdownArrow}>{showSleepPicker ? '▲' : '▼'}</Text>
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

        {/* 복약 여부 */}
        <View style={styles.medRow}>
          <Text style={styles.fieldLabel}>오늘 약 복용 여부</Text>
          <Switch
            value={tookMedication}
            onValueChange={setTookMedication}
            trackColor={{ false: colors.disabled, true: colors.primary + '60' }}
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
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    fontSize: sizes.font.lg,
    fontWeight: sizes.fontWeight.bold,
    color: colors.text.primary,
  },
  headerCancel: { fontSize: sizes.font.md, color: colors.text.secondary },
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
    color: colors.text.secondary,
  },
  charCount: { fontSize: sizes.font.xs, color: colors.text.disabled },
  charCountOver: { color: colors.error, fontWeight: sizes.fontWeight.semibold },
  textArea: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: sizes.radius.md,
    paddingHorizontal: sizes.spacing.md,
    paddingTop: sizes.spacing.md,
    paddingBottom: sizes.spacing.md,
    fontSize: sizes.font.md,
    color: colors.text.primary,
    minHeight: 100,
    lineHeight: 22,
  },
  textAreaError: { borderColor: colors.error },
  sleepSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: sizes.radius.md,
    paddingHorizontal: sizes.spacing.md,
    paddingVertical: sizes.spacing.md,
  },
  sleepValue: { fontSize: sizes.font.md, color: colors.text.primary },
  dropdownArrow: { fontSize: sizes.font.xs, color: colors.text.secondary },
  sleepGrid: {
    maxHeight: 44,
  },
  sleepChip: {
    paddingHorizontal: sizes.spacing.md,
    paddingVertical: sizes.spacing.sm,
    borderRadius: sizes.radius.full,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: sizes.spacing.xs,
  },
  sleepChipSelected: {
    backgroundColor: colors.primary + '15',
    borderColor: colors.primary,
  },
  sleepChipText: {
    fontSize: sizes.font.sm,
    color: colors.text.secondary,
  },
  sleepChipTextSelected: {
    color: colors.primary,
    fontWeight: sizes.fontWeight.semibold,
  },
  medRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderRadius: sizes.radius.md,
    padding: sizes.spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
});
