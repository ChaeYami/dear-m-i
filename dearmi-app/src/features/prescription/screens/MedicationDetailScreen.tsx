import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,

} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { useTheme, sizes, fontFamily } from '@/shared/theme';
import { useMedicationDetail } from '@/features/prescription/hooks/usePrescription';
import { PremiumGate } from '@/shared/components/PremiumGate';
import type { PrescriptionStackParamList } from '@/navigation/PrescriptionNavigator';

type Nav = StackNavigationProp<PrescriptionStackParamList, 'MedicationDetail'>;
type Route = RouteProp<PrescriptionStackParamList, 'MedicationDetail'>;

// ─── 스켈레톤 ──────────────────────────────────────────────────────────────

const SkeletonBox: React.FC<{
  width?: number | string;
  height?: number;
  style?: object;
  colors: ReturnType<typeof useTheme>['colors'];
}> = ({ width = '100%', height = 16, style, colors }) => (
  <View
    style={[
      staticStyles.skeleton,
      { width: width as any, height, backgroundColor: colors.skeleton },
      style,
    ]}
  />
);

const SkeletonSection: React.FC<{ colors: ReturnType<typeof useTheme>['colors'] }> = ({ colors }) => (
  <View style={[staticStyles.section, { backgroundColor: colors.surface, borderColor: colors.divider }]}>
    <SkeletonBox width="40%" height={14} style={{ marginBottom: sizes.spacing.md }} colors={colors} />
    <SkeletonBox height={16} style={{ marginBottom: sizes.spacing.sm }} colors={colors} />
    <SkeletonBox height={16} style={{ marginBottom: sizes.spacing.sm }} colors={colors} />
    <SkeletonBox width="75%" height={16} colors={colors} />
  </View>
);

// ─── 섹션 컴포넌트 ────────────────────────────────────────────────────────

const Section: React.FC<{
  title: string;
  children: React.ReactNode;
  warning?: boolean;
  colors: ReturnType<typeof useTheme>['colors'];
}> = ({ title, children, warning, colors }) => (
  <View
    style={[
      staticStyles.section,
      { backgroundColor: colors.surface, borderColor: colors.divider },
      warning && { borderColor: colors.error + '66', backgroundColor: colors.errorLight },
    ]}
  >
    <View style={staticStyles.sectionTitleRow}>
      {warning && <Text style={staticStyles.warningIcon}>⚠️</Text>}
      <Text
        style={[
          staticStyles.sectionTitle,
          { fontFamily: fontFamily.bold, color: colors.textSub },
          warning && { color: colors.error },
        ]}
      >
        {title}
      </Text>
    </View>
    {children}
  </View>
);

const InfoRow: React.FC<{
  label: string;
  value?: string | number;
  colors: ReturnType<typeof useTheme>['colors'];
}> = ({ label, value, colors }) => (
  <View style={staticStyles.infoRow}>
    <Text style={[staticStyles.infoLabel, { fontFamily: fontFamily.medium, color: colors.textSub }]}>
      {label}
    </Text>
    <Text style={[staticStyles.infoValue, { color: colors.text }]}>{value ?? '—'}</Text>
  </View>
);

// ─── 메인 화면 ────────────────────────────────────────────────────────────

