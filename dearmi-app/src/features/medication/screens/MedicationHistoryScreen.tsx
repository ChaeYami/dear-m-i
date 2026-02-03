import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SectionList,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { colors, sizes } from '@/constants';
import { useMedicationHistory } from '@/features/medication/hooks/useMedication';
import { useAuthStore } from '@/features/auth/store/authStore';
import { LoadingSpinner } from '@/shared/components/LoadingSpinner';
import type { MyPageStackParamList } from '@/navigation/MyPageNavigator';
import type { MedicationLogItem, TimeSlotType, MedicationLogStatus } from '@/shared/types/domain.types';

type Nav = StackNavigationProp<MyPageStackParamList, 'MedicationHistory'>;

const SLOT_LABELS: Record<TimeSlotType, string> = {
  MORNING: '아침', AFTERNOON: '점심', EVENING: '저녁', BEDTIME: '취침 전',
};

const STATUS_CONFIG: Record<MedicationLogStatus, { label: string; color: string }> = {
  TAKEN: { label: '복용', color: colors.success },
  SKIPPED: { label: '건너뜀', color: colors.text.disabled },
  MISSED: { label: '미복용', color: colors.error },
};

const formatDate = (dateStr: string) => {
  const d = new Date(dateStr);
  return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일`;
};

interface Section {
  title: string;         // "2026년 4월 10일"
  date: string;          // "2026-04-10"
  data: MedicationLogItem[];
  takenCount: number;
  totalCount: number;
}

export const MedicationHistoryScreen: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const plan = useAuthStore((s) => s.user?.plan);
  const isFree = plan === 'FREE' || !plan;

  const { data: history, isLoading } = useMedicationHistory();

  const sections = useMemo<Section[]>(() => {
    if (!history?.logs) return [];
    const map = new Map<string, MedicationLogItem[]>();
    for (const log of history.logs) {
      const list = map.get(log.logDate) ?? [];
      list.push(log);
      map.set(log.logDate, list);
    }
    return Array.from(map.entries()).map(([date, logs]) => ({
      title: formatDate(date),
      date,
      data: logs,
      takenCount: logs.filter((l) => l.status === 'TAKEN').length,
      totalCount: logs.length,
    }));
  }, [history]);

  if (isLoading) return <LoadingSpinner fullscreen />;

  return (
    <SafeAreaView style={styles.container}>
      {/* 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={12}>
          <Text style={styles.backBtn}>‹  뒤로</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>복약 이력</Text>
        <View style={{ width: 48 }} />
      </View>

      {/* FREE 플랜 업그레이드 배너 */}
      {isFree && (
        <View style={styles.freeBanner}>
          <Text style={styles.freeBannerText}>
            🔒 무료 플랜은 최근 30일 이력만 조회됩니다.
          </Text>
        </View>
      )}

      <SectionList
        sections={sections}
        keyExtractor={(item) => item.logId}
        contentContainerStyle={sections.length === 0 ? styles.emptyContainer : styles.listContent}
        stickySectionHeadersEnabled
        renderSectionHeader={({ section }) => (
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionDate}>{section.title}</Text>
            <Text style={styles.sectionRate}>
              {section.takenCount}/{section.totalCount} 복용
            </Text>
          </View>
        )}
        renderItem={({ item }) => {
          const statusCfg = STATUS_CONFIG[item.status];
          return (
            <View style={styles.logRow}>
              <Text style={styles.slotLabel}>{SLOT_LABELS[item.timeSlot]}</Text>
              <View style={[styles.statusBadge, { backgroundColor: statusCfg.color + '18' }]}>
                <Text style={[styles.statusText, { color: statusCfg.color }]}>
                  {statusCfg.label}
                </Text>
              </View>
            </View>
          );
        }}
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <Text style={styles.emptyText}>복약 이력이 없어요</Text>
            <Text style={styles.emptySubText}>복약 일정을 등록하고 체크해보세요</Text>
          </View>
        }
      />
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
    borderBottomColor: colors.border,
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
    color: colors.text.primary,
  },
  freeBanner: {
    backgroundColor: colors.warningLight,
    paddingHorizontal: sizes.spacing.lg,
    paddingVertical: sizes.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.warning + '44',
  },
  freeBannerText: {
    fontSize: sizes.font.sm,
    color: '#92400E',
    textAlign: 'center',
  },
  listContent: { paddingBottom: 40 },
  emptyContainer: { flexGrow: 1 },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: sizes.spacing.lg,
    paddingVertical: sizes.spacing.sm,
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  sectionDate: {
    fontSize: sizes.font.sm,
    fontWeight: sizes.fontWeight.semibold,
    color: colors.text.primary,
  },
  sectionRate: {
    fontSize: sizes.font.xs,
    color: colors.text.secondary,
  },
  logRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: sizes.spacing.lg,
    paddingVertical: sizes.spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  slotLabel: {
    fontSize: sizes.font.md,
    color: colors.text.primary,
  },
  statusBadge: {
    paddingHorizontal: sizes.spacing.sm,
    paddingVertical: 3,
    borderRadius: sizes.radius.full,
  },
  statusText: {
    fontSize: sizes.font.xs,
    fontWeight: sizes.fontWeight.semibold,
  },
  emptyWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 100,
    gap: sizes.spacing.sm,
  },
  emptyText: {
    fontSize: sizes.font.lg,
    fontWeight: sizes.fontWeight.semibold,
    color: colors.text.secondary,
  },
  emptySubText: { fontSize: sizes.font.sm, color: colors.text.disabled },
});
