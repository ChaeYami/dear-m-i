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
import { useNavigation, useRoute, RouteProp, CommonActions } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { customAlert } from '@/shared/components/CustomAlert';
import { useTheme, sizes, fontFamily } from '@/shared/theme';
import { ScreenHeader } from '@/shared/components/ScreenHeader';
import {
  usePrescriptionDetail,
  useSavePrescription,
  usePrescriptions,
  useRetryOcr,
} from '@/features/prescription/hooks/usePrescription';
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

// ─── OCR 대기 화면 (진행 바 포함) ────────────────────────────────────────────

const PendingView: React.FC<{
  colors: ReturnType<typeof useTheme>['colors'];
  imageUrl?: string;
}> = ({ colors, imageUrl }) => {
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // 45초 동안 0 → 85% 로 애니메이션
    Animated.timing(progress, {
      toValue: 85,
      duration: 45000,
      useNativeDriver: false,
    }).start();
    return () => progress.stopAnimation();
  }, []);

  const widthInterpolated = progress.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={staticStyles.statusWrap}>
      {imageUrl ? (
        <Image
          source={{ uri: imageUrl }}
          style={[staticStyles.pendingThumbnail, { borderColor: colors.divider }]}
          resizeMode="contain"
        />
      ) : null}
      <ActivityIndicator size="large" color={colors.primary} />
      <Text style={[staticStyles.statusTitle, { fontFamily: fontFamily.bold, color: colors.text }]}>
        처방전을 분석 중입니다…
      </Text>
      <Text style={[staticStyles.statusSub, { color: colors.textSub }]}>잠시만 기다려 주세요</Text>

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
}> = ({ onRetry, onManualEntry, isRetrying, colors }) => (
  <View style={staticStyles.statusWrap}>
    <Text style={staticStyles.failIcon}>⚠️</Text>
    <Text style={[staticStyles.statusTitle, { fontFamily: fontFamily.bold, color: colors.text }]}>
      자동 인식에 실패했습니다
    </Text>
    <Text style={[staticStyles.statusSub, { color: colors.textSub }]}>
      일시적인 오류일 수 있어요. 재시도하거나 직접 입력할 수 있어요.
    </Text>
    <View style={staticStyles.failedActions}>
      <TouchableOpacity
        style={[staticStyles.failedBtn, { backgroundColor: colors.primary }]}
        onPress={onRetry}
        disabled={isRetrying}
        activeOpacity={0.8}
      >
        <Text style={[staticStyles.failedBtnText, { fontFamily: fontFamily.semibold, color: colors.textInverse }]}>
          {isRetrying ? '재시도 중…' : '재시도'}
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[staticStyles.failedBtn, { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.divider }]}
        onPress={onManualEntry}
        disabled={isRetrying}
        activeOpacity={0.8}
      >
        <Text style={[staticStyles.failedBtnText, { fontFamily: fontFamily.semibold, color: colors.text }]}>
          직접 입력하기
        </Text>
      </TouchableOpacity>
    </View>
  </View>
);

// ─── 약품 편집 행 ─────────────────────────────────────────────────────────────

