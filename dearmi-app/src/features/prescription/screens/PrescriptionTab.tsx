import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,

  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { useTheme, sizes, fontFamily } from '@/shared/theme';
import {
  usePagedPrescriptions,
  useDeletePrescription,
} from '@/features/prescription/hooks/usePrescription';
import { LoadingSpinner } from '@/shared/components/LoadingSpinner';
import type { PrescriptionStackParamList } from '@/navigation/PrescriptionNavigator';
import type { Prescription, PrescriptionMedication, OcrStatus } from '@/shared/types/domain.types';

if (Platform.OS === 'android') {
  UIManager.setLayoutAnimationEnabledExperimental?.(true);
}

type Nav = StackNavigationProp<PrescriptionStackParamList, 'PrescriptionTab'>;

const formatDate = (dateStr?: string) => {
  if (!dateStr) return '날짜 미상';
  const d = new Date(dateStr);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
};

const MedicationRow: React.FC<{
  med: PrescriptionMedication;
  onPress: () => void;
  colors: ReturnType<typeof useTheme>['colors'];
}> = ({ med, onPress, colors }) => (
  <TouchableOpacity
    style={[
      staticStyles.medRow,
      { borderBottomColor: colors.divider },
    ]}
    onPress={onPress}
    activeOpacity={0.75}
  >
    <View style={staticStyles.medRowLeft}>
      <Text style={[staticStyles.medName, { fontFamily: fontFamily.medium, color: colors.text }]}>
        {med.medicationName}
      </Text>
      <Text style={[staticStyles.medSub, { color: colors.textSub }]}>
        {[med.dosage, med.frequency, med.durationDays !== undefined ? `${med.durationDays}일` : undefined]
          .filter(Boolean)
          .join(' · ') || '정보 없음'}
      </Text>
    </View>
    <Ionicons name="chevron-forward" size={18} color={colors.textDisabled} />
  </TouchableOpacity>
);

