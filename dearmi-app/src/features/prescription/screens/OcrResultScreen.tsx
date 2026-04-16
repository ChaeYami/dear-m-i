import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Animated,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp, CommonActions } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { useTranslation } from 'react-i18next';
import { customAlert } from '@/shared/components/CustomAlert';
import i18n from '@/locales/i18n';
import { useTheme, sizes, fontFamily } from '@/shared/theme';
import { ScreenHeader } from '@/shared/components/ScreenHeader';
import {
  usePrescriptionDetail,
  useSavePrescription,
  usePrescriptions,
  useRetryOcr,
} from '@/features/prescription/hooks/usePrescription';
import { prescriptionApi } from '@/features/prescription/api';
import { useAuthStore } from '@/features/auth/store/authStore';
import type { MedicationStackParamList } from '@/navigation/MedicationNavigator';

type Nav = StackNavigationProp<MedicationStackParamList, 'OcrResult'>;
type Route = RouteProp<MedicationStackParamList, 'OcrResult'>;

// ─── 편집 가능한 약품 항목 타입 ───────────────────────────────────────────────

interface EditableMedication {
  key: string;
  medicationName: string;
  dosage: string;
  singleDose: string;
  frequency: string;
  durationDays: string;
}

let tempKeyCounter = 0;
const newMedication = (): EditableMedication => ({
  key: `new-${++tempKeyCounter}`,
  medicationName: '',
  dosage: '',
  singleDose: '',
  frequency: '',
  durationDays: '',
});

// ─── OCR 대기 화면 (스캔 애니메이션 + 진행 바) ───────────────────────────────

const THUMB_HEIGHT = 220;

const getSteps = () => [
  { until: 5,  text: i18n.t('prescription:ocr_progress_loading') },
  { until: 15, text: i18n.t('prescription:ocr_progress_analyzing') },
  { until: 28, text: i18n.t('prescription:ocr_progress_extracting') },
  { until: 99, text: i18n.t('prescription:ocr_progress_finalizing') },
];

const PendingView: React.FC<{
  colors: ReturnType<typeof useTheme>['colors'];
  imageUrl?: string;
}> = ({ colors, imageUrl }) => {
  const { t } = useTranslation('prescription');
  const STEPS = getSteps();
  // imageUrl은 폴링마다 바뀌는 presigned URL이므로 첫 비어있지 않은 값으로 고정
  const frozenUrlRef = useRef<string | undefined>(undefined);
  if (imageUrl && !frozenUrlRef.current) {
    frozenUrlRef.current = imageUrl;
  }
  const frozenUrl = frozenUrlRef.current;

  const progress = useRef(new Animated.Value(0)).current;
  const scanY = useRef(new Animated.Value(0)).current;
  const [stepIndex, setStepIndex] = useState(0);
  const elapsed = useRef(0);

  useEffect(() => {
    // 진행 바: 30초 동안 0 → 90%
    Animated.timing(progress, {
      toValue: 90,
      duration: 30000,
      useNativeDriver: false,
    }).start();

    // 스캔 라인: 위아래 루프
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(scanY, { toValue: THUMB_HEIGHT - 4, duration: 1800, useNativeDriver: true }),
        Animated.timing(scanY, { toValue: 0, duration: 1800, useNativeDriver: true }),
      ])
    );
    loop.start();

    // 단계 메시지: 1초마다 elapsed 체크 → stepIndex 업데이트
    const timer = setInterval(() => {
      elapsed.current += 1;
      const idx = STEPS.findIndex((s) => elapsed.current < s.until);
      setStepIndex(idx === -1 ? STEPS.length - 1 : idx);
    }, 1000);

    return () => {
      progress.stopAnimation();
      loop.stop();
      clearInterval(timer);
    };
  }, []);

  const widthInterpolated = progress.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={staticStyles.statusWrap}>
      {/* 처방전 사진 + 스캔 라인 */}
      {frozenUrl ? (
        <View style={[staticStyles.pendingThumbnail, { borderColor: colors.divider, overflow: 'hidden' }]}>
          <Image source={{ uri: frozenUrl }} style={{ width: '100%', height: '100%' }} resizeMode="contain" />
          <Animated.View
            pointerEvents="none"
            style={[
              staticStyles.scanLine,
              { backgroundColor: colors.primary, transform: [{ translateY: scanY }] },
            ]}
          />
        </View>
      ) : null}

      <ActivityIndicator size="large" color={colors.primary} />
      <Text style={[staticStyles.statusTitle, { fontFamily: fontFamily.bold, color: colors.text }]}>
        {STEPS[stepIndex].text}
      </Text>
      <Text style={[staticStyles.statusSub, { color: colors.textSub }]}>{t('ocr_wait')}</Text>

      {/* 진행 바 */}
      <View style={[staticStyles.progressTrack, { backgroundColor: colors.divider }]}>
        <Animated.View
          style={[
            staticStyles.progressFill,
            { backgroundColor: colors.primary, width: widthInterpolated as any },
          ]}
        />
      </View>
    </View>
  );
};