const MedicationRow: React.FC<{
  item: EditableMedication;
  index: number;
  onChange: (index: number, field: keyof EditableMedication, value: string) => void;
  onRemove: (index: number) => void;
  colors: ReturnType<typeof useTheme>['colors'];
}> = ({ item, index, onChange, onRemove, colors }) => (
  <View style={[staticStyles.medRow, { backgroundColor: colors.surface, borderColor: colors.divider }]}>
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
      placeholder="약품명 *"
      placeholderTextColor={colors.textDisabled}
      value={item.medicationName}
      onChangeText={(v) => onChange(index, 'medicationName', v)}
    />
    <View style={staticStyles.medInputRow}>
      <TextInput
        style={[staticStyles.medInput, staticStyles.medInputHalf, { backgroundColor: colors.background, borderColor: colors.divider, color: colors.text }]}
        placeholder="용량 (예: 10mg)"
        placeholderTextColor={colors.textDisabled}
        value={item.dosage}
        onChangeText={(v) => onChange(index, 'dosage', v)}
      />
      <TextInput
        style={[staticStyles.medInput, staticStyles.medInputHalf, { backgroundColor: colors.background, borderColor: colors.divider, color: colors.text }]}
        placeholder="1회 투여량 (예: 1정)"
        placeholderTextColor={colors.textDisabled}
        value={item.singleDose}
        onChangeText={(v) => onChange(index, 'singleDose', v)}
      />
    </View>
    <View style={staticStyles.medInputRow}>
      <TextInput
        style={[staticStyles.medInput, staticStyles.medInputHalf, { backgroundColor: colors.background, borderColor: colors.divider, color: colors.text }]}
        placeholder="용법 (예: 1일 2회)"
        placeholderTextColor={colors.textDisabled}
        value={item.frequency}
        onChangeText={(v) => onChange(index, 'frequency', v)}
      />
      <TextInput
        style={[staticStyles.medInput, staticStyles.medInputShort, { backgroundColor: colors.background, borderColor: colors.divider, color: colors.text }]}
        placeholder="투약일수 (예: 7)"
        placeholderTextColor={colors.textDisabled}
        value={item.durationDays}
        onChangeText={(v) => onChange(index, 'durationDays', v)}
        keyboardType="numeric"
      />
    </View>
  </View>
);

// ─── 메인 화면 ────────────────────────────────────────────────────────────────