const PrescriptionCard: React.FC<{
  item: Prescription;
  expanded: boolean;
  onToggle: () => void;
  onMedPress: (med: PrescriptionMedication) => void;
  onDelete: () => void;
  onViewOcr: () => void;
  colors: ReturnType<typeof useTheme>['colors'];
}> = ({ item, expanded, onToggle, onMedPress, onDelete, onViewOcr, colors }) => {
  const OCR_STATUS_CONFIG: Record<OcrStatus, { label: string; color: string }> = {
    PENDING: { label: '분석 대기', color: colors.warning },
    PROCESSING: { label: '분석 중', color: colors.primary },
    COMPLETED: { label: '분석 완료', color: colors.success },
    FAILED: { label: '인식 실패', color: colors.error },
  };

  const statusCfg = item.ocrStatus ? OCR_STATUS_CONFIG[item.ocrStatus] : null;
  const isPending = item.ocrStatus === 'PENDING' || item.ocrStatus === 'PROCESSING';

  return (
    <View style={[staticStyles.card, { backgroundColor: colors.surface, borderColor: colors.divider }]}>
      <TouchableOpacity style={staticStyles.cardHeader} onPress={onToggle} activeOpacity={0.8}>
        <View style={staticStyles.cardHeaderLeft}>
          <Text style={[staticStyles.cardDate, { color: colors.textSub }]}>{formatDate(item.prescribedAt)}</Text>
          <Text style={[staticStyles.cardHospital, { fontFamily: fontFamily.semibold, color: colors.text }]}>
            {item.hospitalName ?? '병원명 미상'}
          </Text>
        </View>
        <View style={staticStyles.cardHeaderRight}>
          {statusCfg && (
            <View style={[staticStyles.statusBadge, { backgroundColor: statusCfg.color + '20' }]}>
              {isPending && (
                <ActivityIndicator size="small" color={statusCfg.color} style={staticStyles.statusSpinner} />
              )}
              <Text style={[staticStyles.statusText, { fontFamily: fontFamily.semibold, color: statusCfg.color }]}>
                {statusCfg.label}
              </Text>
            </View>
          )}
          <View style={staticStyles.medCountRow}>
            <Ionicons name="medical-outline" size={14} color={colors.textSub} />
            <Text style={[staticStyles.medCount, { color: colors.textSub }]}>{item.medications.length}종</Text>
          </View>
          <Ionicons
            name={expanded ? 'chevron-up' : 'chevron-down'}
            size={16}
            color={colors.textDisabled}
          />
        </View>
      </TouchableOpacity>

      {expanded && (
        <View style={[staticStyles.accordion, { borderTopColor: colors.divider }]}>
          {item.medications.length === 0 ? (
            <Text style={[staticStyles.noMedText, { color: colors.textDisabled }]}>
              등록된 약품이 없습니다
            </Text>
          ) : (
            item.medications.map((med) => (
              <MedicationRow
                key={med.id}
                med={med}
                onPress={() => onMedPress(med)}
                colors={colors}
              />
            ))
          )}

          <View style={[staticStyles.cardActions, { backgroundColor: colors.background }]}>
            {(item.ocrStatus === 'FAILED' || item.ocrStatus === 'COMPLETED') && (
              <TouchableOpacity
                style={[
                  staticStyles.actionBtn,
                  { backgroundColor: colors.surface, borderColor: colors.divider },
                ]}
                onPress={onViewOcr}
              >
                <Text style={[staticStyles.actionBtnText, { fontFamily: fontFamily.medium, color: colors.primary }]}>
                  OCR 결과 보기
                </Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[
                staticStyles.actionBtn,
                { backgroundColor: colors.surface, borderColor: colors.error + '55' },
              ]}
              onPress={onDelete}
            >
              <Text style={[staticStyles.deleteActionBtnText, { fontFamily: fontFamily.medium, color: colors.error }]}>
                삭제
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
};

export const PrescriptionTab: React.FC = () => {
  const { colors } = useTheme();
  const navigation = useNavigation<Nav>();
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } =
    usePagedPrescriptions();
  const { mutate: deletePrescription } = useDeletePrescription();

  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());

  const prescriptions = useMemo(
    () => data?.pages.flatMap((p) => p.content) ?? [],
    [data]
  );

  const toggleExpand = (id: number) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleDelete = (item: Prescription) => {
    Alert.alert('처방전 삭제', '이 처방전을 삭제할까요?', [
      { text: '취소', style: 'cancel' },
      { text: '삭제', style: 'destructive', onPress: () => deletePrescription(item.id) },
    ]);
  };

  if (isLoading) return <LoadingSpinner fullscreen />;

  return (
    <SafeAreaView style={[staticStyles.container, { backgroundColor: colors.background }]}>
      <View style={staticStyles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={12}>
          <Ionicons name="chevron-back" size={24} color={colors.primary} />
        </TouchableOpacity>
        <Text style={[staticStyles.headerTitle, { fontFamily: fontFamily.bold, color: colors.text }]}>
          처방 목록
        </Text>
        <View style={{ width: 24 }} />
      </View>

      <FlatList
        data={prescriptions}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={
          prescriptions.length === 0 ? staticStyles.emptyContainer : staticStyles.listContent
        }
        renderItem={({ item }) => (
          <PrescriptionCard
            item={item}
            expanded={expandedIds.has(item.id)}
            onToggle={() => toggleExpand(item.id)}
            onMedPress={(med) =>
              navigation.navigate('MedicationDetail', {
                medicationId: med.id,
                medicationName: med.medicationName,
              })
            }
            onDelete={() => handleDelete(item)}
            onViewOcr={() =>
              navigation.navigate('OcrResult', { prescriptionId: item.id })
            }
            colors={colors}
          />
        )}
        onEndReached={() => {
          if (hasNextPage && !isFetchingNextPage) fetchNextPage();
        }}
        onEndReachedThreshold={0.3}
        ListFooterComponent={
          isFetchingNextPage ? (
            <ActivityIndicator color={colors.primary} style={staticStyles.footerSpinner} />
          ) : null
        }
        ListEmptyComponent={
          <View style={staticStyles.emptyWrap}>
            <Text style={[staticStyles.emptyText, { fontFamily: fontFamily.semibold, color: colors.textSub }]}>
              처방전이 없어요
            </Text>
            <Text style={[staticStyles.emptySubText, { color: colors.textDisabled }]}>
              처방전을 촬영해서 등록해보세요
            </Text>
          </View>
        }
      />

      <TouchableOpacity
        style={[staticStyles.fab, { backgroundColor: colors.primary, shadowColor: colors.glassShadow }]}
        onPress={() => navigation.navigate('PrescriptionUpload')}
        activeOpacity={0.85}
      >
        <Ionicons name="add" size={28} color={colors.textInverse} />
      </TouchableOpacity>
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
    fontSize: sizes.font.xl,
  },
  listContent: { padding: sizes.spacing.lg, gap: sizes.spacing.md, paddingBottom: sizes.tabBarSafeBottom + 20 },
  emptyContainer: { flexGrow: 1 },
  card: {
    borderRadius: sizes.radius.lg,
    borderWidth: 1,
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: sizes.spacing.md,
    gap: sizes.spacing.sm,
  },
  cardHeaderLeft: { flex: 1, gap: sizes.spacing.xs },
  cardDate: { fontSize: sizes.font.sm },
  cardHospital: {
    fontSize: sizes.font.md,
  },
  cardHeaderRight: { alignItems: 'flex-end', gap: sizes.spacing.xs },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: sizes.spacing.sm,
    paddingVertical: 2,
    borderRadius: sizes.radius.full,
    gap: 4,
  },
  statusSpinner: { transform: [{ scale: 0.7 }] },
  statusText: { fontSize: sizes.font.xs },
  medCountRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  medCount: { fontSize: sizes.font.xs },
  accordion: {
    borderTopWidth: 1,
  },
  medRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: sizes.spacing.md,
    paddingHorizontal: sizes.spacing.md,
    borderBottomWidth: 1,
    gap: sizes.spacing.sm,
  },
  medRowLeft: { flex: 1 },
  medName: {
    fontSize: sizes.font.md,
  },
  medSub: { fontSize: sizes.font.xs, marginTop: 2 },
  noMedText: {
    fontSize: sizes.font.sm,
    textAlign: 'center',
    paddingVertical: sizes.spacing.lg,
  },
  cardActions: {
    flexDirection: 'row',
    padding: sizes.spacing.sm,
    gap: sizes.spacing.sm,
  },
  actionBtn: {
    flex: 1,
    paddingVertical: sizes.spacing.sm,
    borderRadius: sizes.radius.md,
    alignItems: 'center',
    borderWidth: 1,
  },
  actionBtnText: {
    fontSize: sizes.font.sm,
  },
  deleteActionBtnText: { fontSize: sizes.font.sm },
  footerSpinner: { marginVertical: sizes.spacing.lg },
  emptyWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: sizes.spacing.sm,
    paddingTop: 120,
  },
  emptyText: {
    fontSize: sizes.font.lg,
  },
  emptySubText: { fontSize: sizes.font.sm },
  fab: {
    position: 'absolute',
    bottom: sizes.tabBarSafeBottom + sizes.spacing.md,
    right: sizes.spacing.xl,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 8,
  },
});
