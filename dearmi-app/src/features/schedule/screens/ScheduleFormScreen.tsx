import React, { useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { DatePickerModal } from '@/features/schedule/components/DatePickerModal';
import { TimePickerModal } from '@/shared/components/TimePickerModal';
import type { StackNavigationProp } from '@react-navigation/stack';
import { customAlert } from '@/shared/components/CustomAlert';
import { useTheme, sizes, fontFamily } from '@/shared/theme';
import { ScreenHeader } from '@/shared/components/ScreenHeader';
import { GlassCard } from '@/shared/components/GlassCard';
import { SectionTitle } from '@/shared/components/SectionTitle';
import { useCreateSchedule, useUpdateSchedule, useAllSchedules } from '@/features/schedule/hooks/useSchedule';
import { useUnsavedChangesWarning } from '@/shared/hooks/useUnsavedChangesWarning';
import type { CareStackParamList as ScheduleStackParamList } from '@/navigation/CareNavigator';

type Nav = StackNavigationProp<ScheduleStackParamList, 'ScheduleForm'>;
type Route = RouteProp<ScheduleStackParamList, 'ScheduleForm'>;

const buildInitialDate = (defaultDate?: string): Date => {
  if (defaultDate) {
    const d = new Date(defaultDate);
    d.setHours(10, 0, 0, 0);
    return d;
  }
  const d = new Date();
  d.setHours(10, 0, 0, 0);
  return d;
};

export const ScheduleFormScreen: React.FC = () => {
  const { colors } = useTheme();
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { schedule, defaultDate, defaultHospitalName } = route.params ?? {};

  const isEdit = Boolean(schedule);
  const initialDate = schedule ? new Date(schedule.scheduledAt) : buildInitialDate(defaultDate);

  const [hospitalName, setHospitalName] = useState(schedule?.hospitalName ?? defaultHospitalName ?? '');
  const [doctorName, setDoctorName] = useState(schedule?.doctorName ?? '');
  const [memo, setMemo] = useState(schedule?.memo ?? '');
  const [selectedDate, setSelectedDate] = useState<Date>(initialDate);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [hospitalFocused, setHospitalFocused] = useState(false);

  const blurTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { mutate: createSchedule, isPending: isCreating } = useCreateSchedule();
  const { mutate: updateSchedule, isPending: isUpdating } = useUpdateSchedule();
  const isPending = isCreating || isUpdating;

  // 자동완성용: 기존 일정에서 병원명 목록 추출
  const { data: allSchedules = [] } = useAllSchedules();
  const knownHospitals = useMemo(() => {
    const names = allSchedules
      .map((s) => s.hospitalName)
      .filter((n): n is string => Boolean(n));
    return [...new Set(names)];
  }, [allSchedules]);

  const suggestions = useMemo(() => {
    if (!hospitalFocused || !hospitalName.trim()) return [];
    const q = hospitalName.trim().toLowerCase();
    return knownHospitals.filter(
      (n) => n.toLowerCase().includes(q) && n.toLowerCase() !== hospitalName.toLowerCase()
    );
  }, [hospitalFocused, hospitalName, knownHospitals]);

  const handleHospitalBlur = () => {
    blurTimer.current = setTimeout(() => setHospitalFocused(false), 150);
  };

  const handleSuggestionPress = (name: string) => {
    if (blurTimer.current) clearTimeout(blurTimer.current);
    setHospitalName(name);
    setHospitalFocused(false);
  };

  // 변경사항 추적 → 이탈 경고
  const isDirty =
    hospitalName.trim() !== (schedule?.hospitalName ?? '') ||
    doctorName.trim() !== (schedule?.doctorName ?? '') ||
    memo.trim() !== (schedule?.memo ?? '') ||
    selectedDate.getTime() !== initialDate.getTime();

  const { markSavedAndExit } = useUnsavedChangesWarning({ isDirty });

  const handleSave = () => {
    if (!hospitalName.trim()) {
      customAlert('필수 입력', '병원명을 입력해 주세요.');
      return;
    }

    // 로컬 시간 그대로 전송 (toISOString은 UTC 변환되므로 사용 금지)
    const y = selectedDate.getFullYear();
    const mo = String(selectedDate.getMonth() + 1).padStart(2, '0');
    const da = String(selectedDate.getDate()).padStart(2, '0');
    const h = String(selectedDate.getHours()).padStart(2, '0');
    const m = String(selectedDate.getMinutes()).padStart(2, '0');
    const localIso = `${y}-${mo}-${da}T${h}:${m}:00`;

    const payload = {
      hospitalName: hospitalName.trim(),
      doctorName: doctorName.trim() || undefined,
      scheduledAt: localIso,
      memo: memo.trim() || undefined,
    };

    if (isEdit && schedule) {
      updateSchedule(
        { id: schedule.id, data: payload },
        { onSuccess: () => markSavedAndExit() }
      );
    } else {
      createSchedule(payload, { onSuccess: () => markSavedAndExit() });
    }
  };

  const formatDateDisplay = (d: Date) =>
    `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일`;

  const formatTimeDisplay = (d: Date) =>
    `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScreenHeader
        variant="form"
        title={isEdit ? '일정 수정' : '일정 추가'}
        onCancel={() => navigation.goBack()}
        onSave={handleSave}
        saveDisabled={isPending}
      />

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {/* 병원 정보 섹션 */}
        <GlassCard intensity={40} style={styles.sectionCard}>
          <SectionTitle size="sm">병원 정보</SectionTitle>
          <View style={styles.sectionFields}>
            <Field label="병원명" required colors={colors}>
              {/* 자동완성 래퍼 */}
              <View style={styles.autocompleteWrap}>
                <TextInput
                  style={[styles.input, { backgroundColor: 'transparent', borderColor: colors.divider, color: colors.text }]}
                  placeholder="병원 이름을 입력하세요"
                  placeholderTextColor={colors.textDisabled}
                  value={hospitalName}
                  onChangeText={setHospitalName}
                  onFocus={() => setHospitalFocused(true)}
                  onBlur={handleHospitalBlur}
                />
                {suggestions.length > 0 && (
                  <View style={[styles.suggestionList, { backgroundColor: colors.surface, borderColor: colors.divider }]}>
                    {suggestions.map((name, idx) => (
                      <TouchableOpacity
                        key={name}
                        style={[
                          styles.suggestionItem,
                          idx < suggestions.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.divider },
                        ]}
                        onPress={() => handleSuggestionPress(name)}
                        activeOpacity={0.7}
                      >
                        <Text style={[styles.suggestionText, { color: colors.text, fontFamily: fontFamily.regular }]}>
                          {name}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
            </Field>

            <Field label="담당 선생님 (선택)" colors={colors}>
              <TextInput
                style={[styles.input, { backgroundColor: 'transparent', borderColor: colors.divider, color: colors.text }]}
                placeholder="담당 선생님 이름"
                placeholderTextColor={colors.textDisabled}
                value={doctorName}
                onChangeText={setDoctorName}
              />
            </Field>
          </View>
        </GlassCard>

        {/* 일정 섹션 */}
        <GlassCard intensity={40} style={styles.sectionCard}>
          <SectionTitle size="sm">일정</SectionTitle>
          <View style={styles.sectionFields}>
            <Field label="날짜" colors={colors}>
              <TouchableOpacity
                style={[styles.pickerButton, { backgroundColor: 'transparent', borderColor: colors.divider }]}
                onPress={() => setShowDatePicker(true)}
              >
                <Text style={[styles.pickerText, { color: colors.text }]}>{formatDateDisplay(selectedDate)}</Text>
              </TouchableOpacity>
            </Field>

            <Field label="시간" colors={colors}>
              <TouchableOpacity
                style={[styles.pickerButton, { backgroundColor: 'transparent', borderColor: colors.divider }]}
                onPress={() => setShowTimePicker(true)}
              >
                <Text style={[styles.pickerText, { color: colors.text }]}>{formatTimeDisplay(selectedDate)}</Text>
              </TouchableOpacity>
            </Field>
          </View>
        </GlassCard>

        <DatePickerModal
          visible={showDatePicker}
          initialDate={selectedDate.toISOString().split('T')[0]}
          onConfirm={(dateStr) => {
            setShowDatePicker(false);
            const [y, m, d] = dateStr.split('-').map(Number);
            setSelectedDate((prev) => {
              const next = new Date(prev);
              next.setFullYear(y, m - 1, d);
              return next;
            });
          }}
          onClose={() => setShowDatePicker(false)}
        />

        <TimePickerModal
          visible={showTimePicker}
          initialHour={selectedDate.getHours()}
          initialMinute={selectedDate.getMinutes()}
          onConfirm={(h, m) => {
            setShowTimePicker(false);
            setSelectedDate((prev) => {
              const next = new Date(prev);
              next.setHours(h, m);
              return next;
            });
          }}
          onClose={() => setShowTimePicker(false)}
        />

        {/* 메모 섹션 */}
        <GlassCard intensity={40} style={styles.sectionCard}>
          <SectionTitle size="sm">메모</SectionTitle>
          <View style={styles.sectionFields}>
            <Field label="메모 (선택)" colors={colors}>
              <TextInput
                style={[styles.input, styles.textArea, { backgroundColor: 'transparent', borderColor: colors.divider, color: colors.text }]}
                placeholder="메모를 입력하세요"
                placeholderTextColor={colors.textDisabled}
                value={memo}
                onChangeText={setMemo}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </Field>
          </View>
        </GlassCard>
      </ScrollView>
    </SafeAreaView>
  );
};

const Field: React.FC<{ label: string; required?: boolean; children: React.ReactNode; colors: any }> = ({
  label,
  required,
  children,
  colors,
}) => (
  <View style={styles.field}>
    <Text style={[styles.fieldLabel, { color: colors.textSub, fontFamily: fontFamily.medium }]}>
      {label}
      {required && <Text style={{ color: colors.error }}> *</Text>}
    </Text>
    {children}
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: sizes.spacing.lg, gap: sizes.spacing.md },
  sectionCard: {
    borderRadius: sizes.radius.xl,
  },
  sectionFields: {
    gap: sizes.spacing.sm,
    marginTop: sizes.spacing.sm,
  },
  field: { gap: sizes.spacing.xs },
  fieldLabel: {
    fontSize: sizes.font.sm,
  },
  input: {
    borderWidth: 1,
    borderRadius: sizes.radius.md,
    paddingHorizontal: sizes.spacing.md,
    paddingVertical: sizes.spacing.md,
    fontSize: sizes.font.md,
  },
  textArea: {
    height: 100,
    paddingTop: sizes.spacing.md,
  },
  pickerButton: {
    borderWidth: 1,
    borderRadius: sizes.radius.md,
    paddingHorizontal: sizes.spacing.md,
    paddingVertical: sizes.spacing.md,
  },
  pickerText: {
    fontSize: sizes.font.md,
  },
  pickerDone: {
    alignItems: 'flex-end',
    paddingHorizontal: sizes.spacing.lg,
    paddingVertical: sizes.spacing.sm,
  },
  pickerDoneText: {
    fontSize: sizes.font.md,
  },
  // 자동완성
  autocompleteWrap: {
    zIndex: 10,
  },
  suggestionList: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    borderWidth: 1,
    borderRadius: sizes.radius.md,
    marginTop: 2,
    zIndex: 10,
    elevation: 4,
    overflow: 'hidden',
  },
  suggestionItem: {
    paddingHorizontal: sizes.spacing.md,
    paddingVertical: sizes.spacing.md,
  },
  suggestionText: {
    fontSize: sizes.font.md,
  },
});
