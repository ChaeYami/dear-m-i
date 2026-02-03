import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { colors, sizes } from '@/constants';
import { useMedicationDetail } from '@/features/prescription/hooks/usePrescription';
import { PremiumGate } from '@/shared/components/PremiumGate';
import type { PrescriptionStackParamList } from '@/navigation/PrescriptionNavigator';

type Nav = StackNavigationProp<PrescriptionStackParamList, 'MedicationDetail'>;
type Route = RouteProp<PrescriptionStackParamList, 'MedicationDetail'>;

// ─── 스켈레톤 ──────────────────────────────────────────────────────────────

const SkeletonBox: React.FC<{ width?: number | string; height?: number; style?: object }> = ({
  width = '100%',
  height = 16,
  style,
}) => <View style={[styles.skeleton, { width: width as any, height }, style]} />;

const SkeletonSection: React.FC = () => (
  <View style={styles.section}>
    <SkeletonBox width="40%" height={14} style={{ marginBottom: sizes.spacing.md }} />
    <SkeletonBox height={16} style={{ marginBottom: sizes.spacing.sm }} />
    <SkeletonBox height={16} style={{ marginBottom: sizes.spacing.sm }} />
    <SkeletonBox width="75%" height={16} />
  </View>
);

// ─── 섹션 컴포넌트 ────────────────────────────────────────────────────────

const Section: React.FC<{
  title: string;
  children: React.ReactNode;
  warning?: boolean;
}> = ({ title, children, warning }) => (
  <View style={[styles.section, warning && styles.sectionWarning]}>
    <View style={[styles.sectionTitleRow, warning && styles.sectionTitleRowWarning]}>
      {warning && <Text style={styles.warningIcon}>⚠️</Text>}
      <Text style={[styles.sectionTitle, warning && styles.sectionTitleWarning]}>{title}</Text>
    </View>
    {children}
  </View>
);

const InfoRow: React.FC<{ label: string; value?: string | number }> = ({ label, value }) => (
  <View style={styles.infoRow}>
    <Text style={styles.infoLabel}>{label}</Text>
    <Text style={styles.infoValue}>{value ?? '—'}</Text>
  </View>
);

// ─── 메인 화면 ────────────────────────────────────────────────────────────