export const OcrResultScreen: React.FC = () => {
  const { colors } = useTheme();
  const navigation = useNavigation<Nav>();
  const { prescriptionId } = useRoute<Route>().params;

  const isPremium = useAuthStore((s) => s.user?.plan === 'PREMIUM');

  const { data: prescription, isLoading } = usePrescriptionDetail(prescriptionId, true);
  const { mutate: savePrescription, isPending: isSaving } = useSavePrescription();
  const { mutate: retryOcr, isPending: isRetrying } = useRetryOcr();
  const handleRetry = () => retryOcr(prescriptionId);
  const { data: allPrescriptions = [] } = usePrescriptions();

  const [hospitalName, setHospitalName] = useState('');
  const [prescribedAt, setPrescribedAt] = useState('');
  const [medications, setMedications] = useState<EditableMedication[]>([]);
  const [editMode, setEditMode] = useState(false);
  const [duplicateWarningShown, setDuplicateWarningShown] = useState(false);

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
            '동일한 처방전이 있어요',
            `${hospital}의 ${date} 처방전이 이미 등록되어 있어요.\n중복 등록이 아닌지 확인해 주세요.`,
            [{ text: '확인' }]
          );
        }
      }
    }
    if (prescription?.ocrStatus === 'FAILED') {
      setMedications([newMedication()]);
    }
  }, [prescription?.ocrStatus, allPrescriptions.length]);

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
        '프리미엄 전용',
        '처방전 저장은 프리미엄 플랜에서 이용할 수 있습니다.',
        [
          { text: '취소', style: 'cancel' },
          { text: '업그레이드', onPress: () => (navigation as any).navigate('Paywall') },
        ]
      );
      return;
    }
    const invalid = medications.some((m) => !m.medicationName.trim());
    if (invalid) {
      customAlert('입력 오류', '약품명을 모두 입력해 주세요.');
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
      { onSuccess: showMedicationSetupDialog }
    );
  };

  const showMedicationSetupDialog = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const activeMeds = medications
      .filter((m) => m.medicationName.trim())
      .map((m) => ({
        drugName: m.medicationName.trim(),
        dosage: m.dosage.trim() || undefined,
        singleDose: m.singleDose.trim() || undefined,
        totalDays: m.durationDays ? Number(m.durationDays) : undefined,
      }))
      .filter((m) => {
        if (!prescribedAt || !m.totalDays) return true;
        const start = new Date(prescribedAt + 'T00:00:00');
        const end = new Date(start);
        end.setDate(end.getDate() + m.totalDays - 1);
        return end >= today;
      });

    if (activeMeds.length === 0) {
      navigation.dispatch(CommonActions.reset({ index: 1, routes: [{ name: 'MedicationHome' }, { name: 'PrescriptionList' }] }));
      return;
    }

    customAlert(
      '복약 알림을 설정할까요?',
      '처방 약품으로 복약 알림을 설정하면\n약 먹는 시간을 놓치지 않아요.',
      [
        {
          text: '나중에',
          style: 'cancel',
          onPress: () => navigation.dispatch(CommonActions.reset({ index: 1, routes: [{ name: 'MedicationHome' }, { name: 'PrescriptionList' }] })),
        },
        {
          text: '설정하기',
          onPress: () => {
            const [first, ...rest] = activeMeds;
            navigation.navigate('MedicationForm', {
              drugName: first.drugName,
              dosage: first.dosage,
              singleDose: first.singleDose,
              totalDays: first.totalDays,
              startDate: prescribedAt || undefined,
              isFromOcr: true,
              remainingMeds: rest,
            });
          },
        },
      ]
    );
  };

  const ocrStatus = prescription?.ocrStatus;
  const showEditor = ocrStatus === 'COMPLETED' || ocrStatus === 'FAILED' || editMode;

  return (
    <SafeAreaView style={[staticStyles.container, { backgroundColor: colors.background }]}>
      <ScreenHeader
        variant="back"
        title="자동 인식 결과"
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
                {isSaving ? '저장 중…' : '저장'}
              </Text>
            </TouchableOpacity>
          ) : undefined
        }
      />

      {isLoading || ocrStatus === 'PENDING' || ocrStatus === 'PROCESSING' ? (
        <PendingView colors={colors} imageUrl={prescription?.imageUrl} />
      ) : ocrStatus === 'FAILED' && !editMode ? (
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
              기본 정보
            </Text>
            <TextInput
              style={[staticStyles.input, { backgroundColor: colors.surface, borderColor: colors.divider, color: colors.text }]}
              placeholder="병원명 (선택)"
              placeholderTextColor={colors.textDisabled}
              value={hospitalName}
              onChangeText={setHospitalName}
            />
            <TextInput
              style={[staticStyles.input, { backgroundColor: colors.surface, borderColor: colors.divider, color: colors.text }]}
              placeholder="처방일 (예: 2025-01-15)"
              placeholderTextColor={colors.textDisabled}
              value={prescribedAt}
              onChangeText={setPrescribedAt}
            />
          </View>

          {/* 약품 목록 */}
          <View style={staticStyles.section}>
            <View style={staticStyles.sectionTitleRow}>
              <Text style={[staticStyles.sectionTitle, { fontFamily: fontFamily.bold, color: colors.text }]}>
                약품 목록
              </Text>
              <Text
                style={[
                  staticStyles.sectionCount,
                  { color: colors.textSub, backgroundColor: colors.divider },
                ]}
              >
                {medications.length}종
              </Text>
            </View>

            {medications.map((med, index) => (
              <MedicationRow
                key={med.key}
                item={med}
                index={index}
                onChange={handleChangeMed}
                onRemove={handleRemoveMed}
                colors={colors}
              />
            ))}

            <TouchableOpacity
              style={[staticStyles.addMedBtn, { borderColor: colors.secondary }]}
              onPress={handleAddMed}
              activeOpacity={0.8}
            >
              <Text style={[staticStyles.addMedBtnText, { fontFamily: fontFamily.semibold, color: colors.secondary }]}>
                + 약품 추가
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
  addMedBtn: {
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderRadius: sizes.radius.md,
    paddingVertical: sizes.spacing.md,
    alignItems: 'center',
  },
  addMedBtnText: { fontSize: sizes.font.md },
  // 처방전 사진
  pendingThumbnail: {
    width: '100%',
    height: 200,
    borderRadius: sizes.radius.lg,
    borderWidth: 1,
    marginBottom: sizes.spacing.sm,
  },
  prescriptionImage: {
    width: '100%',
    height: 260,
    borderRadius: sizes.radius.lg,
    borderWidth: 1,
  },
});
