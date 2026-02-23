import React, { useState, useEffect } from 'react';
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
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation, useRoute, RouteProp, CommonActions } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { DatePickerModal } from '@/features/schedule/components/DatePickerModal';
import { TimePickerModal } from '@/shared/components/TimePickerModal';
import type { StackNavigationProp } from '@react-navigation/stack';
import { customAlert } from '@/shared/components/CustomAlert';
import { useTheme, sizes, fontFamily } from '@/shared/theme';
import { ScreenHeader } from '@/shared/components/ScreenHeader';
import { softShadow } from '@/shared/theme/shadows';
import { useCreateMedicationSchedule, useUpdateMedicationSchedule, useAllMedicationSchedules } from '@/features/medication/hooks/useMedication';
import { useMedicationDetail } from '@/features/prescription/hooks/usePrescription';
import { useUnsavedChangesWarning } from '@/shared/hooks/useUnsavedChangesWarning';
import { useTabBarSafeBottom } from '@/shared/hooks/useTabBarSafeBottom';
import type { MedicationStackParamList } from '@/navigation/MedicationNavigator';
import type { TimeSlotType } from '@/shared/types/domain.types';

type Nav = StackNavigationProp<MedicationStackParamList, 'MedicationForm'>;
type Route = RouteProp<MedicationStackParamList, 'MedicationForm'>;

// 내부 슬롯 순서 — UI 표시 순서이자 백엔드 매핑 순서
const SLOT_KEYS: TimeSlotType[] = ['MORNING', 'AFTERNOON', 'EVENING', 'BEDTIME'];
const SLOT_DEFAULTS = ['08:00', '12:00', '18:00', '22:00'];

const toLocalDateStr = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

const toTimeStr = (d: Date) =>
  `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:00`;

const addDays = (d: Date, n: number) => {
  const result = new Date(d);
  result.setDate(result.getDate() + n);
  return result;
};

const makeDate = (timeStr: string) => {
  const [h, m] = timeStr.split(':').map(Number);
  const d = new Date();
  d.setHours(h, m, 0, 0);
  return d;
};

