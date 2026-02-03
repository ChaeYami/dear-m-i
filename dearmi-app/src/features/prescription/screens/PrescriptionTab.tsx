import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  SafeAreaView,
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { colors, sizes } from '@/constants';
import {
  usePagedPrescriptions,
  useDeletePrescription,
} from '@/features/prescription/hooks/usePrescription';
import { LoadingSpinner } from '@/shared/components/LoadingSpinner';
import type { PrescriptionStackParamList } from '@/navigation/PrescriptionNavigator';
import type { Prescription, PrescriptionMedication, OcrStatus } from '@/shared/types/domain.types';

// Android에서 LayoutAnimation 활성화
if (Platform.OS === 'android') {
  UIManager.setLayoutAnimationEnabledExperimental?.(true);
}

type Nav = StackNavigationProp<PrescriptionStackParamList, 'PrescriptionTab'>;

// ─── 유틸 ──────────────────────────────────────────────────────────────────

const formatDate = (dateStr?: string) => {
  if (!dateStr) return '날짜 미상';
  const d = new Date(dateStr);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
};

const OCR_STATUS_CONFIG: Record<OcrStatus, { label: string; color: string }> = {
  PENDING: { label: '분석 대기', color: colors.warning },
  PROCESSING: { label: '분석 중', color: colors.primary },
  COMPLETED: { label: '분석 완료', color: colors.success },
  FAILED: { label: '인식 실패', color: colors.error },
};

// ─── 약품 행 ───────────────────────────────────────────────────────────────

const MedicationRow: React.FC<{
  med: PrescriptionMedication;
  onPress: () => void;
}> = ({ med, onPress }) => (
  <TouchableOpacity style={styles.medRow} onPress={onPress} activeOpacity={0.75}>
    <View style={styles.medRowLeft}>
      <Text style={styles.medName}>{med.medicationName}</Text>
      <Text style={styles.medSub}>
        {[med.dosage, med.frequency, med.durationDays !== undefined ? `${med.durationDays}일` : undefined]
          .filter(Boolean)
          .join(' · ') || '정보 없음'}
      </Text>
    </View>
    <Text style={styles.medArrow}>›</Text>
  </TouchableOpacity>
);

// ─── 처방전 카드 (아코디언) ────────────────────────────────────────────────