export const MedicationDetailScreen: React.FC = () => {
  const { colors } = useTheme();
  const navigation = useNavigation<Nav>();
  const { medicationId, medicationName } = useRoute<Route>().params;

  const { data: med, isLoading } = useMedicationDetail(medicationId);

  const isDrugInfoPending = !isLoading && med && !med.drugInfoFetchedAt;

  return (
    <SafeAreaView style={[staticStyles.container, { backgroundColor: colors.background }]}>
      {/* 헤더 */}
      <View style={staticStyles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={12}>
          <Ionicons name="chevron-back" size={24} color={colors.primary} />
        </TouchableOpacity>
        <Text style={[staticStyles.headerTitle, { fontFamily: fontFamily.bold, color: colors.text }]} numberOfLines={1}>
          {med?.medicationName ?? medicationName}
        </Text>
        <View style={{ width: 48 }} />
      </View>

      <ScrollView contentContainerStyle={staticStyles.content}>
        {isLoading ? (
          <>
            <SkeletonSection colors={colors} />
            <SkeletonSection colors={colors} />
            <SkeletonSection colors={colors} />
          </>
        ) : !med ? (
          <View style={staticStyles.errorWrap}>
            <Text style={[staticStyles.errorText, { color: colors.textSub }]}>
              약품 정보를 불러올 수 없습니다.
            </Text>
          </View>
        ) : (
          <>
            {/* 1. 약품명 + 제조사 */}
            <Section title="약품 정보" colors={colors}>
              <Text style={[staticStyles.medNameLarge, { fontFamily: fontFamily.bold, color: colors.text }]}>
                {med.medicationName}
              </Text>
              {med.manufacturer && (
                <Text style={[staticStyles.manufacturer, { color: colors.textSub }]}>
                  {med.manufacturer}
                </Text>
              )}
            </Section>

            {/* 2. 처방 정보 */}
            <Section title="처방 정보" colors={colors}>
              <InfoRow label="용량" value={med.dosage} colors={colors} />
              <InfoRow label="용법" value={med.frequency} colors={colors} />
              <InfoRow
                label="투약일수"
                value={med.durationDays !== undefined ? `${med.durationDays}일` : undefined}
                colors={colors}
              />
            </Section>

            {/* 3. 효능/효과 */}
            <PremiumGate message="약품 효능·주의사항은 프리미엄 플랜에서 이용할 수 있어요">
              <Section title="효능·효과" colors={colors}>
                {isDrugInfoPending ? (
                  <>
                    <Text style={[staticStyles.fetchingText, { color: colors.textSub }]}>
                      약품 정보를 불러오는 중입니다…
                    </Text>
                    <SkeletonBox height={14} style={{ marginTop: sizes.spacing.sm }} colors={colors} />
                    <SkeletonBox height={14} width="85%" style={{ marginTop: sizes.spacing.sm }} colors={colors} />
                    <SkeletonBox height={14} width="70%" style={{ marginTop: sizes.spacing.sm }} colors={colors} />
                  </>
                ) : med.drugEffect ? (
                  <Text style={[staticStyles.bodyText, { color: colors.text }]}>{med.drugEffect}</Text>
                ) : (
                  <Text style={[staticStyles.emptyFieldText, { color: colors.textDisabled }]}>정보 없음</Text>
                )}
              </Section>

              {/* 4. 주의사항 — 경고 스타일 */}
              <Section title="주의사항" warning colors={colors}>
                {isDrugInfoPending ? (
                  <>
                    <Text style={[staticStyles.fetchingText, { color: colors.textSub }]}>
                      약품 정보를 불러오는 중입니다…
                    </Text>
                    <SkeletonBox height={14} style={{ marginTop: sizes.spacing.sm }} colors={colors} />
                    <SkeletonBox height={14} width="90%" style={{ marginTop: sizes.spacing.sm }} colors={colors} />
                  </>
                ) : med.drugCaution ? (
                  <Text style={[staticStyles.bodyText, { color: colors.text }]}>{med.drugCaution}</Text>
                ) : (
                  <Text style={[staticStyles.emptyFieldText, { color: colors.textDisabled }]}>정보 없음</Text>
                )}
              </Section>
            </PremiumGate>

            {/* 마지막 조회 시각 */}
            {med.drugInfoFetchedAt && (
              <Text style={[staticStyles.fetchedAt, { color: colors.textDisabled }]}>
                약품 정보 최종 조회: {new Date(med.drugInfoFetchedAt).toLocaleDateString('ko-KR')}
              </Text>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const staticStyles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    height: sizes.headerHeight,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: sizes.spacing.lg,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: sizes.font.lg,
  },
  content: { padding: sizes.spacing.lg, gap: sizes.spacing.lg, paddingBottom: 40 },
  // 섹션
  section: {
    borderRadius: sizes.radius.lg,
    padding: sizes.spacing.lg,
    borderWidth: 1,
    gap: sizes.spacing.sm,
  },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: sizes.spacing.xs },
  warningIcon: { fontSize: 14 },
  sectionTitle: {
    fontSize: sizes.font.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  // 약품명
  medNameLarge: {
    fontSize: sizes.font.xl,
  },
  manufacturer: {
    fontSize: sizes.font.sm,
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
    minWidth: 60,
  },
  infoValue: {
    fontSize: sizes.font.md,
    flex: 1,
    textAlign: 'right',
  },
  // 본문
  bodyText: {
    fontSize: sizes.font.sm,
    lineHeight: 22,
  },
  emptyFieldText: {
    fontSize: sizes.font.sm,
    fontStyle: 'italic',
  },
  fetchingText: {
    fontSize: sizes.font.sm,
    fontStyle: 'italic',
  },
  fetchedAt: {
    fontSize: sizes.font.xs,
    textAlign: 'center',
    marginTop: -sizes.spacing.sm,
  },
  // 스켈레톤
  skeleton: {
    borderRadius: sizes.radius.sm,
  },
  // 에러
  errorWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 60 },
  errorText: { fontSize: sizes.font.md },
});