const formatTimeDisplay = (d: Date) =>
  `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;

export const MedicationFormScreen: React.FC = () => {
  const { colors } = useTheme();
  const navigation = useNavigation<Nav>();
  const { t } = useTranslation(['settings', 'common']);
  const params = useRoute<Route>().params ?? {};
  const {
    scheduleId: editScheduleId,
    prescriptionMedicationId,
    drugName: drugNameParam,
    dosage: dosageParam,
    singleDose: singleDoseParam,
    totalDays: totalDaysParam,
    startDate: startDateParam,
    isFromOcr,
    remainingMeds,
  } = params;

  const isEdit = Boolean(editScheduleId);

  const { data: prefill } = useMedicationDetail(
    prescriptionMedicationId && !drugNameParam ? prescriptionMedicationId : ''
  );
  const { data: allSchedules = [] } = useAllMedicationSchedules(isEdit);
  const existingSchedule = isEdit ? allSchedules.find((s) => s.id === editScheduleId) : undefined;

  const { mutate: create, isPending } = useCreateMedicationSchedule();
  const { mutate: update, isPending: isUpdating } = useUpdateMedicationSchedule();

  const [drugName, setDrugName] = useState(drugNameParam ?? '');
  const [dosage, setDosage] = useState(dosageParam ?? '');
  const [singleDose, setSingleDose] = useState(singleDoseParam ?? '');
  const [drugCategory, setDrugCategory] = useState('');
  const [durationDays, setDurationDays] = useState(
    totalDaysParam !== undefined ? String(totalDaysParam) : ''
  );

  // 활성화된 슬롯 인덱스 배열 (최대 4개, SLOT_KEYS 순서로 매핑)
  // 예: [0, 2] → MORNING(08:00) + EVENING(18:00) 활성
  const [activeSlotIndices, setActiveSlotIndices] = useState<number[]>([0]);
  const [slotTimes, setSlotTimes] = useState<Record<number, Date>>({
    0: makeDate(SLOT_DEFAULTS[0]),
    1: makeDate(SLOT_DEFAULTS[1]),
    2: makeDate(SLOT_DEFAULTS[2]),
    3: makeDate(SLOT_DEFAULTS[3]),
  });
  const [showTimePicker, setShowTimePicker] = useState<number | null>(null);

  const [startDate, setStartDate] = useState(() => {
    if (startDateParam) return new Date(startDateParam + 'T00:00:00');
    return new Date();
  });
  const [showDatePicker, setShowDatePicker] = useState(false);

  // API pre-fill
  useEffect(() => {
    if (prefill && !drugNameParam) {
      if (prefill.medicationName) setDrugName(prefill.medicationName);
      if (prefill.dosage) setDosage(prefill.dosage);
      if (prefill.singleDose) setSingleDose(prefill.singleDose);
      if (prefill.durationDays) setDurationDays(String(prefill.durationDays));
    }
  }, [prefill]);

  // 편집 모드 hydration
  const [editHydrated, setEditHydrated] = useState(false);
  useEffect(() => {
    if (!isEdit || !existingSchedule || editHydrated) return;
    setDrugName(existingSchedule.drugName ?? '');
    setDosage(existingSchedule.dosage ?? '');
    setSingleDose(existingSchedule.singleDose ?? '');
    setDrugCategory(existingSchedule.drugCategory ?? '');
    if (existingSchedule.startDate) setStartDate(new Date(existingSchedule.startDate));
    if (existingSchedule.startDate && existingSchedule.endDate) {
      const start = new Date(existingSchedule.startDate);
      const end = new Date(existingSchedule.endDate);
      const diff = Math.round((end.getTime() - start.getTime()) / 86400000) + 1;
      setDurationDays(String(diff));
    }
    // 기존 슬롯 매핑 복원
    const parseTime = (t?: string) => {
      if (!t) return null;
      const [h, m] = t.split(':').map(Number);
      const d = new Date(); d.setHours(h, m, 0, 0);
      return d;
    };
    const slotFlags = [existingSchedule.morning, existingSchedule.afternoon, existingSchedule.evening, existingSchedule.bedtime];
    const slotTimeSources = [existingSchedule.morningTime, existingSchedule.afternoonTime, existingSchedule.eveningTime, existingSchedule.bedtimeTime];
    const indices = slotFlags.map((active, i) => active ? i : -1).filter((i) => i >= 0);
    setActiveSlotIndices(indices.length > 0 ? indices : [0]);
    setSlotTimes((prev) => {
      const next = { ...prev };
      slotTimeSources.forEach((t, i) => {
        const parsed = parseTime(t);
        if (parsed) next[i] = parsed;
      });
      return next;
    });
    setEditHydrated(true);
  }, [isEdit, existingSchedule, editHydrated]);

  const endDate =
    durationDays && !isNaN(Number(durationDays))
      ? addDays(startDate, Number(durationDays) - 1)
      : null;

  const addSlot = () => {
    if (activeSlotIndices.length >= 4) return;
    const available = [0, 1, 2, 3].find((i) => !activeSlotIndices.includes(i));
    if (available === undefined) return;
    setActiveSlotIndices((prev) => [...prev, available].sort((a, b) => a - b));
  };

  const removeSlot = (index: number) => {
    if (activeSlotIndices.length <= 1) return; // 최소 1개
    setActiveSlotIndices((prev) => prev.filter((i) => i !== index));
  };

  const buildPayload = () => ({
    prescriptionMedicationId: prescriptionMedicationId ? String(prescriptionMedicationId) : undefined,
    drugName: drugName.trim(),
    dosage: dosage.trim() || undefined,
    singleDose: singleDose.trim() || undefined,
    drugCategory: drugCategory.trim() || undefined,
    startDate: toLocalDateStr(startDate),
    endDate: endDate ? toLocalDateStr(endDate) : undefined,
    morning: activeSlotIndices.includes(0),
    afternoon: activeSlotIndices.includes(1),
    evening: activeSlotIndices.includes(2),
    bedtime: activeSlotIndices.includes(3),
    morningTime: activeSlotIndices.includes(0) ? toTimeStr(slotTimes[0]) : undefined,
    afternoonTime: activeSlotIndices.includes(1) ? toTimeStr(slotTimes[1]) : undefined,
    eveningTime: activeSlotIndices.includes(2) ? toTimeStr(slotTimes[2]) : undefined,
    bedtimeTime: activeSlotIndices.includes(3) ? toTimeStr(slotTimes[3]) : undefined,
  });

  const validate = (): boolean => {
    if (!drugName.trim()) {
      customAlert(t('common:required_input'), t('settings:medication_required_drug_name'));
      return false;
    }
    if (activeSlotIndices.length === 0) {
      customAlert(t('settings:medication_required_time_title'), t('settings:medication_required_time_message'));
      return false;
    }
    if (!durationDays.trim() || isNaN(Number(durationDays)) || Number(durationDays) <= 0) {
      customAlert(t('common:required_input'), t('settings:medication_required_duration_message'));
      return false;
    }
    return true;
  };

  const isDirty =
    drugName.trim() !== (drugNameParam ?? '') ||
    dosage.trim() !== (dosageParam ?? '') ||
    durationDays !== (totalDaysParam !== undefined ? String(totalDaysParam) : '');

  const { markSavedAndExit } = useUnsavedChangesWarning({ isDirty });

  const handleSave = () => {
    if (!validate()) return;
    if (isEdit && editScheduleId) {
      const { prescriptionMedicationId: _, ...payload } = buildPayload();
      update({ id: editScheduleId, data: payload }, { onSuccess: () => markSavedAndExit() });
    } else {
      create(buildPayload(), { onSuccess: () => markSavedAndExit() });
    }
  };

  const handleSaveAndFinish = () => {
    if (!validate()) return;
    create(buildPayload(), {
      onSuccess: () =>
        navigation.dispatch(
          CommonActions.reset({ index: 1, routes: [{ name: 'MedicationHome' }, { name: 'PrescriptionList' }] })
        ),
    });
  };

  const handleSaveAndNext = () => {
    if (!validate()) return;
    if (!remainingMeds || remainingMeds.length === 0) return;
    create(buildPayload(), {
      onSuccess: () => {
        const [next, ...rest] = remainingMeds;
        navigation.replace('MedicationForm', {
          drugName: next.drugName,
          dosage: next.dosage,
          singleDose: next.singleDose,
          totalDays: next.totalDays,
          startDate: startDateParam,
          isFromOcr: true,
          remainingMeds: rest,
        });
      },
    });
  };

  const formatDateDisplay = (d: Date) =>
    t('settings:medication_date_format', {
      year: d.getFullYear(),
      month: d.getMonth() + 1,
      day: d.getDate(),
    });

  const nextMed = remainingMeds?.[0];
  const showNextButton = isFromOcr && nextMed;
  const showFinishButton = isFromOcr && !nextMed;

  const tabBarSafeBottom = useTabBarSafeBottom();
  const styles = getStyles(colors);

  return (
    <SafeAreaView style={styles.container}>
      <ScreenHeader
        variant="form"
        title={isFromOcr ? t('settings:medication_form_ocr_title') : isEdit ? t('settings:medication_form_edit_title') : t('settings:medication_form_title')}
        onCancel={() => navigation.goBack()}
        onSave={handleSave}
        saveDisabled={isPending || isUpdating}
      />

      {isFromOcr && (
        <View style={styles.ocrBanner}>
          <Text style={styles.ocrBannerText}>
            {remainingMeds && remainingMeds.length > 0
              ? t('settings:medication_ocr_desc_with_extras', {
                  name: drugName || drugNameParam || t('settings:medication_label'),
                  count: remainingMeds.length,
                })
              : t('settings:medication_ocr_desc_single', {
                  name: drugName || drugNameParam || t('settings:medication_label'),
                })}
          </Text>
        </View>
      )}

      <ScrollView
        contentContainerStyle={[
          styles.content,
          showNextButton && styles.contentWithNext,
          !isFromOcr && { paddingBottom: tabBarSafeBottom },
        ]}
        keyboardShouldPersistTaps="always"
      >
        {!isFromOcr && !isEdit && (
          <TouchableOpacity
            style={[styles.prescriptionBanner, { backgroundColor: colors.primaryMuted, borderColor: colors.primary + '30' }]}
            onPress={() => navigation.navigate('PrescriptionUpload')}
            activeOpacity={0.8}
          >
            <Ionicons name="document-text-outline" size={20} color={colors.primary} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.prescriptionBannerTitle, { color: colors.primary }]}>
                {t('settings:medication_prescription_banner_title')}
              </Text>
              <Text style={[styles.prescriptionBannerSub, { color: colors.primary + 'aa' }]}>
                {t('settings:medication_prescription_banner_sub')}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={colors.primary} />
          </TouchableOpacity>
        )}

        {/* 약품명 */}
        <View style={styles.fieldCard}>
          <Text style={styles.label}>{t('settings:medication_drug_name_mark')}</Text>
          <TextInput
            style={styles.input}
            value={drugName}
            onChangeText={setDrugName}
            placeholder={t('settings:medication_drug_placeholder')}
            placeholderTextColor={colors.textDisabled}
          />
        </View>

        {/* 용량 */}
        <View style={styles.fieldCard}>
          <Text style={styles.label}>{t('settings:medication_dosage')}</Text>
          <TextInput
            style={styles.input}
            value={dosage}
            onChangeText={setDosage}
            placeholder={t('settings:medication_dosage_placeholder')}
            placeholderTextColor={colors.textDisabled}
          />
        </View>

        {/* 1회 투여량 */}
        <View style={styles.fieldCard}>
          <Text style={styles.label}>{t('settings:medication_dose_per_time')}</Text>
          <TextInput
            style={styles.input}
            value={singleDose}
            onChangeText={setSingleDose}
            placeholder={t('settings:medication_dose_per_time_placeholder')}
            placeholderTextColor={colors.textDisabled}
          />
        </View>

        {/* 약 종류 */}
        <View style={styles.fieldCard}>
          <Text style={styles.label}>{t('settings:medication_drug_kind')}</Text>
          <TextInput
            style={styles.input}
            value={drugCategory}
            onChangeText={setDrugCategory}
            placeholder={t('settings:medication_drug_kind_placeholder')}
            placeholderTextColor={colors.textDisabled}
          />
        </View>

        {/* 복약 시간 — 순수 시간 picker, 라벨 없음 */}
        <View style={styles.fieldCard}>
          <Text style={styles.label}>{t('settings:medication_time_slot')}</Text>

          {activeSlotIndices.map((slotIdx) => (
            <View key={slotIdx} style={styles.timeRow}>
              <Ionicons name="time-outline" size={18} color={colors.primary} />
              <TouchableOpacity
                style={styles.timePill}
                onPress={() => setShowTimePicker(slotIdx)}
              >
                <Text style={styles.timePillText}>{formatTimeDisplay(slotTimes[slotIdx])}</Text>
              </TouchableOpacity>
              {activeSlotIndices.length > 1 && (
                <TouchableOpacity
                  onPress={() => removeSlot(slotIdx)}
                  hitSlop={8}
                  style={styles.removeBtn}
                >
                  <Ionicons name="close-circle" size={20} color={colors.textDisabled} />
                </TouchableOpacity>
              )}
            </View>
          ))}

          {activeSlotIndices.length < 4 && (
            <TouchableOpacity style={styles.addTimeBtn} onPress={addSlot}>
              <Ionicons name="add-circle-outline" size={18} color={colors.primary} />
              <Text style={styles.addTimeBtnText}>{t('settings:medication_add_time')}</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* 시간 선택 모달 */}
        {showTimePicker !== null && (
          <TimePickerModal
            visible
            initialHour={slotTimes[showTimePicker].getHours()}
            initialMinute={slotTimes[showTimePicker].getMinutes()}
            onConfirm={(h, m) => {
              const idx = showTimePicker;
              setShowTimePicker(null);
              setSlotTimes((prev) => {
                const d = new Date(prev[idx]);
                d.setHours(h, m, 0, 0);
                return { ...prev, [idx]: d };
              });
            }}
            onClose={() => setShowTimePicker(null)}
          />
        )}

        {/* 시작일 */}
        <View style={styles.fieldCard}>
          <Text style={styles.label}>{t('settings:medication_start_date')}</Text>
          <TouchableOpacity style={styles.dateBtn} onPress={() => setShowDatePicker(true)}>
            <Text style={styles.dateBtnText}>{formatDateDisplay(startDate)}</Text>
          </TouchableOpacity>
          <DatePickerModal
            visible={showDatePicker}
            initialDate={startDate.toISOString().split('T')[0]}
            onConfirm={(dateStr) => {
              setShowDatePicker(false);
              setStartDate(new Date(dateStr + 'T00:00:00'));
            }}
            onClose={() => setShowDatePicker(false)}
          />
        </View>

        {/* 투약 일수 */}
        <View style={styles.fieldCard}>
          <Text style={styles.label}>{t('settings:medication_duration_mark')}</Text>
          <TextInput
            style={styles.input}
            value={durationDays}
            onChangeText={setDurationDays}
            placeholder={t('settings:medication_duration_placeholder')}
            keyboardType="number-pad"
            placeholderTextColor={colors.textDisabled}
          />
          {endDate && (
            <Text style={styles.endDateHint}>{t('settings:medication_end_date')} {formatDateDisplay(endDate)}</Text>
          )}
        </View>

        {!isFromOcr && (
          <TouchableOpacity onPress={handleSave} disabled={isPending || isUpdating} activeOpacity={0.85}>
            <LinearGradient
              colors={[colors.primaryVivid, colors.primaryVividDark]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[styles.saveBtn, (isPending || isUpdating) && styles.saveBtnDisabled]}
            >
              <Text style={styles.saveBtnText}>
                {isPending || isUpdating ? t('common:saving') : t('common:save')}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        )}
      </ScrollView>

      {showNextButton && (
        <View style={styles.nextBtnWrap}>
          <TouchableOpacity onPress={handleSaveAndNext} disabled={isPending} activeOpacity={0.85}>
            <LinearGradient
              colors={[colors.secondary, colors.secondaryLight]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[styles.nextBtn, isPending && styles.nextBtnDisabled]}
            >
              <Text style={styles.nextBtnText}>
                {isPending ? t('common:saving') : t('settings:medication_next_with_arrow', { name: nextMed.drugName })}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      )}

      {showFinishButton && (
        <View style={styles.nextBtnWrap}>
          <TouchableOpacity onPress={handleSaveAndFinish} disabled={isPending} activeOpacity={0.85}>
            <LinearGradient
              colors={[colors.primaryVivid, colors.primaryVividDark]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[styles.nextBtn, isPending && styles.nextBtnDisabled]}
            >
              <Text style={styles.nextBtnText}>
                {isPending ? t('common:saving') : t('common:save')}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
};

const getStyles = (colors: ReturnType<typeof useTheme>['colors']) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    ocrBanner: {
      backgroundColor: colors.primaryMuted,
      borderRadius: sizes.radius.xxl,
      marginHorizontal: sizes.spacing.lg,
      marginTop: sizes.spacing.sm,
      paddingHorizontal: sizes.spacing.lg,
      paddingVertical: sizes.spacing.md,
      ...softShadow(colors),
    },
    ocrBannerText: {
      fontSize: sizes.font.sm,
      color: colors.primary,
      fontFamily: fontFamily.medium,
    },
    content: { padding: sizes.spacing.lg, gap: sizes.spacing.md },
    contentWithNext: { paddingBottom: 100 },
    fieldCard: {
      gap: sizes.spacing.sm,
      backgroundColor: colors.surface,
      borderRadius: sizes.radius.xxl,
      padding: sizes.spacing.lg,
      ...softShadow(colors),
    },
    label: {
      fontSize: sizes.font.sm,
      fontFamily: fontFamily.semibold,
      color: colors.textSub,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    input: {
      height: sizes.buttonHeight.md,
      backgroundColor: colors.background,
      borderRadius: sizes.radius.lg,
      borderWidth: 1,
      borderColor: colors.divider,
      paddingHorizontal: sizes.spacing.md,
      fontSize: sizes.font.md,
      color: colors.text,
    },
    // ── 시간 슬롯 ──
    timeRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: sizes.spacing.sm,
      paddingVertical: sizes.spacing.xs,
    },
    timePill: {
      flex: 1,
      height: sizes.buttonHeight.md,
      backgroundColor: colors.primaryMuted,
      borderRadius: sizes.radius.lg,
      justifyContent: 'center',
      paddingHorizontal: sizes.spacing.md,
    },
    timePillText: {
      fontSize: sizes.font.md,
      color: colors.primary,
      fontFamily: fontFamily.semibold,
    },
    removeBtn: {
      padding: sizes.spacing.xs,
    },
    addTimeBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: sizes.spacing.xs,
      paddingVertical: sizes.spacing.sm,
      alignSelf: 'flex-start',
    },
    addTimeBtnText: {
      fontSize: sizes.font.sm,
      color: colors.primary,
      fontFamily: fontFamily.medium,
    },
    // ── 날짜 ──
    dateBtn: {
      height: sizes.buttonHeight.md,
      backgroundColor: colors.background,
      borderRadius: sizes.radius.lg,
      borderWidth: 1,
      borderColor: colors.divider,
      paddingHorizontal: sizes.spacing.md,
      justifyContent: 'center',
    },
    dateBtnText: { fontSize: sizes.font.md, color: colors.text },
    endDateHint: {
      fontSize: sizes.font.xs,
      color: colors.textSub,
      marginTop: 2,
    },
    // ── 저장 버튼 ──
    saveBtn: {
      height: sizes.buttonHeight.lg,
      borderRadius: sizes.radius.full,
      alignItems: 'center',
      justifyContent: 'center',
    },
    saveBtnDisabled: { opacity: 0.5 },
    saveBtnText: {
      fontSize: sizes.font.md,
      fontFamily: fontFamily.bold,
      color: colors.textInverse,
    },
    // ── OCR 다음 버튼 ──
    nextBtnWrap: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      padding: sizes.spacing.lg,
      paddingBottom: sizes.spacing.xl,
      backgroundColor: colors.surface,
      borderTopLeftRadius: sizes.radius.xxl,
      borderTopRightRadius: sizes.radius.xxl,
      ...softShadow(colors),
    },
    nextBtn: {
      height: sizes.buttonHeight.lg,
      borderRadius: sizes.radius.full,
      alignItems: 'center',
      justifyContent: 'center',
    },
    nextBtnDisabled: { opacity: 0.5 },
    nextBtnText: {
      fontSize: sizes.font.md,
      fontFamily: fontFamily.bold,
      color: colors.textInverse,
    },
    // ── 처방전 배너 ──
    prescriptionBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: sizes.spacing.sm,
      borderRadius: sizes.radius.xxl,
      borderWidth: 1,
      padding: sizes.spacing.md,
      paddingHorizontal: sizes.spacing.lg,
    },
    prescriptionBannerTitle: {
      fontSize: sizes.font.sm,
      fontFamily: fontFamily.semibold,
    },
    prescriptionBannerSub: {
      fontSize: sizes.font.xs,
      marginTop: 1,
    },
  });
