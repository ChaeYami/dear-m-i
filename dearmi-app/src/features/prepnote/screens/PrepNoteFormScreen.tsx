import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Modal,
  Switch,
  Dimensions,
} from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { useTranslation } from 'react-i18next';
import { customAlert } from '@/shared/components/CustomAlert';
import { useTheme, sizes, fontFamily } from '@/shared/theme';
import { ScreenHeader } from '@/shared/components/ScreenHeader';
import { softShadow } from '@/shared/theme/shadows';
import { useCreatePrepNote, useUpdatePrepNote, usePrepNotes } from '@/features/prepnote/hooks/usePrepNote';
import { useRecentSchedules } from '@/features/record/hooks/useRecord';
import { useCheckinSummary, useCheckinHistory } from '@/features/checkin/hooks/useCheckin';
import { useSideEffectsSince } from '@/features/sideeffect/hooks/useSideEffect';
import { useUnsavedChangesWarning } from '@/shared/hooks/useUnsavedChangesWarning';
import type { CareStackParamList as ScheduleStackParamList } from '@/navigation/CareNavigator';
import type { PrepNoteSections } from '@/shared/types/domain.types';

type Nav = StackNavigationProp<ScheduleStackParamList, 'PrepNoteForm'>;
type Route = RouteProp<ScheduleStackParamList, 'PrepNoteForm'>;

const formatDate = (iso: string) => {
  const d = new Date(iso);
  return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
};

const sevenDaysAgoIso = () => {
  const d = new Date();
  d.setDate(d.getDate() - 7);
  return d.toISOString();
};

const emptySections = (): PrepNoteSections => ({
  moodChanges: '',
  sideEffects: '',
  sleepAppetite: '',
  newSymptoms: '',
  questions: [],
  selfHarmThoughts: '',
});

