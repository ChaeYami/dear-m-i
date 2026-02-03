import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  SafeAreaView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { colors, sizes } from '@/constants';
import { usePrescriptions, useDeletePrescription } from '@/features/prescription/hooks/usePrescription';
import { LoadingSpinner } from '@/shared/components/LoadingSpinner';
import type { PrescriptionStackParamList } from '@/navigation/PrescriptionNavigator';
import type { Prescription } from '@/shared/types/domain.types';

type Nav = StackNavigationProp<PrescriptionStackParamList, 'PrescriptionTab'>;

const formatDate = (dateStr?: string) => {
  if (!dateStr) return '날짜 미상';
  const d = new Date(dateStr);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
};

const OcrStatusBadge: React.FC<{ status?: string }> = ({ status }) => {
  if (!status || status === 'COMPLETED') return null;
  const map: Record<string, { label: string; color: string }> = {
    PENDING: { label: '분석 대기', color: colors.warning },
    PROCESSING: { label: '분석 중', color: colors.primary },
    FAILED: { label: '인식 실패', color: colors.error },
  };
  const info = map[status];
  if (!info) return null;
  return (
    <View style={[styles.badge, { backgroundColor: info.color + '20' }]}>
      <Text style={[styles.badgeText, { color: info.color }]}>{info.label}</Text>
    </View>
  );
};

export const PrescriptionTab: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const { data: prescriptions = [], isLoading } = usePrescriptions();
  const { mutate: deletePrescription } = useDeletePrescription();

  const handleDelete = (item: Prescription) => {
    Alert.alert('처방전 삭제', '이 처방전을 삭제할까요?', [
      { text: '취소', style: 'cancel' },
      {
        text: '삭제',
        style: 'destructive',
        onPress: () => deletePrescription(item.id),
      },
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
          <TouchableOpacity
            style={styles.card}
            onPress={() =>
              item.ocrStatus && item.ocrStatus !== 'COMPLETED'
                ? navigation.navigate('OcrResult', { prescriptionId: item.id })
                : null
            }
            onLongPress={() => handleDelete(item)}
            activeOpacity={0.75}
          >
            <View style={styles.cardLeft}>
              <Text style={styles.cardIcon}>💊</Text>
            </View>
            <View style={styles.cardBody}>
              <View style={styles.cardTitleRow}>
                <Text style={styles.cardHospital}>
                  {item.hospitalName ?? '병원명 미상'}
                </Text>
                <OcrStatusBadge status={item.ocrStatus} />
              </View>
              <Text style={styles.cardDate}>{formatDate(item.prescribedAt)}</Text>
              <Text style={styles.cardMeds}>
                약품 {item.medications.length}종
              </Text>
            </View>
          </TouchableOpacity>
        )}
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
  card: {
    backgroundColor: colors.surface,
    borderRadius: sizes.radius.lg,
    padding: sizes.spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: 'row',
    gap: sizes.spacing.md,
    alignItems: 'center',
  },
  cardLeft: {
    width: 44,
    height: 44,
    borderRadius: sizes.radius.md,
    backgroundColor: colors.secondary + '15',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardIcon: { fontSize: 22 },
  cardBody: { flex: 1, gap: 3 },
  cardTitleRow: { flexDirection: 'row', alignItems: 'center', gap: sizes.spacing.sm },
  cardHospital: {
    fontSize: sizes.font.md,
    fontWeight: sizes.fontWeight.semibold,
    color: colors.text.primary,
    flex: 1,
  },
  badge: {
    paddingHorizontal: sizes.spacing.sm,
    paddingVertical: 2,
    borderRadius: sizes.radius.full,
  },
  badgeText: { fontSize: sizes.font.xs, fontWeight: sizes.fontWeight.semibold },
  cardDate: { fontSize: sizes.font.sm, color: colors.text.secondary },
  cardMeds: { fontSize: sizes.font.xs, color: colors.text.disabled },
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
