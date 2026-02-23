import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Modal,
} from 'react-native';
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
import { useCheckinSummary } from '@/features/checkin/hooks/useCheckin';
import { useDailyNotes } from '@/features/checkin/hooks/useDailyNote';
import { useUnsavedChangesWarning } from '@/shared/hooks/useUnsavedChangesWarning';
import type { CareStackParamList as ScheduleStackParamList } from '@/navigation/CareNavigator';
import type { PrepNoteSections, DailyNote, DailyNoteType } from '@/shared/types/domain.types';

type Nav = StackNavigationProp<ScheduleStackParamList, 'PrepNoteForm'>;
type Route = RouteProp<ScheduleStackParamList, 'PrepNoteForm'>;

const formatDate = (iso: string) => {
  const d = new Date(iso);
  return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
};

const toDateStr = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

/** noteType → PrepNoteSections 키 매핑 */
const NOTE_TYPE_TO_SECTION: Partial<Record<DailyNoteType, keyof PrepNoteSections>> = {
  FEELING: 'moodChanges',
  SYMPTOM: 'newSymptoms',
  SIDE_EFFECT: 'sideEffects',
};

const NOTE_TYPE_ICON: Record<DailyNoteType, keyof typeof Ionicons.glyphMap> = {
  FEELING: 'heart-outline',
  SYMPTOM: 'medical-outline',
  QUESTION: 'help-circle-outline',
  SIDE_EFFECT: 'warning-outline',
  OTHER: 'create-outline',
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

  // 최근 30일 스레드 메모 (메모 선택용)
  const thirtyDaysAgoStr = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return toDateStr(d);
  }, []);
  const todayStr = useMemo(() => toDateStr(new Date()), []);
  const { data: recentDailyNotes = [] } = useDailyNotes(thirtyDaysAgoStr, todayStr);

  const [content, setContent] = useState('');
  const [sections, setSections] = useState<PrepNoteSections>(emptySections());
  const [showFreeMemo, setShowFreeMemo] = useState(false);
  const [questionDraft, setQuestionDraft] = useState('');
  const [presetPickerOpen, setPresetPickerOpen] = useState(false);
  const [presetSelected, setPresetSelected] = useState<Set<string>>(new Set());

  // 스레드 메모 선택 상태
  const [selectedNoteIds, setSelectedNoteIds] = useState<Set<string>>(new Set());
  const [showNoteSelector, setShowNoteSelector] = useState(false);

  // 섹션 펼침 상태 (내용 있으면 기본 펼침)
  const [expandedSections, setExpandedSections] = useState<Set<keyof PrepNoteSections>>(new Set());
  const toggleSection = useCallback((key: keyof PrepNoteSections) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  }, []);

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
      if (existingNote.content?.trim()) setShowFreeMemo(true);
    }
    setSelectedScheduleId(existingNote.scheduleId ?? undefined);
    if (existingNote.linkedNoteIds?.length) {
      setSelectedNoteIds(new Set(existingNote.linkedNoteIds));
    }
    // 내용 있는 섹션 자동 펼침
    const auto = new Set<keyof PrepNoteSections>();
    if (s?.moodChanges?.trim()) auto.add('moodChanges');
    if (s?.sideEffects?.trim()) auto.add('sideEffects');
    if (s?.sleepAppetite?.trim()) auto.add('sleepAppetite');
    if (s?.newSymptoms?.trim()) auto.add('newSymptoms');
    if ((s?.questions ?? []).length > 0) auto.add('questions');
    if (s?.selfHarmThoughts?.trim()) auto.add('selfHarmThoughts');
    if (auto.size > 0) setExpandedSections(auto);
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

  const toggleNoteSelection = useCallback(
    (note: DailyNote) => {
      setSelectedNoteIds((prev) => {
        const next = new Set(prev);
        if (next.has(note.id)) {
          // 선택 해제 — 섹션에서도 제거하지는 않음 (사용자가 직접 편집했을 수 있어서)
          next.delete(note.id);
        } else {
          next.add(note.id);
          // 섹션 자동입력
          const sectionKey = NOTE_TYPE_TO_SECTION[note.noteType];
          if (sectionKey === 'moodChanges' || sectionKey === 'newSymptoms' || sectionKey === 'sideEffects') {
            setSections((s) => {
              const current = (s[sectionKey] as string) ?? '';
              const appended = current.trim() ? `${current.trim()}\n· ${note.body}` : `· ${note.body}`;
              return { ...s, [sectionKey]: appended };
            });
          } else if (note.noteType === 'QUESTION') {
            setSections((s) => ({
              ...s,
              questions: [...(s.questions ?? []), note.body],
            }));
          }
        }
        return next;
      });
    },
    [],
  );

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
      selfHarmThoughts: expandedSections.has('selfHarmThoughts') ? (sections.selfHarmThoughts ?? '') : '',
    };

    if (!content.trim() && !hasAnySectionContent(cleanedSections)) {
      customAlert(t('common:required_input'), t('common:content_required'));
      return;
    }

    const linkedNoteIds = Array.from(selectedNoteIds);

    if (isEdit && noteId) {
      update(
        { id: noteId, data: { content: content.trim(), sections: cleanedSections, linkedNoteIds } },
        { onSuccess: () => markSavedAndExit() },
      );
    } else {
      create(
        { content: content.trim(), sections: cleanedSections, scheduleId: selectedScheduleId, linkedNoteIds },
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

        {/* 최근 스레드 메모에서 선택 */}
        {recentDailyNotes.length > 0 && (
          <View style={styles.field}>
            <TouchableOpacity
              style={styles.noteSelectorHeader}
              onPress={() => setShowNoteSelector((v) => !v)}
              activeOpacity={0.8}
            >
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>{t('prepnote:daily_notes_picker_title', { defaultValue: '최근 메모에서 선택' })}</Text>
                <Text style={styles.noteSelectorSub}>
                  {selectedNoteIds.size > 0
                    ? t('prepnote:daily_notes_selected', { count: selectedNoteIds.size, defaultValue: `${selectedNoteIds.size}개 선택됨` })
                    : t('prepnote:daily_notes_picker_hint', { defaultValue: '하루 메모를 선택하면 해당 섹션에 자동 입력됩니다' })}
                </Text>
              </View>
              <Ionicons name={showNoteSelector ? 'chevron-up' : 'chevron-down'} size={16} color={colors.textSub} />
            </TouchableOpacity>

            {showNoteSelector && (
              <View style={styles.notePickerList}>
                {recentDailyNotes.map((note) => {
                  const isSelected = selectedNoteIds.has(note.id);
                  const d = new Date(note.noteDate);
                  const dateLabel = `${d.getMonth() + 1}/${d.getDate()}`;
                  return (
                    <TouchableOpacity
                      key={note.id}
                      style={[styles.notePickerRow, isSelected && styles.notePickerRowSelected]}
                      onPress={() => toggleNoteSelection(note)}
                      activeOpacity={0.8}
                    >
                      <Ionicons
                        name={isSelected ? 'checkbox' : 'square-outline'}
                        size={20}
                        color={isSelected ? colors.primary : colors.textSub}
                      />
                      <Ionicons name={NOTE_TYPE_ICON[note.noteType]} size={15} color={colors.textSub} style={{ width: 22 }} />
                      <View style={{ flex: 1 }}>
                        <Text style={styles.notePickerBody} numberOfLines={2}>{note.body}</Text>
                      </View>
                      <Text style={styles.notePickerDate}>{dateLabel}</Text>
                    </TouchableOpacity>
                  );
                })}
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

        {/* 자동 인사이트 추천 카드 */}
        <InsightCard
          summary={checkinSummary ?? null}
          appendSection={(key, value) => {
            const current = sections[key] ?? '';
            const next = (typeof current === 'string'
              ? (current.trim() ? current.trim() + '\n· ' + value : '· ' + value)
              : current);
            updateSection(key, next as any);
            setExpandedSections((prev) => new Set([...prev, key as keyof PrepNoteSections]));
          }}
          appendQuestion={(q) => {
            addQuestion(q);
            setExpandedSections((prev) => new Set([...prev, 'questions' as keyof PrepNoteSections]));
          }}
          colors={colors}
          styles={styles}
          t={t}
        />

        {/* 섹션들 — collapsible */}
        <CollapsibleSection
          sectionKey="moodChanges"
          label={t('prepnote:section_mood_changes')}
          placeholder={t('prepnote:section_mood_changes_placeholder')}
          value={sections.moodChanges ?? ''}
          onChange={(v) => updateSection('moodChanges', v)}
          expanded={expandedSections.has('moodChanges')}
          onToggle={() => toggleSection('moodChanges')}
          styles={styles}
          colors={colors}
        />
        <CollapsibleSection
          sectionKey="sideEffects"
          label={t('prepnote:section_side_effects')}
          placeholder={t('prepnote:section_side_effects_placeholder')}
          value={sections.sideEffects ?? ''}
          onChange={(v) => updateSection('sideEffects', v)}
          expanded={expandedSections.has('sideEffects')}
          onToggle={() => toggleSection('sideEffects')}
          styles={styles}
          colors={colors}
        />
        <CollapsibleSection
          sectionKey="sleepAppetite"
          label={t('prepnote:section_sleep_appetite')}
          placeholder={t('prepnote:section_sleep_appetite_placeholder')}
          value={sections.sleepAppetite ?? ''}
          onChange={(v) => updateSection('sleepAppetite', v)}
          expanded={expandedSections.has('sleepAppetite')}
          onToggle={() => toggleSection('sleepAppetite')}
          styles={styles}
          colors={colors}
        />
        <CollapsibleSection
          sectionKey="newSymptoms"
          label={t('prepnote:section_new_symptoms')}
          placeholder={t('prepnote:section_new_symptoms_placeholder')}
          value={sections.newSymptoms ?? ''}
          onChange={(v) => updateSection('newSymptoms', v)}
          expanded={expandedSections.has('newSymptoms')}
          onToggle={() => toggleSection('newSymptoms')}
          styles={styles}
          colors={colors}
        />

        {/* 질문 — collapsible */}
        <View style={styles.field}>
          <TouchableOpacity
            style={styles.sectionHeader}
            onPress={() => toggleSection('questions')}
            activeOpacity={0.7}
          >
            <Text style={styles.label}>{t('prepnote:section_questions')}</Text>
            <View style={styles.sectionHeaderRight}>
              {(sections.questions ?? []).length > 0 && (
                <Text style={styles.sectionCount}>{(sections.questions ?? []).length}</Text>
              )}
              <Ionicons
                name={expandedSections.has('questions') ? 'chevron-up' : 'chevron-down'}
                size={16}
                color={colors.textSub}
              />
            </View>
          </TouchableOpacity>
          {expandedSections.has('questions') && (
            <>
              <TouchableOpacity onPress={() => setPresetPickerOpen(true)} hitSlop={8} style={{ alignSelf: 'flex-end' }}>
                <Text style={styles.linkBtn}>+ {t('prepnote:section_questions_pick_preset')}</Text>
              </TouchableOpacity>
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
            </>
          )}
        </View>

        {/* 자해/자살 사고 — 접이식 */}
        <View style={styles.selfHarmCard}>
          <TouchableOpacity
            style={styles.selfHarmHeader}
            onPress={() => toggleSection('selfHarmThoughts')}
            activeOpacity={0.7}
          >
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>{t('prepnote:section_self_harm')}</Text>
              <Text style={styles.selfHarmCaution}>{t('prepnote:section_self_harm_caution')}</Text>
            </View>
            <Ionicons
              name={expandedSections.has('selfHarmThoughts') ? 'chevron-up' : 'chevron-down'}
              size={16}
              color={colors.textSub}
            />
          </TouchableOpacity>
          {expandedSections.has('selfHarmThoughts') && (
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

        {/* 자유 메모 — collapsible */}
        <View style={styles.field}>
          <TouchableOpacity
            style={styles.sectionHeader}
            onPress={() => setShowFreeMemo((v) => !v)}
            activeOpacity={0.7}
          >
            <Text style={styles.label}>{t('prepnote:section_free_memo')}</Text>
            <Ionicons
              name={showFreeMemo ? 'chevron-up' : 'chevron-down'}
              size={16}
              color={colors.textSub}
            />
          </TouchableOpacity>
          {showFreeMemo && (
            <TextInput
              style={styles.textArea}
              placeholder={t('prepnote:section_free_memo_placeholder')}
              placeholderTextColor={colors.textDisabled}
              value={content}
              onChangeText={setContent}
              multiline
              textAlignVertical="top"
            />
          )}
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

interface CollapsibleSectionProps {
  sectionKey: keyof PrepNoteSections;
  label: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  expanded: boolean;
  onToggle: () => void;
  styles: ReturnType<typeof makeStyles>;
  colors: ReturnType<typeof useTheme>['colors'];
}

interface SectionFieldProps {
  label: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  styles: ReturnType<typeof makeStyles>;
  colors: ReturnType<typeof useTheme>['colors'];
}

interface InsightCardProps {
  summary: { averageEmotionScore: number | null; topTriggerTags: string[]; totalCheckins: number } | null;
  appendSection: (key: keyof PrepNoteSections, value: string) => void;
  appendQuestion: (q: string) => void;
  colors: ReturnType<typeof useTheme>['colors'];
  styles: ReturnType<typeof makeStyles>;
  t: ReturnType<typeof useTranslation>['t'];
}

const InsightCard: React.FC<InsightCardProps> = ({
  summary, appendSection, appendQuestion, colors, styles, t,
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

const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({
  label, placeholder, value, onChange, expanded, onToggle, styles, colors,
}) => (
  <View style={styles.field}>
    <TouchableOpacity style={styles.sectionHeader} onPress={onToggle} activeOpacity={0.7}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.sectionHeaderRight}>
        {value.trim().length > 0 && (
          <View style={styles.sectionDot} />
        )}
        <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={16} color={colors.textSub} />
      </View>
    </TouchableOpacity>
    {expanded && (
      <TextInput
        style={styles.textArea}
        placeholder={placeholder}
        placeholderTextColor={colors.textDisabled}
        value={value}
        onChangeText={onChange}
        multiline
        textAlignVertical="top"
      />
    )}
  </View>
);

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
    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    sectionHeaderRight: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: sizes.spacing.xs,
    },
    sectionDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: colors.primary,
    },
    sectionCount: {
      fontSize: sizes.font.xs,
      color: colors.primary,
      fontFamily: fontFamily.semibold,
    },
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
    // 스레드 메모 선택 피커
    noteSelectorHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.divider,
      borderRadius: sizes.radius.md,
      paddingHorizontal: sizes.spacing.md,
      paddingVertical: sizes.spacing.sm,
      gap: sizes.spacing.sm,
    },
    noteSelectorSub: {
      fontSize: sizes.font.xs,
      color: colors.textDisabled,
      marginTop: 2,
    },
    notePickerList: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.divider,
      borderRadius: sizes.radius.md,
      overflow: 'hidden',
    },
    notePickerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: sizes.spacing.md,
      paddingVertical: sizes.spacing.sm + 2,
      borderBottomWidth: 1,
      borderBottomColor: colors.divider,
      gap: sizes.spacing.xs,
    },
    notePickerRowSelected: {
      backgroundColor: colors.primaryMuted,
    },
    notePickerBody: {
      fontSize: sizes.font.sm,
      color: colors.text,
      lineHeight: 20,
    },
    notePickerDate: {
      fontSize: sizes.font.xs,
      color: colors.textDisabled,
      marginLeft: sizes.spacing.xs,
    },
  });
