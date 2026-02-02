import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Platform,
  Alert,
} from 'react-native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { colors, sizes } from '@/constants';
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

    const payload = {
      hospitalName: hospitalName.trim(),
      doctorName: doctorName.trim() || undefined,
      scheduledAt: selectedDate.toISOString(),
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
    <SafeAreaView style={styles.container}>
      {/* 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={12}>
          <Text style={styles.headerCancel}>취소</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{isEdit ? '일정 수정' : '일정 추가'}</Text>
        <TouchableOpacity onPress={handleSave} disabled={isPending} hitSlop={12}>
          <Text style={[styles.headerSave, isPending && styles.headerSaveDisabled]}>
            {isPending ? '저장 중…' : '저장'}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {/* 병원명 */}
        <Field label="병원명" required>
          <TextInput
            style={styles.input}
            placeholder="병원 이름을 입력하세요"
            placeholderTextColor={colors.text.disabled}
            value={hospitalName}
            onChangeText={setHospitalName}
          />
        </Field>

        {/* 날짜 */}
        <Field label="날짜">
          <TouchableOpacity
            style={styles.pickerButton}
            onPress={() => setShowDatePicker(true)}
          >
            <Text style={styles.pickerText}>{formatDateDisplay(selectedDate)}</Text>
          </TouchableOpacity>
        </Field>

        {/* 시간 */}
        <Field label="시간">
          <TouchableOpacity
            style={styles.pickerButton}
            onPress={() => setShowTimePicker(true)}
          >
            <Text style={styles.pickerText}>{formatTimeDisplay(selectedDate)}</Text>
          </TouchableOpacity>
        </Field>

        {/* DateTimePicker (iOS: inline / Android: modal) */}
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
            <Text style={styles.pickerDoneText}>완료</Text>
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
            <Text style={styles.pickerDoneText}>완료</Text>
          </TouchableOpacity>
        )}

        {/* 담당의 (선택) */}
        <Field label="담당 선생님 (선택)">
          <TextInput
            style={styles.input}
            placeholder="담당 선생님 이름"
            placeholderTextColor={colors.text.disabled}
            value={doctorName}
            onChangeText={setDoctorName}
          />
        </Field>

        {/* 메모 */}
        <Field label="메모 (선택)">
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="메모를 입력하세요"
            placeholderTextColor={colors.text.disabled}
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

const Field: React.FC<{ label: string; required?: boolean; children: React.ReactNode }> = ({
  label,
  required,
  children,
}) => (
  <View style={styles.field}>
    <Text style={styles.fieldLabel}>
      {label}
      {required && <Text style={styles.required}> *</Text>}
    </Text>
    {children}
  </View>
);

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
  headerCancel: {
    fontSize: sizes.font.md,
    color: colors.text.secondary,
  },
  headerSave: {
    fontSize: sizes.font.md,
    fontWeight: sizes.fontWeight.semibold,
    color: colors.primary,
  },
  headerSaveDisabled: { opacity: 0.4 },
  content: { padding: sizes.spacing.lg, gap: sizes.spacing.lg },
  field: { gap: sizes.spacing.xs },
  fieldLabel: {
    fontSize: sizes.font.sm,
    fontWeight: sizes.fontWeight.medium,
    color: colors.text.secondary,
  },
  required: { color: colors.error },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: sizes.radius.md,
    paddingHorizontal: sizes.spacing.md,
    paddingVertical: sizes.spacing.md,
    fontSize: sizes.font.md,
    color: colors.text.primary,
  },
  textArea: {
    height: 100,
    paddingTop: sizes.spacing.md,
  },
  pickerButton: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: sizes.radius.md,
    paddingHorizontal: sizes.spacing.md,
    paddingVertical: sizes.spacing.md,
  },
  pickerText: {
    fontSize: sizes.font.md,
    color: colors.text.primary,
  },
  pickerDone: {
    alignItems: 'flex-end',
    paddingHorizontal: sizes.spacing.lg,
    paddingVertical: sizes.spacing.sm,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  pickerDoneText: {
    fontSize: sizes.font.md,
    fontWeight: sizes.fontWeight.semibold,
    color: colors.primary,
  },
});
