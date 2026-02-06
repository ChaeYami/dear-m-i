import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,

  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { CompositeNavigationProp } from '@react-navigation/native';
import { useTheme, sizes, fontFamily } from '@/shared/theme';
import { ScreenHeader } from '@/shared/components/ScreenHeader';
import {
  usePrescriptionDetail,
  useSavePrescription,
} from '@/features/prescription/hooks/usePrescription';
import { useAuthStore } from '@/features/auth/store/authStore';
import type { PrescriptionStackParamList } from '@/navigation/PrescriptionNavigator';
import type { RootStackParamList } from '@/navigation/RootNavigator';

type Nav = CompositeNavigationProp<
  StackNavigationProp<PrescriptionStackParamList, 'OcrResult'>,
  StackNavigationProp<RootStackParamList>
>;
type Route = RouteProp<PrescriptionStackParamList, 'OcrResult'>;

// ─── 편집 가능한 약품 항목 타입 ───────────────────────────────────────────────

interface EditableMedication {
  key: string; // FlatList key (id or temp key)
  medicationName: string;
  dosage: string;
  frequency: string;
  durationDays: string;
}

let tempKeyCounter = 0;
const newMedication = (): EditableMedication => ({
  key: `new-${++tempKeyCounter}`,
  medicationName: '',
  dosage: '',
  frequency: '',
  durationDays: '',
});

// ─── 상태별 UI ────────────────────────────────────────────────────────────────

const PendingView: React.FC<{ colors: ReturnType<typeof useTheme>['colors'] }> = ({ colors }) => (
  <View style={staticStyles.statusWrap}>
    <ActivityIndicator size="large" color={colors.primary} />
    <Text style={[staticStyles.statusTitle, { fontFamily: fontFamily.bold, color: colors.text }]}>
      처방전을 분석 중입니다…
    </Text>
    <Text style={[staticStyles.statusSub, { color: colors.textSub }]}>잠시만 기다려 주세요</Text>
  </View>
);

