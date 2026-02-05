import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,

  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { useTheme, sizes, fontFamily } from '@/shared/theme';
import { useCreateSchedule, useUpdateSchedule } from '@/features/schedule/hooks/useSchedule';
import type { ScheduleStackParamList } from '@/navigation/ScheduleNavigator';

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
  const { schedule, defaultDate } = route.params ?? {};

  const isEdit = Boolean(schedule);
  const initialDate = schedule ? new Date(schedule.scheduledAt) : buildInitialDate(defaultDate);

  const [hospitalName, setHospitalName] = useState(schedule?.hospitalName ?? '');
  const [doctorName, setDoctorName] = useState(schedule?.doctorName ?? '');
  const [memo, setMemo] = useState(schedule?.memo ?? '');
  const [selectedDate, setSelectedDate] = useState<Date>(initialDate);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  const { mutate: createSchedule, isPending: isCreating } = useCreateSchedule();
  const { mutate: updateSchedule, isPending: isUpdating } = useUpdateSchedule();
  const isPending = isCreating || isUpdating;

  const handleDateChange = (_: DateTimePickerEvent, date?: Date) => {
    if (Platform.OS === 'android') setShowDatePicker(false);
    if (date) {
      setSelectedDate((prev) => {
        const next = new Date(date);
        next.setHours(prev.getHours(), prev.getMinutes());
        return next;
      });
    }
  };

  const handleTimeChange = (_: DateTimePickerEvent, date?: Date) => {
    if (Platform.OS === 'android') setShowTimePicker(false);
    if (date) {
      setSelectedDate((prev) => {
        const next = new Date(prev);
        next.setHours(date.getHours(), date.getMinutes());
        return next;
      });
    }
  };

  const handleSave = () => {
    if (!hospitalName.trim()) {
      Alert.alert('필수 입력', '병원명을 입력해 주세요.');
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
        { onSuccess: () => navigation.goBack() }
      );
    } else {
      createSchedule(payload, { onSuccess: () => navigation.goBack() });
    }
  };

  const formatDateDisplay = (d: Date) =>
    `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일`;

  const formatTimeDisplay = (d: Date) =>
    `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={12}>
          <Text style={[styles.headerCancel, { color: colors.textSub }]}>취소</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text, fontFamily: fontFamily.bold }]}>{isEdit ? '일정 수정' : '일정 추가'}</Text>
        <TouchableOpacity onPress={handleSave} disabled={isPending} hitSlop={12}>
          <Text style={[styles.headerSave, { color: colors.primary, fontFamily: fontFamily.semibold }, isPending && styles.headerSaveDisabled]}>
            {isPending ? '저장 중…' : '저장'}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Field label="병원명" required colors={colors}>
          <TextInput
            style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.divider, color: colors.text }]}
            placeholder="병원 이름을 입력하세요"
            placeholderTextColor={colors.textDisabled}
            value={hospitalName}
            onChangeText={setHospitalName}
          />
        </Field>

        <Field label="날짜" colors={colors}>
          <TouchableOpacity
            style={[styles.pickerButton, { backgroundColor: colors.surface, borderColor: colors.divider }]}
            onPress={() => setShowDatePicker(true)}
          >
            <Text style={[styles.pickerText, { color: colors.text }]}>{formatDateDisplay(selectedDate)}</Text>
          </TouchableOpacity>
        </Field>

        <Field label="시간" colors={colors}>
          <TouchableOpacity
            style={[styles.pickerButton, { backgroundColor: colors.surface, borderColor: colors.divider }]}
            onPress={() => setShowTimePicker(true)}
          >
            <Text style={[styles.pickerText, { color: colors.text }]}>{formatTimeDisplay(selectedDate)}</Text>
          </TouchableOpacity>
        </Field>

        {showDatePicker && (
          <DateTimePicker
            value={selectedDate}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={handleDateChange}
            onTouchCancel={() => setShowDatePicker(false)}
          />
        )}
        {Platform.OS === 'ios' && showDatePicker && (
          <TouchableOpacity style={styles.pickerDone} onPress={() => setShowDatePicker(false)}>
            <Text style={[styles.pickerDoneText, { color: colors.primary, fontFamily: fontFamily.semibold }]}>완료</Text>
          </TouchableOpacity>
        )}

        {showTimePicker && (
          <DateTimePicker
            value={selectedDate}
            mode="time"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={handleTimeChange}
            onTouchCancel={() => setShowTimePicker(false)}
          />
        )}
        {Platform.OS === 'ios' && showTimePicker && (
          <TouchableOpacity style={styles.pickerDone} onPress={() => setShowTimePicker(false)}>
            <Text style={[styles.pickerDoneText, { color: colors.primary, fontFamily: fontFamily.semibold }]}>완료</Text>
          </TouchableOpacity>
        )}

        <Field label="담당 선생님 (선택)" colors={colors}>
          <TextInput
            style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.divider, color: colors.text }]}
            placeholder="담당 선생님 이름"
            placeholderTextColor={colors.textDisabled}
            value={doctorName}
            onChangeText={setDoctorName}
          />
        </Field>

        <Field label="메모 (선택)" colors={colors}>
          <TextInput
            style={[styles.input, styles.textArea, { backgroundColor: colors.surface, borderColor: colors.divider, color: colors.text }]}
            placeholder="메모를 입력하세요"
            placeholderTextColor={colors.textDisabled}
            value={memo}
            onChangeText={setMemo}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </Field>
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
  header: {
    height: sizes.headerHeight,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: sizes.spacing.lg,
  },
  headerTitle: {
    fontSize: sizes.font.lg,
  },
  headerCancel: {
    fontSize: sizes.font.md,
  },
  headerSave: {
    fontSize: sizes.font.md,
  },
  headerSaveDisabled: { opacity: 0.4 },
  content: { padding: sizes.spacing.lg, gap: sizes.spacing.lg },
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
});
