import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { customAlert } from '@/shared/components/CustomAlert';
import { useTheme, sizes, fontFamily } from '@/shared/theme';
import { ScreenHeader } from '@/shared/components/ScreenHeader';
import { useCreatePrepNote, useUpdatePrepNote, usePrepNotes } from '@/features/prepnote/hooks/usePrepNote';
import { useRecentSchedules } from '@/features/record/hooks/useRecord';
import { useUnsavedChangesWarning } from '@/shared/hooks/useUnsavedChangesWarning';
import type { CareStackParamList as ScheduleStackParamList } from '@/navigation/CareNavigator';

type Nav = StackNavigationProp<ScheduleStackParamList, 'PrepNoteForm'>;
type Route = RouteProp<ScheduleStackParamList, 'PrepNoteForm'>;

const formatDate = (iso: string) => {
  const d = new Date(iso);
  return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
};

export const PrepNoteFormScreen: React.FC = () => {
  const { colors } = useTheme();
  const navigation = useNavigation<Nav>();
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

  const [content, setContent] = useState('');
  const [selectedScheduleId, setSelectedScheduleId] = useState<string | undefined>(
    initialScheduleId
  );
  const [showSchedulePicker, setShowSchedulePicker] = useState(false);

  useEffect(() => {
    if (existingNote) {
      setContent(existingNote.content);
      setSelectedScheduleId(existingNote.scheduleId ?? undefined);
    }
  }, [existingNote]);

  // 변경사항 추적 → 이탈 경고
  const isDirty =
    content.trim() !== (existingNote?.content ?? '') ||
    (!isEdit && selectedScheduleId !== initialScheduleId);

  const { markSavedAndExit } = useUnsavedChangesWarning({ isDirty });

  const handleSave = () => {
    if (!content.trim()) {
      customAlert('필수 입력', '내용을 입력해 주세요.');
      return;
    }

    if (isEdit && noteId) {
      update(
        { id: noteId, data: { content: content.trim() } },
        { onSuccess: () => markSavedAndExit() }
      );
    } else {
      create(
        { content: content.trim(), scheduleId: selectedScheduleId },
        { onSuccess: () => markSavedAndExit() }
      );
    }
  };

  const selectedSchedule = top10.find((s) => String(s.id) === selectedScheduleId);

  const styles = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    content: { padding: sizes.spacing.lg, gap: sizes.spacing.lg, paddingBottom: 40 },
    field: { gap: sizes.spacing.sm },
    label: {
      fontSize: sizes.font.sm,
      fontFamily: fontFamily.semibold,
      color: colors.textSub,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    required: { color: colors.error, textTransform: 'none' },
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
    dropdownArrow: { fontSize: sizes.font.xs, color: colors.textSub },
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
      minHeight: 180,
      lineHeight: 22,
    },
  }), [colors]);

  return (
    <SafeAreaView style={styles.container}>
      <ScreenHeader
        variant="form"
        title={isEdit ? '메모 수정' : '준비 메모 작성'}
        onCancel={() => navigation.goBack()}
        onSave={handleSave}
        saveDisabled={isPending}
      />

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {/* 일정 연결 (수정 모드에서는 비활성) */}
        {!isEdit && (
          <View style={styles.field}>
            <Text style={styles.label}>연결 일정 (선택)</Text>
            <TouchableOpacity
              style={styles.scheduleSelector}
              onPress={() => setShowSchedulePicker((v) => !v)}
              activeOpacity={0.8}
            >
              <Text style={selectedSchedule ? styles.scheduleName : styles.schedulePlaceholder}>
                {selectedSchedule
                  ? `${selectedSchedule.hospitalName} · ${formatDate(selectedSchedule.scheduledAt)}`
                  : '일정 선택 (선택 사항)'}
              </Text>
              <Text style={styles.dropdownArrow}><Ionicons name={showSchedulePicker ? 'chevron-up' : 'chevron-down'} size={16} color={colors.textSub} /></Text>
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
                  <Text style={styles.dropdownItemText}>선택 안 함</Text>
                </TouchableOpacity>
                {top10.length === 0 && (
                  <View style={styles.dropdownItem}>
                    <Text style={[styles.dropdownItemText, { color: colors.textDisabled }]}>다가오는 일정이 없습니다</Text>
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

        {/* 내용 */}
        <View style={styles.field}>
          <Text style={styles.label}>
            내용 <Text style={styles.required}>*</Text>
          </Text>
          <TextInput
            style={styles.textArea}
            placeholder="진료 전 궁금한 점, 증상, 질문 등을 자유롭게 적어 두세요."
            placeholderTextColor={colors.textDisabled}
            value={content}
            onChangeText={setContent}
            multiline
            numberOfLines={8}
            textAlignVertical="top"
            autoFocus
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};