const FailedView: React.FC<{
  onRetry: () => void;
  onManualEntry: () => void;
  isRetrying: boolean;
  colors: ReturnType<typeof useTheme>['colors'];
}> = ({ onRetry, onManualEntry, isRetrying, colors }) => {
  const { t } = useTranslation('prescription');
  return (
    <View style={staticStyles.statusWrap}>
      <Text style={staticStyles.failIcon}>⚠️</Text>
      <Text style={[staticStyles.statusTitle, { fontFamily: fontFamily.bold, color: colors.text }]}>
        {t('ocr_failed')}
      </Text>
      <Text style={[staticStyles.statusSub, { color: colors.textSub }]}>
        {t('ocr_fail_sub')}
      </Text>
      <View style={staticStyles.failedActions}>
        <TouchableOpacity
          style={[staticStyles.failedBtn, { backgroundColor: colors.primary }]}
          onPress={onRetry}
          disabled={isRetrying}
          activeOpacity={0.8}
        >
          <Text style={[staticStyles.failedBtnText, { fontFamily: fontFamily.semibold, color: colors.textInverse }]}>
            {isRetrying ? t('ocr_retrying') : t('ocr_retry')}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[staticStyles.failedBtn, { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.divider }]}
          onPress={onManualEntry}
          disabled={isRetrying}
          activeOpacity={0.8}
        >
          <Text style={[staticStyles.failedBtnText, { fontFamily: fontFamily.semibold, color: colors.text }]}>
            {t('manual_input')}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

// ─── 약품 편집 행 ─────────────────────────────────────────────────────────────

const MedicationRow: React.FC<{
  item: EditableMedication;
  index: number;
  isReviewed: boolean;
  onChange: (index: number, field: keyof EditableMedication, value: string) => void;
  onRemove: (index: number) => void;
  onToggleReview: (key: string) => void;
  colors: ReturnType<typeof useTheme>['colors'];
}> = ({ item, index, isReviewed, onChange, onRemove, onToggleReview, colors }) => {
  const { t } = useTranslation(['prescription', 'common']);
  return (
    <View style={[
      staticStyles.medRow,
      { backgroundColor: colors.surface, borderColor: isReviewed ? colors.success : colors.divider },
      isReviewed && { borderWidth: 1.5 },
    ]}>
      <View style={staticStyles.medRowHeader}>
        <Text style={[staticStyles.medRowIndex, { fontFamily: fontFamily.semibold, color: colors.textSub }]}>
          #{index + 1}
        </Text>
        <TouchableOpacity onPress={() => onRemove(index)} hitSlop={8}>
          <Text style={[staticStyles.removeBtn, { fontFamily: fontFamily.bold, color: colors.error }]}>✕</Text>
        </TouchableOpacity>
      </View>
      <TextInput
        style={[staticStyles.medInput, { backgroundColor: colors.background, borderColor: colors.divider, color: colors.text }]}
        placeholder={t('drug_name_required_mark')}
        placeholderTextColor={colors.textDisabled}
        value={item.medicationName}
        onChangeText={(v) => onChange(index, 'medicationName', v)}
      />
      <View style={staticStyles.medInputRow}>
        <TextInput
          style={[staticStyles.medInput, staticStyles.medInputHalf, { backgroundColor: colors.background, borderColor: colors.divider, color: colors.text }]}
          placeholder={t('dosage')}
          placeholderTextColor={colors.textDisabled}
          value={item.dosage}
          onChangeText={(v) => onChange(index, 'dosage', v)}
        />
        <TextInput
          style={[staticStyles.medInput, staticStyles.medInputHalf, { backgroundColor: colors.background, borderColor: colors.divider, color: colors.text }]}
          placeholder={t('dose_per_time')}
          placeholderTextColor={colors.textDisabled}
          value={item.singleDose}
          onChangeText={(v) => onChange(index, 'singleDose', v)}
        />
      </View>
      <View style={staticStyles.medInputRow}>
        <TextInput
          style={[staticStyles.medInput, staticStyles.medInputHalf, { backgroundColor: colors.background, borderColor: colors.divider, color: colors.text }]}
          placeholder={t('frequency')}
          placeholderTextColor={colors.textDisabled}
          value={item.frequency}
          onChangeText={(v) => onChange(index, 'frequency', v)}
        />
        <TextInput
          style={[staticStyles.medInput, staticStyles.medInputShort, { backgroundColor: colors.background, borderColor: colors.divider, color: colors.text }]}
          placeholder={t('prescription:duration_days')}
          placeholderTextColor={colors.textDisabled}
          value={item.durationDays}
          onChangeText={(v) => onChange(index, 'durationDays', v)}
          keyboardType="numeric"
        />
      </View>
      {/* 검토 완료 토글 */}
      <TouchableOpacity
        style={[
          staticStyles.reviewToggle,
          { borderColor: isReviewed ? colors.success : colors.divider },
          isReviewed && { backgroundColor: colors.successLight },
        ]}
        onPress={() => onToggleReview(item.key)}
        activeOpacity={0.75}
      >
        <Ionicons
          name={isReviewed ? 'checkmark-circle' : 'ellipse-outline'}
          size={17}
          color={isReviewed ? colors.success : colors.textDisabled}
        />
        <Text style={[staticStyles.reviewToggleText, { color: isReviewed ? colors.success : colors.textSub }]}>
          {isReviewed ? t('common:done') : t('prescription:review_confirm')}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

// ─── 메인 화면 ────────────────────────────────────────────────────────────────

export const OcrResultScreen: React.FC = () => {
  const { colors } = useTheme();
  const navigation = useNavigation<Nav>();
  const { t } = useTranslation(['prescription', 'common']);
  const { prescriptionId } = useRoute<Route>().params;

  const isPremium = useAuthStore((s) => s.user?.plan === 'PREMIUM');

  const { data: prescription, isLoading, isOcrTimedOut, resetOcrTimer } =
    usePrescriptionDetail(prescriptionId, true);
  const { mutate: savePrescription, isPending: isSaving } = useSavePrescription();
  const { mutate: retryOcr, isPending: isRetrying } = useRetryOcr();
  const handleRetry = () => {
    resetOcrTimer();
    retryOcr(prescriptionId);
  };
  const { data: allPrescriptions = [] } = usePrescriptions();

  const [hospitalName, setHospitalName] = useState('');
  const [prescribedAt, setPrescribedAt] = useState('');
  const [medications, setMedications] = useState<EditableMedication[]>([]);
  const [editMode, setEditMode] = useState(false);
  const [duplicateWarningShown, setDuplicateWarningShown] = useState(false);
  const [reviewedKeys, setReviewedKeys] = useState<Set<string>>(new Set());

  const toggleReview = (key: string) => {
    setReviewedKeys((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };

  // 저장 버튼 눌러 성공한 경우에만 true — 아니면 unmount 시 처방전 자동 삭제
  const savedRef = useRef(false);
  useEffect(() => {
    return () => {
      if (savedRef.current) return;
      prescriptionApi.deletePrescription(prescriptionId).catch(() => {});
    };
  }, [prescriptionId]);

  // OCR COMPLETED 시 약품 목록 초기화 + 중복 감지
  useEffect(() => {
    if (prescription?.ocrStatus === 'COMPLETED') {
      const hospital = prescription.hospitalName ?? '';
      const date = prescription.prescribedAt ?? '';
      setHospitalName(hospital);
      setPrescribedAt(date);
      setMedications(
        prescription.medications.map((m) => ({
          key: String(m.id),
          medicationName: m.medicationName,
          dosage: m.dosage ?? '',
          singleDose: m.singleDose ?? '',
          frequency: m.frequency ?? '',
          durationDays: m.durationDays !== undefined ? String(m.durationDays) : '',
        }))
      );

      // 중복 감지: 같은 병원 + 같은 처방일인 다른 처방전이 있으면 안내
      if (!duplicateWarningShown && hospital && date && allPrescriptions.length > 0) {
        const duplicate = allPrescriptions.find(
          (p) =>
            String(p.id) !== prescriptionId &&
            p.hospitalName === hospital &&
            p.prescribedAt === date
        );
        if (duplicate) {
          setDuplicateWarningShown(true);
          customAlert(
            t('prescription:duplicate_title'),
            t('prescription:duplicate_desc', { hospital, date }),
            [{ text: t('common:confirm') }]
          );
        }
      }
    }
    if (prescription?.ocrStatus === 'FAILED' || isOcrTimedOut) {
      setMedications((prev) => (prev.length === 0 ? [newMedication()] : prev));
    }
  }, [prescription?.ocrStatus, allPrescriptions.length, isOcrTimedOut]);

  const handleChangeMed = (index: number, field: keyof EditableMedication, value: string) => {
    setMedications((prev) =>
      prev.map((m, i) => (i === index ? { ...m, [field]: value } : m))
    );
  };

  const handleAddMed = () => setMedications((prev) => [...prev, newMedication()]);

  const handleRemoveMed = (index: number) => {
    if (medications.length === 1) return;
    setMedications((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSave = () => {
    if (!isPremium) {
      customAlert(
        t('prescription:save_premium_only'),
        t('prescription:save_premium_desc'),
        [
          { text: t('common:cancel'), style: 'cancel' },
          { text: t('common:upgrade'), onPress: () => (navigation as any).navigate('Paywall') },
        ]
      );
      return;
    }
    const invalid = medications.some((m) => !m.medicationName.trim());
    if (invalid) {
      customAlert(t('prescription:input_error'), t('prescription:drug_name_required'));
      return;
    }

    const unreviewed = medications.filter((m) => !reviewedKeys.has(m.key));
    if (unreviewed.length > 0) {
      customAlert(
        t('prescription:review_required_title'),
        t('prescription:review_required_desc', { count: unreviewed.length }),
        [{ text: t('common:confirm') }]
      );
      return;
    }

    savePrescription(
      {
        id: prescriptionId,
        data: {
          hospitalName: hospitalName.trim() || undefined,
          prescribedAt: prescribedAt || undefined,
          medications: medications.map((m) => ({
            medicationName: m.medicationName.trim(),
            dosage: m.dosage.trim() || undefined,
            singleDose: m.singleDose.trim() || undefined,
            frequency: m.frequency.trim() || undefined,
            durationDays: m.durationDays ? Number(m.durationDays) : undefined,
          })),
        },
      },
      {
        onSuccess: () => {
          savedRef.current = true;
          showMedicationSetupDialog();
        },
      }
    );
  };

  const showMedicationSetupDialog = () => {
    // 백엔드가 처방전 약품을 복약 일정에 자동 등록 — 시간 슬롯 조정이 필요하면 일정 화면에서 편집.
    const goPrescriptionList = () =>
      navigation.dispatch(
        CommonActions.reset({ index: 1, routes: [{ name: 'MedicationHome' }, { name: 'PrescriptionList' }] })
      );

    const hasMeds = medications.some((m) => m.medicationName.trim());
    if (!hasMeds) {
      goPrescriptionList();
      return;
    }

    customAlert(
      t('prescription:auto_scheduled_title'),
      t('prescription:auto_scheduled_desc'),
      [
        { text: t('common:confirm'), onPress: goPrescriptionList },
        {
          text: t('prescription:auto_scheduled_go'),
          onPress: () =>
            navigation.dispatch(CommonActions.reset({ index: 0, routes: [{ name: 'MedicationHome' }] })),
        },
      ]
    );
  };

  const ocrStatus = prescription?.ocrStatus;
  // 90초 내 OCR 완료/실패 미도달 시 FAILED 로 간주 (서버가 hang 하거나 재배포 좀비 상태 대응)
  const effectiveStatus =
    isOcrTimedOut && ocrStatus !== 'COMPLETED' && ocrStatus !== 'FAILED' ? 'FAILED' : ocrStatus;
  const showEditor = effectiveStatus === 'COMPLETED' || effectiveStatus === 'FAILED' || editMode;

  return (
    <SafeAreaView style={[staticStyles.container, { backgroundColor: colors.background }]}>
      <ScreenHeader
        variant="back"
        title={t('prescription:ocr_title')}
        rightContent={
          showEditor ? (
            <TouchableOpacity onPress={handleSave} disabled={isSaving} hitSlop={12}>
              <Text
                style={[
                  staticStyles.saveBtn,
                  { fontFamily: fontFamily.semibold, color: colors.primary },
                  isSaving && staticStyles.saveBtnDisabled,
                ]}
              >
                {isSaving ? t('prescription:save_btn_saving') : t('prescription:save_btn')}
              </Text>
            </TouchableOpacity>
          ) : undefined
        }
      />

      {isLoading ||
      ((effectiveStatus === 'PENDING' || effectiveStatus === 'PROCESSING') && !editMode) ? (
        <PendingView colors={colors} imageUrl={prescription?.imageUrl} />
      ) : effectiveStatus === 'FAILED' && !editMode ? (
        <FailedView onRetry={handleRetry} isRetrying={isRetrying} onManualEntry={() => setEditMode(true)} colors={colors} />
      ) : (
        <ScrollView contentContainerStyle={staticStyles.content} keyboardShouldPersistTaps="handled">
          {/* 처방전 사진 */}
          {prescription?.imageUrl ? (
            <Image
              source={{ uri: prescription.imageUrl }}
              style={[staticStyles.prescriptionImage, { borderColor: colors.divider }]}
              resizeMode="contain"
            />
          ) : null}

          {/* 기본 정보 */}
          <View style={staticStyles.section}>
            <Text style={[staticStyles.sectionTitle, { fontFamily: fontFamily.bold, color: colors.text }]}>
              {t('prescription:basic_info')}
            </Text>
            <TextInput
              style={[staticStyles.input, { backgroundColor: colors.surface, borderColor: colors.divider, color: colors.text }]}
              placeholder={t('prescription:hospital_name')}
              placeholderTextColor={colors.textDisabled}
              value={hospitalName}
              onChangeText={setHospitalName}
            />
            <TextInput
              style={[staticStyles.input, { backgroundColor: colors.surface, borderColor: colors.divider, color: colors.text }]}
              placeholder={t('prescription:prescribed_at')}
              placeholderTextColor={colors.textDisabled}
              value={prescribedAt}
              onChangeText={setPrescribedAt}
            />
          </View>

          {/* 약품 목록 */}
          <View style={staticStyles.section}>
            <View style={staticStyles.sectionTitleRow}>
              <Text style={[staticStyles.sectionTitle, { fontFamily: fontFamily.bold, color: colors.text }]}>
                {t('prescription:medication_list')}
              </Text>
              <Text
                style={[
                  staticStyles.sectionCount,
                  { color: colors.textSub, backgroundColor: colors.divider },
                ]}
              >
                {t('prescription:medication_count', { count: medications.length })}
              </Text>
            </View>

            {medications.map((med, index) => (
              <MedicationRow
                key={med.key}
                item={med}
                index={index}
                isReviewed={reviewedKeys.has(med.key)}
                onChange={handleChangeMed}
                onRemove={handleRemoveMed}
                onToggleReview={toggleReview}
                colors={colors}
              />
            ))}

            <TouchableOpacity
              style={[staticStyles.addMedBtn, { borderColor: colors.secondary }]}
              onPress={handleAddMed}
              activeOpacity={0.8}
            >
              <Text style={[staticStyles.addMedBtnText, { fontFamily: fontFamily.semibold, color: colors.secondary }]}>
                {t('prescription:add_medication')}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

const staticStyles = StyleSheet.create({
  container: { flex: 1 },
  saveBtn: { fontSize: sizes.font.md },
  saveBtnDisabled: { opacity: 0.4 },
  // 상태 화면
  statusWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: sizes.spacing.md,
    padding: sizes.spacing.xl,
  },
  failIcon: { fontSize: 48 },
  statusTitle: {
    fontSize: sizes.font.lg,
    textAlign: 'center',
  },
  statusSub: {
    fontSize: sizes.font.md,
    textAlign: 'center',
  },
  // 진행 바
  progressTrack: {
    width: '100%',
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
    marginTop: sizes.spacing.sm,
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  failedActions: {
    flexDirection: 'row',
    gap: sizes.spacing.sm,
    marginTop: sizes.spacing.sm,
  },
  failedBtn: {
    flex: 1,
    borderRadius: sizes.radius.md,
    paddingVertical: sizes.spacing.md,
    alignItems: 'center',
  },
  failedBtnText: { fontSize: sizes.font.md },
  // 편집기
  content: { padding: sizes.spacing.lg, gap: sizes.spacing.lg, paddingBottom: 40 },
  section: { gap: sizes.spacing.md },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: sizes.spacing.sm },
  sectionTitle: { fontSize: sizes.font.md },
  sectionCount: {
    fontSize: sizes.font.sm,
    paddingHorizontal: sizes.spacing.sm,
    paddingVertical: 2,
    borderRadius: sizes.radius.full,
  },
  input: {
    borderWidth: 1,
    borderRadius: sizes.radius.md,
    paddingHorizontal: sizes.spacing.md,
    paddingVertical: sizes.spacing.md,
    fontSize: sizes.font.md,
  },
  // 약품 행
  medRow: {
    borderRadius: sizes.radius.lg,
    padding: sizes.spacing.md,
    gap: sizes.spacing.sm,
    borderWidth: 1,
  },
  medRowHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  medRowIndex: { fontSize: sizes.font.sm },
  removeBtn: { fontSize: sizes.font.md, padding: 2 },
  medInput: {
    borderWidth: 1,
    borderRadius: sizes.radius.sm,
    paddingHorizontal: sizes.spacing.sm,
    paddingVertical: sizes.spacing.sm,
    fontSize: sizes.font.sm,
  },
  medInputRow: { flexDirection: 'row', gap: sizes.spacing.sm },
  medInputHalf: { flex: 1 },
  medInputShort: { width: 140 },
  reviewToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-end',
    paddingHorizontal: sizes.spacing.md,
    paddingVertical: sizes.spacing.xs + 2,
    borderRadius: sizes.radius.full,
    borderWidth: 1,
    marginTop: sizes.spacing.xs,
  },
  reviewToggleText: {
    fontSize: sizes.font.sm,
    fontFamily: fontFamily.medium,
  },
  addMedBtn: {
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderRadius: sizes.radius.md,
    paddingVertical: sizes.spacing.md,
    alignItems: 'center',
  },
  addMedBtnText: { fontSize: sizes.font.md },
  // 처방전 사진 (대기 화면)
  pendingThumbnail: {
    width: '100%',
    height: THUMB_HEIGHT,
    borderRadius: sizes.radius.lg,
    borderWidth: 1,
    marginBottom: sizes.spacing.sm,
  },
  scanLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 3,
    borderRadius: 2,
    opacity: 0.85,
  },
  prescriptionImage: {
    width: '100%',
    height: 260,
    borderRadius: sizes.radius.lg,
    borderWidth: 1,
  },
});