const FailedView: React.FC<{
  onManualEntry: () => void;
  colors: ReturnType<typeof useTheme>['colors'];
}> = ({ onManualEntry, colors }) => (
  <View style={staticStyles.statusWrap}>
    <Text style={staticStyles.failIcon}>⚠️</Text>
    <Text style={[staticStyles.statusTitle, { fontFamily: fontFamily.bold, color: colors.text }]}>
      자동 인식에 실패했습니다
    </Text>
    <Text style={[staticStyles.statusSub, { color: colors.textSub }]}>
      직접 입력해서 저장할 수 있어요
    </Text>
    <TouchableOpacity
      style={[staticStyles.manualEntryBtn, { backgroundColor: colors.primary }]}
      onPress={onManualEntry}
      activeOpacity={0.8}
    >
      <Text style={[staticStyles.manualEntryBtnText, { fontFamily: fontFamily.semibold, color: colors.textInverse }]}>
        직접 입력하기
      </Text>
    </TouchableOpacity>
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
        placeholder="용법 (예: 1일 2회)"
        placeholderTextColor={colors.textDisabled}
        value={item.frequency}
        onChangeText={(v) => onChange(index, 'frequency', v)}
      />
    </View>
    <TextInput
      style={[staticStyles.medInput, staticStyles.medInputShort, { backgroundColor: colors.background, borderColor: colors.divider, color: colors.text }]}
      placeholder="투약일수 (예: 7)"
      placeholderTextColor={colors.textDisabled}
      value={item.durationDays}
      onChangeText={(v) => onChange(index, 'durationDays', v)}
      keyboardType="numeric"
    />
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

  const [hospitalName, setHospitalName] = useState('');
  const [prescribedAt, setPrescribedAt] = useState('');
  const [medications, setMedications] = useState<EditableMedication[]>([]);
  const [editMode, setEditMode] = useState(false); // FAILED → 수동 입력 모드

  // OCR COMPLETED 시 약품 목록 초기화
  useEffect(() => {
    if (prescription?.ocrStatus === 'COMPLETED') {
      setHospitalName(prescription.hospitalName ?? '');
      setPrescribedAt(prescription.prescribedAt ?? '');
      setMedications(
        prescription.medications.map((m) => ({
          key: String(m.id),
          medicationName: m.medicationName,
          dosage: m.dosage ?? '',
          frequency: m.frequency ?? '',
          durationDays: m.durationDays !== undefined ? String(m.durationDays) : '',
        }))
      );
    }
    if (prescription?.ocrStatus === 'FAILED') {
      setMedications([newMedication()]);
    }
  }, [prescription?.ocrStatus]);

  const handleChangeMed = (index: number, field: keyof EditableMedication, value: string) => {
    setMedications((prev) =>
      prev.map((m, i) => (i === index ? { ...m, [field]: value } : m))
    );
  };

  const handleAddMed = () => setMedications((prev) => [...prev, newMedication()]);

  const handleRemoveMed = (index: number) => {
    if (medications.length === 1) return; // 최소 1개 유지
    setMedications((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSave = () => {
    if (!isPremium) {
      Alert.alert(
        '프리미엄 전용',
        '처방전 저장은 프리미엄 플랜에서 이용할 수 있습니다.',
        [
          { text: '취소', style: 'cancel' },
          { text: '업그레이드', onPress: () => navigation.navigate('Paywall') },
        ]
      );
      return;
    }
    const invalid = medications.some((m) => !m.medicationName.trim());
    if (invalid) {
      Alert.alert('입력 오류', '약품명을 모두 입력해 주세요.');
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
            frequency: m.frequency.trim() || undefined,
            durationDays: m.durationDays ? Number(m.durationDays) : undefined,
          })),
        },
      },
      { onSuccess: showMedicationSetupDialog }
    );
  };

  const showMedicationSetupDialog = () => {
    const validMeds = medications
      .filter((m) => m.medicationName.trim())
      .map((m) => ({
        drugName: m.medicationName.trim(),
        dosage: m.dosage.trim() || undefined,
        totalDays: m.durationDays ? Number(m.durationDays) : undefined,
      }));

    Alert.alert(
      '복약 알림을 설정할까요?',
      '처방 약품으로 복약 알림을 설정하면\n약 먹는 시간을 놓치지 않아요.',
      [
        {
          text: '나중에',
          style: 'cancel',
          onPress: () => navigation.navigate('PrescriptionTab'),
        },
        {
          text: '설정하기',
          onPress: () => {
            if (validMeds.length === 0) {
              navigation.navigate('PrescriptionTab');
              return;
            }
            const [first, ...rest] = validMeds;
            // PrescriptionNavigator → MainTabNavigator → Medication tab
            const tabNav = navigation.getParent()?.getParent() as any;
            tabNav?.navigate('Medication', {
              screen: 'MedicationForm',
              params: {
                drugName: first.drugName,
                dosage: first.dosage,
                totalDays: first.totalDays,
                isFromOcr: true,
                remainingMeds: rest,
              },
            });
          },
        },
      ]
    );
  };

  const ocrStatus = prescription?.ocrStatus;
  const showEditor =
    ocrStatus === 'COMPLETED' || ocrStatus === 'FAILED' || editMode;

  return (
    <SafeAreaView style={[staticStyles.container, { backgroundColor: colors.background }]}>
      {/* 헤더 */}
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

      {/* 본문 */}
      {isLoading || ocrStatus === 'PENDING' || ocrStatus === 'PROCESSING' ? (
        <PendingView colors={colors} />
      ) : ocrStatus === 'FAILED' && !editMode ? (
        <FailedView onManualEntry={() => setEditMode(true)} colors={colors} />
      ) : (
        <ScrollView contentContainerStyle={staticStyles.content} keyboardShouldPersistTaps="handled">
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
  saveBtn: {
    fontSize: sizes.font.md,
  },
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
  manualEntryBtn: {
    marginTop: sizes.spacing.sm,
    borderRadius: sizes.radius.md,
    paddingVertical: sizes.spacing.md,
    paddingHorizontal: sizes.spacing.xl,
  },
  manualEntryBtnText: {
    fontSize: sizes.font.md,
  },
  // 편집기
  content: { padding: sizes.spacing.lg, gap: sizes.spacing.lg, paddingBottom: 40 },
  section: { gap: sizes.spacing.md },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: sizes.spacing.sm },
  sectionTitle: {
    fontSize: sizes.font.md,
  },
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
  medRowIndex: {
    fontSize: sizes.font.sm,
  },
  removeBtn: {
    fontSize: sizes.font.md,
    padding: 2,
  },
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
  addMedBtnText: {
    fontSize: sizes.font.md,
  },
});