export const PrepNoteFormScreen: React.FC = () => {
  const { colors } = useTheme();
  const navigation = useNavigation<Nav>();
  const { t } = useTranslation(['schedule', 'common', 'record', 'prepnote', 'checkin']);
  const params = useRoute<Route>().params;
  const noteId = params?.noteId;
  const initialScheduleId = params?.scheduleId;
  const isEdit = Boolean(noteId);

  const { data: allNotes = [] } = usePrepNotes();
  const existingNote = allNotes.find((n) => n.id === noteId);

  const { data: recentSchedules = [] } = useRecentSchedules('FUTURE');
  const top10 = recentSchedules.slice(0, 10);

  const { mutate: create, isPending: isCreating } = useCreatePrepNote();
  const { mutate: update, isPending: isUpdating } = useUpdatePrepNote();
  const isPending = isCreating || isUpdating;

  // 자동 주입용 데이터
  const { data: checkinSummary } = useCheckinSummary();
  const { data: recentSideEffects = [] } = useSideEffectsSince(sevenDaysAgoIso());

  // 미니 감정 차트용 — 최근 14일 체크인
  const chartRange = useMemo(() => {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - 13);
    const fmt = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    return { startDate: fmt(start), endDate: fmt(end) };
  }, []);
  const { data: chartHistory } = useCheckinHistory(chartRange.startDate, chartRange.endDate);

  const [content, setContent] = useState('');
  const [sections, setSections] = useState<PrepNoteSections>(emptySections());
  const [showSelfHarm, setShowSelfHarm] = useState(false);
  const [questionDraft, setQuestionDraft] = useState('');
  const [presetPickerOpen, setPresetPickerOpen] = useState(false);
  const [presetSelected, setPresetSelected] = useState<Set<string>>(new Set());

  const [selectedScheduleId, setSelectedScheduleId] = useState<string | undefined>(initialScheduleId);
  const [showSchedulePicker, setShowSchedulePicker] = useState(false);

  // hydrate from existing note
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => {
    if (!isEdit || !existingNote || hydrated) return;
    setContent(existingNote.content ?? '');
    const s = existingNote.sections;
    if (s) {
      setSections({
        moodChanges: s.moodChanges ?? '',
        sideEffects: s.sideEffects ?? '',
        sleepAppetite: s.sleepAppetite ?? '',
        newSymptoms: s.newSymptoms ?? '',
        questions: s.questions ?? [],
        selfHarmThoughts: s.selfHarmThoughts ?? '',
      });
      if (s.selfHarmThoughts && s.selfHarmThoughts.trim()) setShowSelfHarm(true);
    }
    setSelectedScheduleId(existingNote.scheduleId ?? undefined);
    setHydrated(true);
  }, [isEdit, existingNote, hydrated]);

  const updateSection = useCallback(<K extends keyof PrepNoteSections>(key: K, value: PrepNoteSections[K]) => {
    setSections((prev) => ({ ...prev, [key]: value }));
  }, []);

  const addQuestion = (text: string) => {
    const v = text.trim();
    if (!v) return;
    setSections((prev) => ({ ...prev, questions: [...(prev.questions ?? []), v] }));
  };

  const removeQuestion = (idx: number) => {
    setSections((prev) => ({ ...prev, questions: (prev.questions ?? []).filter((_, i) => i !== idx) }));
  };

  const togglePreset = (q: string) => {
    setPresetSelected((prev) => {
      const next = new Set(prev);
      next.has(q) ? next.delete(q) : next.add(q);
      return next;
    });
  };

  const confirmPreset = () => {
    const adds = Array.from(presetSelected).filter(
      (q) => !(sections.questions ?? []).includes(q),
    );
    if (adds.length > 0) {
      setSections((prev) => ({ ...prev, questions: [...(prev.questions ?? []), ...adds] }));
    }
    setPresetSelected(new Set());
    setPresetPickerOpen(false);
  };

  const isDirty =
    hydrated || !isEdit
      ? content.trim() !== (existingNote?.content ?? '') ||
        JSON.stringify(sections) !== JSON.stringify(existingNote?.sections ?? emptySections()) ||
        (!isEdit && selectedScheduleId !== initialScheduleId)
      : false;

  const { markSavedAndExit } = useUnsavedChangesWarning({ isDirty });

  const hasAnySectionContent = (s: PrepNoteSections) =>
    (s.moodChanges ?? '').trim() !== '' ||
    (s.sideEffects ?? '').trim() !== '' ||
    (s.sleepAppetite ?? '').trim() !== '' ||
    (s.newSymptoms ?? '').trim() !== '' ||
    (s.questions ?? []).length > 0 ||
    (s.selfHarmThoughts ?? '').trim() !== '';

  const handleSave = () => {
    const cleanedSections: PrepNoteSections = {
      ...sections,
      selfHarmThoughts: showSelfHarm ? (sections.selfHarmThoughts ?? '') : '',
    };

    if (!content.trim() && !hasAnySectionContent(cleanedSections)) {
      customAlert(t('common:required_input'), t('common:content_required'));
      return;
    }

    if (isEdit && noteId) {
      update(
        { id: noteId, data: { content: content.trim(), sections: cleanedSections } },
        { onSuccess: () => markSavedAndExit() },
      );
    } else {
      create(
        { content: content.trim(), sections: cleanedSections, scheduleId: selectedScheduleId },
        { onSuccess: () => markSavedAndExit() },
      );
    }
  };

  const presetQuestions = useMemo(
    () => (t('prepnote:preset_questions', { returnObjects: true }) as string[]) ?? [],
    [t],
  );

  const selectedSchedule = top10.find((s) => String(s.id) === selectedScheduleId);

  const styles = useMemo(() => makeStyles(colors), [colors]);

  return (
    <SafeAreaView style={styles.container}>
      <ScreenHeader
        variant="form"
        title={isEdit ? t('schedule:prep_note_edit') : t('schedule:prep_note_add')}
        onCancel={() => navigation.goBack()}
        onSave={handleSave}
        saveDisabled={isPending}
      />

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {/* 일정 연결 */}
        {!isEdit && (
          <View style={styles.field}>
            <Text style={styles.label}>{t('schedule:link_schedule')}</Text>
            <TouchableOpacity
              style={styles.scheduleSelector}
              onPress={() => setShowSchedulePicker((v) => !v)}
              activeOpacity={0.8}
            >
              <Text style={selectedSchedule ? styles.scheduleName : styles.schedulePlaceholder}>
                {selectedSchedule
                  ? `${selectedSchedule.hospitalName} · ${formatDate(selectedSchedule.scheduledAt)}`
                  : t('schedule:link_schedule_placeholder')}
              </Text>
              <Ionicons name={showSchedulePicker ? 'chevron-up' : 'chevron-down'} size={16} color={colors.textSub} />
            </TouchableOpacity>

            {showSchedulePicker && (
              <View style={styles.dropdown}>
                <TouchableOpacity
                  style={styles.dropdownItem}
                  onPress={() => {
                    setSelectedScheduleId(undefined);
                    setShowSchedulePicker(false);
                  }}
                >
                  <Text style={styles.dropdownItemText}>{t('schedule:link_none')}</Text>
                </TouchableOpacity>
                {top10.length === 0 && (
                  <View style={styles.dropdownItem}>
                    <Text style={[styles.dropdownItemText, { color: colors.textDisabled }]}>
                      {t('schedule:upcoming_empty')}
                    </Text>
                  </View>
                )}
                {top10.map((s) => (
                  <TouchableOpacity
                    key={s.id}
                    style={[
                      styles.dropdownItem,
                      String(s.id) === selectedScheduleId && styles.dropdownItemSelected,
                    ]}
                    onPress={() => {
                      setSelectedScheduleId(String(s.id));
                      setShowSchedulePicker(false);
                    }}
                  >
                    <Text
                      style={[
                        styles.dropdownItemText,
                        String(s.id) === selectedScheduleId && styles.dropdownItemTextSelected,
                      ]}
                    >
                      {s.hospitalName}
                    </Text>
                    <Text style={styles.dropdownItemDate}>{formatDate(s.scheduledAt)}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        )}

        {/* 체크인 자동 요약 카드 */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>{t('prepnote:checkin_summary_title')}</Text>
          {checkinSummary && checkinSummary.totalCheckins > 0 ? (
            <View style={styles.summaryRow}>
              {checkinSummary.averageEmotionScore != null && (
                <View style={styles.summaryChip}>
                  <Text style={styles.summaryChipText}>
                    {t('prepnote:checkin_summary_avg_emotion', { score: checkinSummary.averageEmotionScore.toFixed(1) })}
                  </Text>
                </View>
              )}
              {checkinSummary.averageSleepHours != null && (
                <View style={styles.summaryChip}>
                  <Text style={styles.summaryChipText}>
                    {t('prepnote:checkin_summary_avg_sleep', { hours: checkinSummary.averageSleepHours.toFixed(1) })}
                  </Text>
                </View>
              )}
              {checkinSummary.medicationRate != null && (
                <View style={styles.summaryChip}>
                  <Text style={styles.summaryChipText}>
                    {t('prepnote:checkin_summary_med_rate', { rate: Math.round(checkinSummary.medicationRate * 100) })}
                  </Text>
                </View>
              )}
              {checkinSummary.topTriggerTags?.slice(0, 3).map((tag) => (
                <View key={tag} style={[styles.summaryChip, { backgroundColor: colors.accentMuted }]}>
                  <Text style={[styles.summaryChipText, { color: colors.accent }]}>#{tag}</Text>
                </View>
              ))}
            </View>
          ) : (
            <Text style={styles.summaryEmpty}>{t('prepnote:checkin_summary_empty')}</Text>
          )}
        </View>

        {/* 미니 감정 차트 — 최근 14일 */}
        <MiniEmotionChart
          history={chartHistory?.content ?? []}
          colors={colors}
          styles={styles}
          t={t}
        />

        {/* 자동 인사이트 추천 카드 */}
        <InsightCard
          summary={checkinSummary ?? null}
          recentSideEffectsCount={recentSideEffects.length}
          recentSideEffectsSymptoms={recentSideEffects.slice(0, 3).map((s) => s.symptom)}
          appendSection={(key, value) => {
            const current = sections[key] ?? '';
            const next = (typeof current === 'string'
              ? (current.trim() ? current.trim() + '\n· ' + value : '· ' + value)
              : current);
            updateSection(key, next as any);
          }}
          appendQuestion={(q) => addQuestion(q)}
          colors={colors}
          styles={styles}
          t={t}
        />

        {/* 최근 부작용 */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>{t('prepnote:side_effects_recent_title')}</Text>
          {recentSideEffects.length === 0 ? (
            <Text style={styles.summaryEmpty}>{t('prepnote:side_effects_recent_empty')}</Text>
          ) : (
            <View style={{ gap: 4 }}>
              {recentSideEffects.slice(0, 3).map((s) => (
                <Text key={s.id} style={styles.summaryEmpty}>
                  · {s.symptom}{s.severity ? ` (${s.severity}/5)` : ''}
                </Text>
              ))}
              {recentSideEffects.length > 3 && (
                <Text style={[styles.summaryEmpty, { color: colors.primary }]}>
                  {t('prepnote:side_effects_recent_more', { count: recentSideEffects.length - 3 })}
                </Text>
              )}
            </View>
          )}
        </View>

        {/* 섹션들 */}
        <SectionField
          label={t('prepnote:section_mood_changes')}
          placeholder={t('prepnote:section_mood_changes_placeholder')}
          value={sections.moodChanges ?? ''}
          onChange={(v) => updateSection('moodChanges', v)}
          styles={styles}
          colors={colors}
        />
        <SectionField
          label={t('prepnote:section_side_effects')}
          placeholder={t('prepnote:section_side_effects_placeholder')}
          value={sections.sideEffects ?? ''}
          onChange={(v) => updateSection('sideEffects', v)}
          styles={styles}
          colors={colors}
        />
        <SectionField
          label={t('prepnote:section_sleep_appetite')}
          placeholder={t('prepnote:section_sleep_appetite_placeholder')}
          value={sections.sleepAppetite ?? ''}
          onChange={(v) => updateSection('sleepAppetite', v)}
          styles={styles}
          colors={colors}
        />
        <SectionField
          label={t('prepnote:section_new_symptoms')}
          placeholder={t('prepnote:section_new_symptoms_placeholder')}
          value={sections.newSymptoms ?? ''}
          onChange={(v) => updateSection('newSymptoms', v)}
          styles={styles}
          colors={colors}
        />

        {/* 질문 */}
        <View style={styles.field}>
          <View style={styles.questionsHeader}>
            <Text style={styles.label}>{t('prepnote:section_questions')}</Text>
            <TouchableOpacity onPress={() => setPresetPickerOpen(true)} hitSlop={8}>
              <Text style={styles.linkBtn}>+ {t('prepnote:section_questions_pick_preset')}</Text>
            </TouchableOpacity>
          </View>

          {(sections.questions ?? []).length === 0 ? (
            <Text style={[styles.summaryEmpty, { paddingHorizontal: 4 }]}>
              {t('prepnote:section_questions_empty')}
            </Text>
          ) : (
            <View style={{ gap: sizes.spacing.xs }}>
              {(sections.questions ?? []).map((q, i) => (
                <View key={i} style={styles.questionRow}>
                  <Text style={styles.questionText}>· {q}</Text>
                  <TouchableOpacity onPress={() => removeQuestion(i)} hitSlop={8}>
                    <Ionicons name="close-circle" size={18} color={colors.textDisabled} />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}

          <View style={styles.questionInputRow}>
            <TextInput
              style={styles.questionInput}
              placeholder={t('prepnote:section_questions_add')}
              placeholderTextColor={colors.textDisabled}
              value={questionDraft}
              onChangeText={setQuestionDraft}
              onSubmitEditing={() => {
                addQuestion(questionDraft);
                setQuestionDraft('');
              }}
              returnKeyType="done"
            />
            <TouchableOpacity
              style={styles.questionAddBtn}
              onPress={() => {
                addQuestion(questionDraft);
                setQuestionDraft('');
              }}
            >
              <Ionicons name="add" size={20} color={colors.primary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* 자해/자살 사고 — 별도 토글 */}
        <View style={styles.selfHarmCard}>
          <View style={styles.selfHarmHeader}>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>{t('prepnote:section_self_harm')}</Text>
              <Text style={styles.selfHarmCaution}>{t('prepnote:section_self_harm_caution')}</Text>
            </View>
            <Switch
              value={showSelfHarm}
              onValueChange={setShowSelfHarm}
              trackColor={{ false: colors.divider, true: colors.primaryLight }}
              thumbColor={showSelfHarm ? colors.primary : colors.textDisabled}
            />
          </View>
          {showSelfHarm && (
            <TextInput
              style={styles.textArea}
              placeholder={t('prepnote:section_self_harm_placeholder')}
              placeholderTextColor={colors.textDisabled}
              value={sections.selfHarmThoughts ?? ''}
              onChangeText={(v) => updateSection('selfHarmThoughts', v)}
              multiline
              textAlignVertical="top"
            />
          )}
        </View>

        {/* 자유 메모 (legacy content) */}
        <View style={styles.field}>
          <Text style={styles.label}>{t('prepnote:section_free_memo')}</Text>
          <TextInput
            style={styles.textArea}
            placeholder={t('prepnote:section_free_memo_placeholder')}
            placeholderTextColor={colors.textDisabled}
            value={content}
            onChangeText={setContent}
            multiline
            textAlignVertical="top"
          />
        </View>
      </ScrollView>

      {/* 프리셋 picker 모달 */}
      <Modal visible={presetPickerOpen} animationType="slide" transparent onRequestClose={() => setPresetPickerOpen(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('prepnote:preset_picker_title')}</Text>
              <TouchableOpacity onPress={() => setPresetPickerOpen(false)} hitSlop={8}>
                <Ionicons name="close" size={22} color={colors.textSub} />
              </TouchableOpacity>
            </View>
            <ScrollView style={{ maxHeight: 420 }}>
              {presetQuestions.map((q) => {
                const checked = presetSelected.has(q);
                const already = (sections.questions ?? []).includes(q);
                return (
                  <TouchableOpacity
                    key={q}
                    style={[styles.presetRow, already && { opacity: 0.4 }]}
                    onPress={() => !already && togglePreset(q)}
                    disabled={already}
                  >
                    <Ionicons
                      name={already ? 'checkmark-circle' : checked ? 'checkbox' : 'square-outline'}
                      size={20}
                      color={already || checked ? colors.primary : colors.textSub}
                    />
                    <Text style={styles.presetText}>{q}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
            <TouchableOpacity style={styles.modalDoneBtn} onPress={confirmPreset}>
              <Text style={styles.modalDoneText}>{t('prepnote:preset_picker_done')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

interface SectionFieldProps {
  label: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  styles: ReturnType<typeof makeStyles>;
  colors: ReturnType<typeof useTheme>['colors'];
}

interface MiniChartProps {
  history: Array<{ checkedAt: string; emotionScore: number }>;
  colors: ReturnType<typeof useTheme>['colors'];
  styles: ReturnType<typeof makeStyles>;
  t: ReturnType<typeof useTranslation>['t'];
}

const MiniEmotionChart: React.FC<MiniChartProps> = ({ history, colors, styles, t }) => {
  const sorted = useMemo(
    () => [...history].sort((a, b) => a.checkedAt.localeCompare(b.checkedAt)),
    [history],
  );
  if (sorted.length < 2) return null;

  const labels = sorted.map((c, i) => {
    if (i === 0 || i === sorted.length - 1 || i === Math.floor(sorted.length / 2)) {
      const [, mo, da] = c.checkedAt.split('-');
      return `${Number(mo)}/${Number(da)}`;
    }
    return '';
  });
  const scores = sorted.map((c) => c.emotionScore);
  const screenWidth = Dimensions.get('window').width - sizes.spacing.lg * 2 - sizes.spacing.md * 2;

  return (
    <View style={styles.summaryCard}>
      <Text style={styles.summaryTitle}>{t('checkin:emotion_graph_title') ?? 'Emotion'}</Text>
      <LineChart
        data={{ labels, datasets: [{ data: scores }] }}
        width={screenWidth}
        height={140}
        yAxisInterval={1}
        segments={3}
        fromZero={false}
        chartConfig={{
          backgroundGradientFrom: colors.surface,
          backgroundGradientTo: colors.surface,
          decimalPlaces: 0,
          color: (opacity = 1) => `${colors.primary}${Math.round(opacity * 255).toString(16).padStart(2, '0')}`,
          labelColor: () => colors.textSub,
          propsForDots: { r: '3' },
          propsForBackgroundLines: { stroke: colors.divider, strokeDasharray: '' },
        }}
        bezier
        withVerticalLines={false}
        style={{ marginLeft: -sizes.spacing.sm }}
      />
    </View>
  );
};

interface InsightCardProps {
  summary: { averageEmotionScore: number | null; topTriggerTags: string[]; totalCheckins: number } | null;
  recentSideEffectsCount: number;
  recentSideEffectsSymptoms: string[];
  appendSection: (key: keyof PrepNoteSections, value: string) => void;
  appendQuestion: (q: string) => void;
  colors: ReturnType<typeof useTheme>['colors'];
  styles: ReturnType<typeof makeStyles>;
  t: ReturnType<typeof useTranslation>['t'];
}

const InsightCard: React.FC<InsightCardProps> = ({
  summary, recentSideEffectsCount, recentSideEffectsSymptoms,
  appendSection, appendQuestion, colors, styles, t,
}) => {
  const insights: Array<{ label: string; onApply: () => void }> = [];

  if (summary) {
    const tags = summary.topTriggerTags?.slice(0, 2) ?? [];
    tags.forEach((tag) => {
      insights.push({
        label: t('prepnote:insight_frequent_tag', { tag, defaultValue: `자주 뜬 #${tag} — '새 증상'에 추가` }),
        onApply: () => appendSection('newSymptoms', `#${tag}`),
      });
    });

    if (summary.averageEmotionScore != null && summary.averageEmotionScore < 4) {
      insights.push({
        label: t('prepnote:insight_low_mood', {
          score: summary.averageEmotionScore.toFixed(1),
          defaultValue: `지난주 평균 ${summary.averageEmotionScore.toFixed(1)}점 — '기분 변화'에 추가`,
        }),
        onApply: () => appendSection('moodChanges', t('prepnote:insight_low_mood_text', {
          score: summary.averageEmotionScore!.toFixed(1),
          defaultValue: `지난주 평균 감정점수 ${summary.averageEmotionScore!.toFixed(1)}점`,
        })),
      });
    }
  }

  if (recentSideEffectsCount > 0) {
    insights.push({
      label: t('prepnote:insight_side_effects', {
        count: recentSideEffectsCount,
        defaultValue: `최근 부작용 ${recentSideEffectsCount}건 — '약 부작용'에 추가`,
      }),
      onApply: () => recentSideEffectsSymptoms.forEach((s) => appendSection('sideEffects', s)),
    });
  }

  if (insights.length === 0) return null;

  return (
    <View style={[styles.summaryCard, { borderLeftWidth: 3, borderLeftColor: colors.accent }]}>
      <Text style={styles.summaryTitle}>{t('prepnote:insight_card_title', { defaultValue: '추천' })}</Text>
      {insights.map((ins, i) => (
        <TouchableOpacity
          key={i}
          style={styles.insightRow}
          onPress={ins.onApply}
          activeOpacity={0.7}
        >
          <Text style={styles.insightLabel}>{ins.label}</Text>
          <Ionicons name="add-circle" size={18} color={colors.accent} />
        </TouchableOpacity>
      ))}
    </View>
  );
};

const SectionField: React.FC<SectionFieldProps> = ({ label, placeholder, value, onChange, styles, colors }) => (
  <View style={styles.field}>
    <Text style={styles.label}>{label}</Text>
    <TextInput
      style={styles.textArea}
      placeholder={placeholder}
      placeholderTextColor={colors.textDisabled}
      value={value}
      onChangeText={onChange}
      multiline
      textAlignVertical="top"
    />
  </View>
);

const makeStyles = (colors: ReturnType<typeof useTheme>['colors']) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    content: { padding: sizes.spacing.lg, gap: sizes.spacing.lg, paddingBottom: 80 },
    field: { gap: sizes.spacing.sm },
    label: {
      fontSize: sizes.font.sm,
      fontFamily: fontFamily.semibold,
      color: colors.textSub,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    scheduleSelector: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.divider,
      borderRadius: sizes.radius.md,
      paddingHorizontal: sizes.spacing.md,
      paddingVertical: sizes.spacing.md,
    },
    scheduleName: { fontSize: sizes.font.md, color: colors.text, flex: 1 },
    schedulePlaceholder: { fontSize: sizes.font.md, color: colors.textDisabled, flex: 1 },
    dropdown: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.divider,
      borderRadius: sizes.radius.md,
      overflow: 'hidden',
    },
    dropdownItem: {
      paddingHorizontal: sizes.spacing.md,
      paddingVertical: sizes.spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: colors.divider,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    dropdownItemSelected: { backgroundColor: colors.primary + '10' },
    dropdownItemText: { fontSize: sizes.font.md, color: colors.text },
    dropdownItemTextSelected: { color: colors.primary, fontFamily: fontFamily.semibold },
    dropdownItemDate: { fontSize: sizes.font.sm, color: colors.textSub },
    textArea: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.divider,
      borderRadius: sizes.radius.md,
      paddingHorizontal: sizes.spacing.md,
      paddingTop: sizes.spacing.md,
      paddingBottom: sizes.spacing.md,
      fontSize: sizes.font.md,
      color: colors.text,
      minHeight: 90,
      lineHeight: 22,
    },
    summaryCard: {
      backgroundColor: colors.surface,
      borderRadius: sizes.radius.lg,
      padding: sizes.spacing.md,
      gap: sizes.spacing.sm,
      ...softShadow(colors),
    },
    summaryTitle: {
      fontSize: sizes.font.sm,
      fontFamily: fontFamily.semibold,
      color: colors.textSub,
    },
    summaryRow: { flexDirection: 'row', flexWrap: 'wrap', gap: sizes.spacing.xs },
    summaryChip: {
      backgroundColor: colors.primaryMuted,
      paddingHorizontal: sizes.spacing.sm,
      paddingVertical: 4,
      borderRadius: sizes.radius.full,
    },
    summaryChipText: { fontSize: sizes.font.xs, color: colors.primary, fontFamily: fontFamily.medium },
    summaryEmpty: { fontSize: sizes.font.sm, color: colors.textDisabled },
    insightRow: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      paddingVertical: sizes.spacing.xs,
    },
    insightLabel: { flex: 1, fontSize: sizes.font.sm, color: colors.text },
    questionsHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    linkBtn: { fontSize: sizes.font.sm, color: colors.primary, fontFamily: fontFamily.semibold },
    questionRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: colors.surface,
      borderRadius: sizes.radius.md,
      paddingHorizontal: sizes.spacing.md,
      paddingVertical: sizes.spacing.sm,
    },
    questionText: { flex: 1, color: colors.text, fontSize: sizes.font.md },
    questionInputRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: sizes.spacing.xs,
      borderWidth: 1,
      borderColor: colors.divider,
      borderRadius: sizes.radius.md,
      paddingLeft: sizes.spacing.md,
      backgroundColor: colors.surface,
    },
    questionInput: { flex: 1, paddingVertical: sizes.spacing.sm + 2, color: colors.text, fontSize: sizes.font.md },
    questionAddBtn: { padding: sizes.spacing.sm },
    selfHarmCard: {
      backgroundColor: colors.surface,
      borderRadius: sizes.radius.lg,
      padding: sizes.spacing.md,
      gap: sizes.spacing.sm,
      borderWidth: 1,
      borderColor: colors.divider,
    },
    selfHarmHeader: { flexDirection: 'row', alignItems: 'center', gap: sizes.spacing.sm },
    selfHarmCaution: { fontSize: sizes.font.xs, color: colors.textDisabled, marginTop: 2 },
    modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
    modalSheet: {
      backgroundColor: colors.surface,
      borderTopLeftRadius: sizes.radius.xxl,
      borderTopRightRadius: sizes.radius.xxl,
      paddingHorizontal: sizes.spacing.lg,
      paddingTop: sizes.spacing.md,
      paddingBottom: sizes.spacing.xl,
      gap: sizes.spacing.md,
    },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    modalTitle: { fontSize: sizes.font.md, fontFamily: fontFamily.bold, color: colors.text },
    presetRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: sizes.spacing.sm,
      paddingVertical: sizes.spacing.sm,
    },
    presetText: { flex: 1, fontSize: sizes.font.md, color: colors.text },
    modalDoneBtn: {
      backgroundColor: colors.primary,
      paddingVertical: sizes.spacing.md,
      borderRadius: sizes.radius.full,
      alignItems: 'center',
    },
    modalDoneText: { color: colors.textInverse, fontSize: sizes.font.md, fontFamily: fontFamily.bold },
  });
