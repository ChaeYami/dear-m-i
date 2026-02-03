import React, { useState, useEffect } from 'react';
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
  Switch,
} from 'react-native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { colors, sizes } from '@/constants';
import { useCreateMedicationSchedule } from '@/features/medication/hooks/useMedication';
import { useMedicationDetail } from '@/features/prescription/hooks/usePrescription';
import type { MyPageStackParamList } from '@/navigation/MyPageNavigator';
import type { TimeSlotType } from '@/shared/types/domain.types';

type Nav = StackNavigationProp<MyPageStackParamList, 'MedicationForm'>;
type Route = RouteProp<MyPageStackParamList, 'MedicationForm'>;

const TIME_SLOTS: Array<{ key: TimeSlotType; label: string; defaultTime: string }> = [
  { key: 'MORNING', label: '아침', defaultTime: '08:00' },
  { key: 'AFTERNOON', label: '점심', defaultTime: '12:00' },
  { key: 'EVENING', label: '저녁', defaultTime: '18:00' },
  { key: 'BEDTIME', label: '취침 전', defaultTime: '22:00' },
];

const toLocalDateStr = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

const toTimeStr = (d: Date) =>
  `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:00`;

const addDays = (d: Date, n: number) => {
  const result = new Date(d);
  result.setDate(result.getDate() + n);
  return result;
};