export const MedicationDetailScreen: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const { medicationId, medicationName } = useRoute<Route>().params;

  const { data: med, isLoading } = useMedicationDetail(medicationId);

  const isDrugInfoPending = !isLoading && med && !med.drugInfoFetchedAt;

  return (
    <SafeAreaView style={styles.container}>
      {/* 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={12}>
          <Ionicons name="chevron-back" size={24} color={colors.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {med?.medicationName ?? medicationName}
        </Text>
        <View style={{ width: 48 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {isLoading ? (
          <>
            <SkeletonSection />
            <SkeletonSection />
            <SkeletonSection />
          </>
        ) : !med ? (
          <View style={styles.errorWrap}>
            <Text style={styles.errorText}>약품 정보를 불러올 수 없습니다.</Text>
          </View>
        ) : (
          <>
            {/* 1. 약품명 + 제조사 */}
            <Section title="약품 정보">
              <Text style={styles.medNameLarge}>{med.medicationName}</Text>
              {med.manufacturer && (
                <Text style={styles.manufacturer}>{med.manufacturer}</Text>
              )}
            </Section>

            {/* 2. 처방 정보 */}
            <Section title="처방 정보">
              <InfoRow label="용량" value={med.dosage} />
              <InfoRow label="용법" value={med.frequency} />
              <InfoRow
                label="투약일수"
                value={med.durationDays !== undefined ? `${med.durationDays}일` : undefined}
              />
            </Section>

            {/* 3. 효능/효과 */}
            <PremiumGate message="약품 효능·주의사항은 프리미엄 플랜에서 이용할 수 있어요">
              <Section title="효능·효과">
                {isDrugInfoPending ? (
                  <>
                    <Text style={styles.fetchingText}>약품 정보를 불러오는 중입니다…</Text>
                    <SkeletonBox height={14} style={{ marginTop: sizes.spacing.sm }} />
                    <SkeletonBox height={14} width="85%" style={{ marginTop: sizes.spacing.sm }} />
                    <SkeletonBox height={14} width="70%" style={{ marginTop: sizes.spacing.sm }} />
                  </>
                ) : med.drugEffect ? (
                  <Text style={styles.bodyText}>{med.drugEffect}</Text>
                ) : (
                  <Text style={styles.emptyFieldText}>정보 없음</Text>
                )}
              </Section>

              {/* 4. 주의사항 — 경고 스타일 */}
              <Section title="주의사항" warning>
                {isDrugInfoPending ? (
                  <>
                    <Text style={styles.fetchingText}>약품 정보를 불러오는 중입니다…</Text>
                    <SkeletonBox height={14} style={{ marginTop: sizes.spacing.sm }} />
                    <SkeletonBox height={14} width="90%" style={{ marginTop: sizes.spacing.sm }} />
                  </>
                ) : med.drugCaution ? (
                  <Text style={styles.bodyText}>{med.drugCaution}</Text>
                ) : (
                  <Text style={styles.emptyFieldText}>정보 없음</Text>
                )}
              </Section>
            </PremiumGate>

            {/* 마지막 조회 시각 */}
            {med.drugInfoFetchedAt && (
              <Text style={styles.fetchedAt}>
                약품 정보 최종 조회: {new Date(med.drugInfoFetchedAt).toLocaleDateString('ko-KR')}
              </Text>
            )}
          </>
        )}
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
    paddingHorizontal: sizes.spacing.lg,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  backBtn: {
    fontSize: sizes.font.md,
    color: colors.primary,
    fontWeight: sizes.fontWeight.medium,
    width: 48,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: sizes.font.lg,
    fontWeight: sizes.fontWeight.bold,
    color: colors.text,
  },
  content: { padding: sizes.spacing.lg, gap: sizes.spacing.lg, paddingBottom: 40 },
  // 섹션
  section: {
    backgroundColor: colors.surface,
    borderRadius: sizes.radius.lg,
    padding: sizes.spacing.lg,
    borderWidth: 1,
    borderColor: colors.divider,
    gap: sizes.spacing.sm,
  },
  sectionWarning: {
    borderColor: colors.error + '66',
    backgroundColor: colors.errorLight,
  },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: sizes.spacing.xs },
  sectionTitleRowWarning: {},
  warningIcon: { fontSize: 14 },
  sectionTitle: {
    fontSize: sizes.font.sm,
    fontWeight: sizes.fontWeight.bold,
    color: colors.textSub,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sectionTitleWarning: { color: colors.error },
  // 약품명
  medNameLarge: {
    fontSize: sizes.font.xl,
    fontWeight: sizes.fontWeight.bold,
    color: colors.text,
  },
  manufacturer: {
    fontSize: sizes.font.sm,
    color: colors.textSub,
  },
  // 처방 정보 행
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 2,
  },
  infoLabel: {
    fontSize: sizes.font.sm,
    color: colors.textSub,
    fontWeight: sizes.fontWeight.medium,
    minWidth: 60,
  },
  infoValue: {
    fontSize: sizes.font.md,
    color: colors.text,
    flex: 1,
    textAlign: 'right',
  },
  // 본문
  bodyText: {
    fontSize: sizes.font.sm,
    color: colors.text,
    lineHeight: 22,
  },
  emptyFieldText: {
    fontSize: sizes.font.sm,
    color: colors.textDisabled,
    fontStyle: 'italic',
  },
  fetchingText: {
    fontSize: sizes.font.sm,
    color: colors.textSub,
    fontStyle: 'italic',
  },
  fetchedAt: {
    fontSize: sizes.font.xs,
    color: colors.textDisabled,
    textAlign: 'center',
    marginTop: -sizes.spacing.sm,
  },
  // 스켈레톤
  skeleton: {
    backgroundColor: colors.skeleton,
    borderRadius: sizes.radius.sm,
  },
  // 에러
  errorWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 60 },
  errorText: { fontSize: sizes.font.md, color: colors.textSub },
});
