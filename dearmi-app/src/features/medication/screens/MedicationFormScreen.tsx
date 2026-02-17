import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Switch,
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
import { AnimatedPressable } from '@/shared/components/AnimatedPressable';
import { useCreateMedicationSchedule, useUpdateMedicationSchedule, useAllMedicationSchedules } from '@/features/medication/hooks/useMedication';
import { useMedicationDetail } from '@/features/prescription/hooks/usePrescription';
import { useUnsavedChangesWarning } from '@/shared/hooks/useUnsavedChangesWarning';
import { useTabBarSafeBottom } from '@/shared/hooks/useTabBarSafeBottom';
import type { MedicationStackParamList } from '@/navigation/MedicationNavigator';
import type { TimeSlotType } from '@/shared/types/domain.types';

type Nav = StackNavigationProp<MedicationStackParamList, 'MedicationForm'>;
type Route = RouteProp<MedicationStackParamList, 'MedicationForm'>;

const useTimeSlots = (): Array<{ key: TimeSlotType; label: string; defaultTime: string }> => {
  const { t } = useTranslation('common');
  return [
    { key: 'MORNING', label: t('time_morning'), defaultTime: '08:00' },
    { key: 'AFTERNOON', label: t('time_afternoon'), defaultTime: '12:00' },
    { key: 'EVENING', label: t('time_evening'), defaultTime: '18:00' },
    { key: 'BEDTIME', label: t('time_bedtime'), defaultTime: '22:00' },
  ];
};

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
  const { colors } = useTheme();
  const navigation = useNavigation<Nav>();
  const { t, i18n } = useTranslation(['settings', 'common']);
  const TIME_SLOTS = useTimeSlots();
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

  // API pre-fill — prescriptionMedicationId 있을 때만 (직접 파라미터 없을 때)
  const { data: prefill } = useMedicationDetail(
    prescriptionMedicationId && !drugNameParam ? prescriptionMedicationId : ''
  );

  // 편집 모드: 기존 일정 가져오기
  const { data: allSchedules = [] } = useAllMedicationSchedules(isEdit);
  const existingSchedule = isEdit
    ? allSchedules.find((s) => s.id === editScheduleId)
    : undefined;

  const { mutate: create, isPending } = useCreateMedicationSchedule();
  const { mutate: update, isPending: isUpdating } = useUpdateMedicationSchedule();

  const [drugName, setDrugName] = useState(drugNameParam ?? '');
  const [dosage, setDosage] = useState(dosageParam ?? '');
  const [singleDose, setSingleDose] = useState(singleDoseParam ?? '');
  const [drugCategory, setDrugCategory] = useState('');
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

  const [startDate, setStartDate] = useState(() => {
    if (startDateParam) return new Date(startDateParam + 'T00:00:00');
    return new Date();
  });
  const [showDatePicker, setShowDatePicker] = useState(false);

  // API pre-fill 적용 (직접 파라미터 없을 때만)
  useEffect(() => {
    if (prefill && !drugNameParam) {
      if (prefill.medicationName) setDrugName(prefill.medicationName);
      if (prefill.dosage) setDosage(prefill.dosage);
      if (prefill.singleDose) setSingleDose(prefill.singleDose);
      if (prefill.durationDays) setDurationDays(String(prefill.durationDays));
    }
  }, [prefill]);

  // 편집 모드: 기존 데이터로 폼 초기화
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
    setActiveSlots({
      MORNING: existingSchedule.morning,
      AFTERNOON: existingSchedule.afternoon,
      EVENING: existingSchedule.evening,
      BEDTIME: existingSchedule.bedtime,
    });
    const parseTime = (t?: string) => {
      if (!t) return null;
      const [h, m] = t.split(':').map(Number);
      const d = new Date(); d.setHours(h, m, 0, 0);
      return d;
    };
    setSlotTimes((prev) => ({
      MORNING: parseTime(existingSchedule.morningTime) ?? prev.MORNING,
      AFTERNOON: parseTime(existingSchedule.afternoonTime) ?? prev.AFTERNOON,
      EVENING: parseTime(existingSchedule.eveningTime) ?? prev.EVENING,
      BEDTIME: parseTime(existingSchedule.bedtimeTime) ?? prev.BEDTIME,
    }));
    setEditHydrated(true);
  }, [isEdit, existingSchedule, editHydrated]);

  const endDate =
    durationDays && !isNaN(Number(durationDays))
      ? addDays(startDate, Number(durationDays) - 1)
      : null;

  const toggleSlot = (slot: TimeSlotType) =>
    setActiveSlots((prev) => ({ ...prev, [slot]: !prev[slot] }));

  const buildPayload = () => ({
    prescriptionMedicationId: prescriptionMedicationId
      ? String(prescriptionMedicationId)
      : undefined,
    drugName: drugName.trim(),
    dosage: dosage.trim() || undefined,
    singleDose: singleDose.trim() || undefined,
    drugCategory: drugCategory.trim() || undefined,
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
      customAlert(t('common:required_input'), t('settings:medication_required_drug_name'));
      return false;
    }
    if (!Object.values(activeSlots).some(Boolean)) {
      customAlert(t('settings:medication_required_time_title'), t('settings:medication_required_time_message'));
      return false;
    }
    if (!durationDays.trim() || isNaN(Number(durationDays)) || Number(durationDays) <= 0) {
      customAlert(t('common:required_input'), t('settings:medication_required_duration_message'));
      return false;
    }
    return true;
  };

  // 변경사항 추적 → 이탈 경고 (drugName/dosage/durationDays 입력 시)
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

  /** OCR 흐름: 마지막 약 저장 후 처방전 목록으로 (스택 리셋으로 OcrResult 제거) */
  const handleSaveAndFinish = () => {
    if (!validate()) return;
    create(buildPayload(), {
      onSuccess: () =>
        navigation.dispatch(
          CommonActions.reset({ index: 1, routes: [{ name: 'MedicationHome' }, { name: 'PrescriptionList' }] })
        ),
    });
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

  const formatTimeDisplay = (d: Date) =>
    `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;

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
        saveDisabled={isPending}
      />

      {/* OCR 진행 배너 */}
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
        {/* 처방전 등록 배너 — 신규 등록 모드에서만 */}
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

        {/* 복약 시간대 */}
        <View style={styles.fieldCard}>
          <Text style={styles.label}>{t('settings:medication_time_slot')}</Text>
          {TIME_SLOTS.map((s) => (
            <View key={s.key} style={styles.slotRow}>
              <View style={styles.slotLeft}>
                <Switch
                  value={activeSlots[s.key]}
                  onValueChange={() => toggleSlot(s.key)}
                  trackColor={{ false: colors.divider, true: colors.primaryLight }}
                  thumbColor={activeSlots[s.key] ? colors.primary : colors.textDisabled}
                />
                <AnimatedPressable
                  onPress={() => toggleSlot(s.key)}
                  style={[
                    styles.slotPill,
                    activeSlots[s.key] && styles.slotPillActive,
                  ]}
                >
                  <Text style={[
                    styles.slotLabel,
                    activeSlots[s.key] && styles.slotLabelActive,
                  ]}>{s.label}</Text>
                </AnimatedPressable>
              </View>
              {activeSlots[s.key] && (
                <TouchableOpacity
                  style={styles.timePill}
                  onPress={() => setShowTimePicker(s.key)}
                >
                  <Text style={styles.timePillText}>{formatTimeDisplay(slotTimes[s.key])}</Text>
                </TouchableOpacity>
              )}
            </View>
          ))}
        </View>

        {/* 시간 선택 모달 */}
        {showTimePicker && (
          <TimePickerModal
            visible
            initialHour={slotTimes[showTimePicker].getHours()}
            initialMinute={slotTimes[showTimePicker].getMinutes()}
            onConfirm={(h, m) => {
              const slot = showTimePicker;
              setShowTimePicker(null);
              setSlotTimes((prev) => {
                const d = new Date(prev[slot]);
                d.setHours(h, m, 0, 0);
                return { ...prev, [slot]: d };
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

        {/* 저장 버튼 — OCR 흐름이 아닐 때만 스크롤 내 표시 */}
        {/*
         * ScrollView + keyboardShouldPersistTaps="handled" 조합에서 AnimatedPressable 이
         * 키보드 해제 우선순위에 밀려 첫 탭이 먹히는 버그가 있어 TouchableOpacity 사용.
         */}
        {!isFromOcr && (
          <TouchableOpacity onPress={handleSave} disabled={isPending} activeOpacity={0.85}>
            <LinearGradient
              colors={[colors.primaryVivid, colors.primaryVividDark]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[styles.saveBtn, isPending && styles.saveBtnDisabled]}
            >
              <Text style={styles.saveBtnText}>
                {isPending ? t('common:saving') : t('common:save')}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        )}
      </ScrollView>

      {/* OCR 흐름: 다음 약품 버튼 */}
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

      {/* OCR 흐름: 마지막 약 저장 버튼 */}
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
    slotRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: sizes.spacing.xs,
    },
    slotLeft: { flexDirection: 'row', alignItems: 'center', gap: sizes.spacing.sm },
    slotPill: {
      paddingHorizontal: sizes.spacing.md,
      paddingVertical: 4,
      borderRadius: sizes.radius.full,
      backgroundColor: 'transparent',
    },
    slotPillActive: {
      backgroundColor: colors.primaryMuted,
    },
    slotLabel: {
      fontSize: sizes.font.md,
      color: colors.textSub,
      fontFamily: fontFamily.medium,
    },
    slotLabelActive: {
      color: colors.primary,
      fontFamily: fontFamily.semibold,
    },
    timePill: {
      paddingHorizontal: sizes.spacing.md,
      paddingVertical: 6,
      backgroundColor: colors.primaryMuted,
      borderRadius: sizes.radius.full,
    },
    timePillText: {
      fontSize: sizes.font.sm,
      color: colors.primary,
      fontFamily: fontFamily.medium,
    },
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
    doneBtn: { alignItems: 'flex-end', paddingVertical: sizes.spacing.xs },
    doneBtnText: {
      fontSize: sizes.font.md,
      color: colors.primary,
      fontFamily: fontFamily.semibold,
    },
    endDateHint: {
      fontSize: sizes.font.xs,
      color: colors.textSub,
      marginTop: 2,
    },
    // 저장 버튼
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
    // 다음 약품 버튼
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
    // 처방전 등록 배너
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
