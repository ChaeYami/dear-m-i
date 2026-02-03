import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  
  Platform,
  Alert,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
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
  const params = useRoute<Route>().params ?? {};
  const {
    prescriptionMedicationId,
    drugName: drugNameParam,
    dosage: dosageParam,
    totalDays: totalDaysParam,
    isFromOcr,
    remainingMeds,
  } = params;

  // API pre-fill — prescriptionMedicationId 있을 때만 (직접 파라미터 없을 때)
  const { data: prefill } = useMedicationDetail(
    prescriptionMedicationId && !drugNameParam ? Number(prescriptionMedicationId) : 0
  );

  const { mutate: create, isPending } = useCreateMedicationSchedule();

  const [drugName, setDrugName] = useState(drugNameParam ?? '');
  const [dosage, setDosage] = useState(dosageParam ?? '');
  const [durationDays, setDurationDays] = useState(
    totalDaysParam !== undefined ? String(totalDaysParam) : ''
  );

  const [activeSlots, setActiveSlots] = useState<Record<TimeSlotType, boolean>>({
    MORNING: true, AFTERNOON: false, EVENING: false, BEDTIME: false,
  });

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

  // API pre-fill 적용 (직접 파라미터 없을 때만)
  useEffect(() => {
    if (prefill && !drugNameParam) {
      if (prefill.medicationName) setDrugName(prefill.medicationName);
      if (prefill.dosage) setDosage(prefill.dosage);
      if (prefill.durationDays) setDurationDays(String(prefill.durationDays));
    }
  }, [prefill]);

  const endDate =
    durationDays && !isNaN(Number(durationDays))
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

  const buildPayload = () => ({
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
  });

  const validate = (): boolean => {
    if (!drugName.trim()) {
      Alert.alert('필수 입력', '약품명을 입력해 주세요.');
      return false;
    }
    if (!Object.values(activeSlots).some(Boolean)) {
      Alert.alert('시간대 선택', '복약 시간대를 하나 이상 선택해 주세요.');
      return false;
    }
    return true;
  };

  const handleSave = () => {
    if (!validate()) return;
    create(buildPayload(), { onSuccess: () => navigation.goBack() });
  };

  /** OCR 흐름: 저장 후 다음 약품으로 이동 */
  const handleSaveAndNext = () => {
    if (!validate()) return;
    if (!remainingMeds || remainingMeds.length === 0) return;

    create(buildPayload(), {
      onSuccess: () => {
        const [next, ...rest] = remainingMeds;
        navigation.replace('MedicationForm', {
          drugName: next.drugName,
          dosage: next.dosage,
          totalDays: next.totalDays,
          isFromOcr: true,
          remainingMeds: rest,
        });
      },
    });
  };

  const formatDateDisplay = (d: Date) =>
    `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일`;

  const formatTimeDisplay = (d: Date) =>
    `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;

  const nextMed = remainingMeds?.[0];
  const showNextButton = isFromOcr && nextMed;

  return (
    <SafeAreaView style={styles.container}>
      {/* 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={12}>
          <Text style={styles.headerCancel}>취소</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {isFromOcr ? '복약 알림 설정' : '복약 일정 등록'}
        </Text>
        <TouchableOpacity onPress={handleSave} disabled={isPending} hitSlop={12}>
          <Text style={[styles.headerSave, isPending && styles.headerSaveDisabled]}>
            {isPending ? '저장 중…' : '저장'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* OCR 진행 배너 */}
      {isFromOcr && (
        <View style={styles.ocrBanner}>
          <Text style={styles.ocrBannerText}>
            {drugName || drugNameParam || '약품'}
            {remainingMeds && remainingMeds.length > 0
              ? ` 외 ${remainingMeds.length}개`
              : ''}
            의 복약 시간을 설정해 주세요.
          </Text>
        </View>
      )}

      <ScrollView
        contentContainerStyle={[styles.content, showNextButton && styles.contentWithNext]}
        keyboardShouldPersistTaps="handled"
      >
        {/* 약품명 */}
        <View style={styles.field}>
          <Text style={styles.label}>약품명 *</Text>
          <TextInput
            style={styles.input}
            value={drugName}
            onChangeText={setDrugName}
            placeholder="예: 아스피린"
            placeholderTextColor={colors.textDisabled}
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
            placeholderTextColor={colors.textDisabled}
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
                  trackColor={{ false: colors.divider, true: colors.primary + '80' }}
                  thumbColor={activeSlots[s.key] ? colors.primary : colors.textDisabled}
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
          <TouchableOpacity style={styles.dateBtn} onPress={() => setShowDatePicker(true)}>
            <Text style={styles.dateBtnText}>{formatDateDisplay(startDate)}</Text>
          </TouchableOpacity>
          {showDatePicker && (
            <DateTimePicker
              value={startDate}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={handleDateChange}
            />
          )}
          {Platform.OS === 'ios' && showDatePicker && (
            <TouchableOpacity style={styles.doneBtn} onPress={() => setShowDatePicker(false)}>
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
            placeholderTextColor={colors.textDisabled}
          />
          {endDate && (
            <Text style={styles.endDateHint}>종료일: {formatDateDisplay(endDate)}</Text>
          )}
        </View>
      </ScrollView>

      {/* 다음 약품 버튼 (OCR 흐름) */}
      {showNextButton && (
        <View style={styles.nextBtnWrap}>
          <TouchableOpacity
            style={[styles.nextBtn, isPending && styles.nextBtnDisabled]}
            onPress={handleSaveAndNext}
            disabled={isPending}
            activeOpacity={0.85}
          >
            <Text style={styles.nextBtnText}>
              {isPending ? '저장 중…' : `다음: ${nextMed.drugName} 설정하기 →`}
            </Text>
          </TouchableOpacity>
        </View>
      )}
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
    borderBottomColor: colors.divider,
  },
  headerCancel: { fontSize: sizes.font.md, color: colors.textSub },
  headerTitle: {
    fontSize: sizes.font.lg,
    fontWeight: sizes.fontWeight.bold,
    color: colors.text,
  },
  headerSave: {
    fontSize: sizes.font.md,
    color: colors.primary,
    fontWeight: sizes.fontWeight.semibold,
  },
  headerSaveDisabled: { opacity: 0.4 },
  ocrBanner: {
    backgroundColor: colors.primary + '10',
    borderBottomWidth: 1,
    borderBottomColor: colors.primary + '25',
    paddingHorizontal: sizes.spacing.lg,
    paddingVertical: sizes.spacing.sm,
  },
  ocrBannerText: {
    fontSize: sizes.font.sm,
    color: colors.primary,
    fontWeight: sizes.fontWeight.medium,
  },
  content: { padding: sizes.spacing.lg, gap: sizes.spacing.lg },
  contentWithNext: { paddingBottom: 100 },
  field: { gap: sizes.spacing.sm },
  label: {
    fontSize: sizes.font.sm,
    fontWeight: sizes.fontWeight.semibold,
    color: colors.textSub,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  input: {
    height: sizes.buttonHeight.md,
    backgroundColor: colors.surface,
    borderRadius: sizes.radius.lg,
    borderWidth: 1,
    borderColor: colors.divider,
    paddingHorizontal: sizes.spacing.md,
    fontSize: sizes.font.md,
    color: colors.text,
  },
  slotRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: sizes.spacing.xs,
  },
  slotLeft: { flexDirection: 'row', alignItems: 'center', gap: sizes.spacing.sm },
  slotLabel: { fontSize: sizes.font.md, color: colors.text },
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
    borderColor: colors.divider,
    paddingHorizontal: sizes.spacing.md,
    justifyContent: 'center',
  },
  dateBtnText: { fontSize: sizes.font.md, color: colors.text },
  doneBtn: { alignItems: 'flex-end', paddingVertical: sizes.spacing.xs },
  doneBtnText: {
    fontSize: sizes.font.md,
    color: colors.primary,
    fontWeight: sizes.fontWeight.semibold,
  },
  endDateHint: {
    fontSize: sizes.font.xs,
    color: colors.textSub,
    marginTop: 2,
  },
  // 다음 약품 버튼
  nextBtnWrap: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: sizes.spacing.lg,
    paddingBottom: sizes.spacing.xl,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
  },
  nextBtn: {
    height: sizes.buttonHeight.lg,
    backgroundColor: colors.secondary,
    borderRadius: sizes.radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextBtnDisabled: { opacity: 0.5 },
  nextBtnText: {
    fontSize: sizes.font.md,
    fontWeight: sizes.fontWeight.bold,
    color: colors.textInverse,
  },
});