const PrescriptionCard: React.FC<{
  item: Prescription;
  expanded: boolean;
  onToggle: () => void;
  onMedPress: (med: PrescriptionMedication) => void;
  onDelete: () => void;
  onViewOcr: () => void;
}> = ({ item, expanded, onToggle, onMedPress, onDelete, onViewOcr }) => {
  const statusCfg = item.ocrStatus ? OCR_STATUS_CONFIG[item.ocrStatus] : null;
  const isPending = item.ocrStatus === 'PENDING' || item.ocrStatus === 'PROCESSING';

  return (
    <View style={styles.card}>
      {/* 카드 헤더 — 탭으로 아코디언 토글 */}
      <TouchableOpacity style={styles.cardHeader} onPress={onToggle} activeOpacity={0.8}>
        <View style={styles.cardHeaderLeft}>
          <Text style={styles.cardDate}>{formatDate(item.prescribedAt)}</Text>
          <Text style={styles.cardHospital}>{item.hospitalName ?? '병원명 미상'}</Text>
        </View>
        <View style={styles.cardHeaderRight}>
          {statusCfg && (
            <View style={[styles.statusBadge, { backgroundColor: statusCfg.color + '20' }]}>
              {isPending && (
                <ActivityIndicator size="small" color={statusCfg.color} style={styles.statusSpinner} />
              )}
              <Text style={[styles.statusText, { color: statusCfg.color }]}>{statusCfg.label}</Text>
            </View>
          )}
          <Text style={styles.medCount}>💊 {item.medications.length}종</Text>
          <Text style={styles.accordionArrow}>{expanded ? '▲' : '▼'}</Text>
        </View>
      </TouchableOpacity>

      {/* 아코디언 펼침 */}
      {expanded && (
        <View style={styles.accordion}>
          {item.medications.length === 0 ? (
            <Text style={styles.noMedText}>등록된 약품이 없습니다</Text>
          ) : (
            item.medications.map((med) => (
              <MedicationRow
                key={med.id}
                med={med}
                onPress={() => onMedPress(med)}
              />
            ))
          )}

          {/* 하단 액션 버튼 */}
          <View style={styles.cardActions}>
            {(item.ocrStatus === 'FAILED' || item.ocrStatus === 'COMPLETED') && (
              <TouchableOpacity style={styles.actionBtn} onPress={onViewOcr}>
                <Text style={styles.actionBtnText}>OCR 결과 보기</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[styles.actionBtn, styles.deleteActionBtn]}
              onPress={onDelete}
            >
              <Text style={styles.deleteActionBtnText}>삭제</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
};

// ─── 메인 화면 ────────────────────────────────────────────────────────────

export const PrescriptionTab: React.FC = () => {
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
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>처방전</Text>
      </View>

      <FlatList
        data={prescriptions}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={
          prescriptions.length === 0 ? styles.emptyContainer : styles.listContent
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
          />
        )}
        onEndReached={() => {
          if (hasNextPage && !isFetchingNextPage) fetchNextPage();
        }}
        onEndReachedThreshold={0.3}
        ListFooterComponent={
          isFetchingNextPage ? (
            <ActivityIndicator color={colors.primary} style={styles.footerSpinner} />
          ) : null
        }
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <Text style={styles.emptyText}>처방전이 없어요</Text>
            <Text style={styles.emptySubText}>처방전을 촬영해서 등록해보세요</Text>
          </View>
        }
      />

      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('PrescriptionUpload')}
        activeOpacity={0.85}
      >
        <Text style={styles.fabIcon}>+</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    height: sizes.headerHeight,
    justifyContent: 'center',
    paddingHorizontal: sizes.spacing.lg,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    fontSize: sizes.font.xl,
    fontWeight: sizes.fontWeight.bold,
    color: colors.text.primary,
  },
  listContent: { padding: sizes.spacing.lg, gap: sizes.spacing.md, paddingBottom: 80 },
  emptyContainer: { flexGrow: 1 },
  // 카드
  card: {
    backgroundColor: colors.surface,
    borderRadius: sizes.radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: sizes.spacing.md,
    gap: sizes.spacing.sm,
  },
  cardHeaderLeft: { flex: 1, gap: 3 },
  cardDate: { fontSize: sizes.font.sm, color: colors.text.secondary },
  cardHospital: {
    fontSize: sizes.font.md,
    fontWeight: sizes.fontWeight.semibold,
    color: colors.text.primary,
  },
  cardHeaderRight: { alignItems: 'flex-end', gap: 4 },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: sizes.spacing.sm,
    paddingVertical: 2,
    borderRadius: sizes.radius.full,
    gap: 4,
  },
  statusSpinner: { transform: [{ scale: 0.7 }] },
  statusText: { fontSize: sizes.font.xs, fontWeight: sizes.fontWeight.semibold },
  medCount: { fontSize: sizes.font.xs, color: colors.text.secondary },
  accordionArrow: { fontSize: sizes.font.xs, color: colors.text.disabled },
  // 아코디언
  accordion: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  medRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: sizes.spacing.md,
    paddingHorizontal: sizes.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: sizes.spacing.sm,
  },
  medRowLeft: { flex: 1 },
  medName: {
    fontSize: sizes.font.md,
    fontWeight: sizes.fontWeight.medium,
    color: colors.text.primary,
  },
  medSub: { fontSize: sizes.font.xs, color: colors.text.secondary, marginTop: 2 },
  medArrow: { fontSize: sizes.font.lg, color: colors.text.disabled },
  noMedText: {
    fontSize: sizes.font.sm,
    color: colors.text.disabled,
    textAlign: 'center',
    paddingVertical: sizes.spacing.lg,
  },
  cardActions: {
    flexDirection: 'row',
    padding: sizes.spacing.sm,
    gap: sizes.spacing.sm,
    backgroundColor: colors.background,
  },
  actionBtn: {
    flex: 1,
    paddingVertical: sizes.spacing.sm,
    borderRadius: sizes.radius.md,
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  actionBtnText: {
    fontSize: sizes.font.sm,
    color: colors.primary,
    fontWeight: sizes.fontWeight.medium,
  },
  deleteActionBtn: { borderColor: colors.error + '55' },
  deleteActionBtnText: { fontSize: sizes.font.sm, color: colors.error, fontWeight: sizes.fontWeight.medium },
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
    fontWeight: sizes.fontWeight.semibold,
    color: colors.text.secondary,
  },
  emptySubText: { fontSize: sizes.font.sm, color: colors.text.disabled },
  fab: {
    position: 'absolute',
    bottom: sizes.spacing.xl,
    right: sizes.spacing.xl,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.secondary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 8,
  },
  fabIcon: { fontSize: 28, color: colors.text.onPrimary, lineHeight: 32 },
});