export const MedicationFormScreen: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const { prescriptionMedicationId } = useRoute<Route>().params ?? {};

  // pre-fill (prescriptionMedicationId 있을 때만)
  const { data: prefill } = useMedicationDetail(
    prescriptionMedicationId ? Number(prescriptionMedicationId) : 0
  );

  const { mutate: create, isPending } = useCreateMedicationSchedule();

  const [drugName, setDrugName] = useState('');
  const [dosage, setDosage] = useState('');
  const [durationDays, setDurationDays] = useState('');

  const [activeSlots, setActiveSlots] = useState<Record<TimeSlotType, boolean>>({
    MORNING: true, AFTERNOON: false, EVENING: false, BEDTIME: false,
  });

  // 각 시간대별 Date 상태 (피커용)
  const makeDefaultDate = (timeStr: string) => {
    const [h, m] = timeStr.split(':').map(Number);
    const d = new Date();
    d.setHours(h, m, 0, 0);
    return d;
  };
  const [slotTimes, setSlotTimes] = useState<Record<TimeSlotType, Date>>({
    MORNING: makeDefaultDate('08:00'),
    AFTERNOON: makeDefaultDate('12:00'),
    EVENING: makeDefaultDate('18:00'),
    BEDTIME: makeDefaultDate('22:00'),
  });
  const [showTimePicker, setShowTimePicker] = useState<TimeSlotType | null>(null);

  const [startDate, setStartDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  // pre-fill 적용
  useEffect(() => {
    if (prefill) {
      if (prefill.medicationName) setDrugName(prefill.medicationName);
      if (prefill.dosage) setDosage(prefill.dosage);
      if (prefill.durationDays) setDurationDays(String(prefill.durationDays));
    }
  }, [prefill]);

  const endDate = durationDays && !isNaN(Number(durationDays))
    ? addDays(startDate, Number(durationDays) - 1)
    : null;

  const handleDateChange = (_: DateTimePickerEvent, date?: Date) => {
    if (Platform.OS === 'android') setShowDatePicker(false);
    if (date) setStartDate(date);
  };

  const handleTimeChange = (slot: TimeSlotType) => (_: DateTimePickerEvent, date?: Date) => {
    if (Platform.OS === 'android') setShowTimePicker(null);
    if (date) setSlotTimes((prev) => ({ ...prev, [slot]: date }));
  };

  const toggleSlot = (slot: TimeSlotType) =>
    setActiveSlots((prev) => ({ ...prev, [slot]: !prev[slot] }));

  const handleSave = () => {
    if (!drugName.trim()) {
      Alert.alert('필수 입력', '약품명을 입력해 주세요.');
      return;
    }
    if (!Object.values(activeSlots).some(Boolean)) {
      Alert.alert('시간대 선택', '복약 시간대를 하나 이상 선택해 주세요.');
      return;
    }

    create(
      {
        prescriptionMedicationId: prescriptionMedicationId
          ? String(prescriptionMedicationId)
          : undefined,
        drugName: drugName.trim(),
        dosage: dosage.trim() || undefined,
        startDate: toLocalDateStr(startDate),
        endDate: endDate ? toLocalDateStr(endDate) : undefined,
        morning: activeSlots.MORNING,
        afternoon: activeSlots.AFTERNOON,
        evening: activeSlots.EVENING,
        bedtime: activeSlots.BEDTIME,
        morningTime: activeSlots.MORNING ? toTimeStr(slotTimes.MORNING) : undefined,
        afternoonTime: activeSlots.AFTERNOON ? toTimeStr(slotTimes.AFTERNOON) : undefined,
        eveningTime: activeSlots.EVENING ? toTimeStr(slotTimes.EVENING) : undefined,
        bedtimeTime: activeSlots.BEDTIME ? toTimeStr(slotTimes.BEDTIME) : undefined,
      },
      { onSuccess: () => navigation.goBack() }
    );
  };

  const formatDateDisplay = (d: Date) =>
    `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일`;

  const formatTimeDisplay = (d: Date) =>
    `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;

  return (
    <SafeAreaView style={styles.container}>
      {/* 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={12}>
          <Text style={styles.headerCancel}>취소</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>복약 일정 등록</Text>
        <TouchableOpacity onPress={handleSave} disabled={isPending} hitSlop={12}>
          <Text style={[styles.headerSave, isPending && styles.headerSaveDisabled]}>
            {isPending ? '저장 중…' : '저장'}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {/* 약품명 */}
        <View style={styles.field}>
          <Text style={styles.label}>약품명 *</Text>
          <TextInput
            style={styles.input}
            value={drugName}
            onChangeText={setDrugName}
            placeholder="예: 아스피린"
            placeholderTextColor={colors.text.disabled}
          />
        </View>

        {/* 용량 */}
        <View style={styles.field}>
          <Text style={styles.label}>용량</Text>
          <TextInput
            style={styles.input}
            value={dosage}
            onChangeText={setDosage}
            placeholder="예: 100mg"
            placeholderTextColor={colors.text.disabled}
          />
        </View>

        {/* 복약 시간대 */}
        <View style={styles.field}>
          <Text style={styles.label}>복약 시간대</Text>
          {TIME_SLOTS.map((s) => (
            <View key={s.key} style={styles.slotRow}>
              <View style={styles.slotLeft}>
                <Switch
                  value={activeSlots[s.key]}
                  onValueChange={() => toggleSlot(s.key)}
                  trackColor={{ false: colors.border, true: colors.primary + '80' }}
                  thumbColor={activeSlots[s.key] ? colors.primary : colors.text.disabled}
                />
                <Text style={styles.slotLabel}>{s.label}</Text>
              </View>
              {activeSlots[s.key] && (
                <>
                  <TouchableOpacity
                    style={styles.timePill}
                    onPress={() => setShowTimePicker(s.key)}
                  >
                    <Text style={styles.timePillText}>{formatTimeDisplay(slotTimes[s.key])}</Text>
                  </TouchableOpacity>
                  {showTimePicker === s.key && (
                    <DateTimePicker
                      value={slotTimes[s.key]}
                      mode="time"
                      display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                      onChange={handleTimeChange(s.key)}
                    />
                  )}
                </>
              )}
            </View>
          ))}
        </View>

        {/* 시작일 */}
        <View style={styles.field}>
          <Text style={styles.label}>시작일</Text>
          <TouchableOpacity
            style={styles.dateBtn}
            onPress={() => setShowDatePicker(true)}
          >
            <Text style={styles.dateBtnText}>{formatDateDisplay(startDate)}</Text>
          </TouchableOpacity>
          {showDatePicker && (
            <DateTimePicker
              value={startDate}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={(e, d) => {
                if (Platform.OS === 'android') setShowDatePicker(false);
                if (d) setStartDate(d);
              }}
            />
          )}
          {Platform.OS === 'ios' && showDatePicker && (
            <TouchableOpacity
              style={styles.doneBtn}
              onPress={() => setShowDatePicker(false)}
            >
              <Text style={styles.doneBtnText}>완료</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* 투약 일수 */}
        <View style={styles.field}>
          <Text style={styles.label}>투약 일수</Text>
          <TextInput
            style={styles.input}
            value={durationDays}
            onChangeText={setDurationDays}
            placeholder="예: 7"
            keyboardType="number-pad"
            placeholderTextColor={colors.text.disabled}
          />
          {endDate && (
            <Text style={styles.endDateHint}>
              종료일: {formatDateDisplay(endDate)}
            </Text>
          )}
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
  headerCancel: {
    fontSize: sizes.font.md,
    color: colors.text.secondary,
  },
  headerTitle: {
    fontSize: sizes.font.lg,
    fontWeight: sizes.fontWeight.bold,
    color: colors.text.primary,
  },
  headerSave: {
    fontSize: sizes.font.md,
    color: colors.primary,
    fontWeight: sizes.fontWeight.semibold,
  },
  headerSaveDisabled: { opacity: 0.4 },
  content: { padding: sizes.spacing.lg, gap: sizes.spacing.lg },
  field: { gap: sizes.spacing.sm },
  label: {
    fontSize: sizes.font.sm,
    fontWeight: sizes.fontWeight.semibold,
    color: colors.text.secondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  input: {
    height: sizes.buttonHeight.md,
    backgroundColor: colors.surface,
    borderRadius: sizes.radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: sizes.spacing.md,
    fontSize: sizes.font.md,
    color: colors.text.primary,
  },
  slotRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: sizes.spacing.xs,
  },
  slotLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: sizes.spacing.sm,
  },
  slotLabel: {
    fontSize: sizes.font.md,
    color: colors.text.primary,
  },
  timePill: {
    paddingHorizontal: sizes.spacing.md,
    paddingVertical: 6,
    backgroundColor: colors.primary + '18',
    borderRadius: sizes.radius.full,
    borderWidth: 1,
    borderColor: colors.primary + '44',
  },
  timePillText: {
    fontSize: sizes.font.sm,
    color: colors.primary,
    fontWeight: sizes.fontWeight.medium,
  },
  dateBtn: {
    height: sizes.buttonHeight.md,
    backgroundColor: colors.surface,
    borderRadius: sizes.radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: sizes.spacing.md,
    justifyContent: 'center',
  },
  dateBtnText: {
    fontSize: sizes.font.md,
    color: colors.text.primary,
  },
  doneBtn: {
    alignItems: 'flex-end',
    paddingVertical: sizes.spacing.xs,
  },
  doneBtnText: {
    fontSize: sizes.font.md,
    color: colors.primary,
    fontWeight: sizes.fontWeight.semibold,
  },
  endDateHint: {
    fontSize: sizes.font.xs,
    color: colors.text.secondary,
    marginTop: 2,
  },
});
