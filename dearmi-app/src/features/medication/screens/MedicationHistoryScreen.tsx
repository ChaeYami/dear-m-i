import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SectionList,
  TouchableOpacity,
  Modal,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { CompositeNavigationProp } from '@react-navigation/native';
import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useTheme, sizes, fontFamily } from '@/shared/theme';
import { useMedicationHistory } from '@/features/medication/hooks/useMedication';
import { useAuthStore } from '@/features/auth/store/authStore';
import { LoadingSpinner } from '@/shared/components/LoadingSpinner';
import type { MedicationStackParamList } from '@/navigation/MedicationNavigator';
import type { RootStackParamList } from '@/navigation/RootNavigator';
import type { MedicationLogItem, TimeSlotType, MedicationLogStatus } from '@/shared/types/domain.types';

type Nav = CompositeNavigationProp<
  StackNavigationProp<MedicationStackParamList, 'MedicationHistory'>,
  StackNavigationProp<RootStackParamList>
>;

const SLOT_LABELS: Record<TimeSlotType, string> = {
  MORNING: '아침', AFTERNOON: '점심', EVENING: '저녁', BEDTIME: '취침 전',
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
  const { colors } = useTheme();
  const navigation = useNavigation<Nav>();
  const plan = useAuthStore((s) => s.user?.plan);
  const isFree = plan === 'FREE' || !plan;

  const STATUS_CONFIG: Record<MedicationLogStatus, { label: string; color: string }> = {
    TAKEN: { label: '복용', color: colors.success },
    SKIPPED: { label: '건너뜀', color: colors.textDisabled },
    MISSED: { label: '미복용', color: colors.error },
  };

  const { data: history, isLoading } = useMedicationHistory();
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [pickerDate, setPickerDate] = useState<Date>(new Date());

  const toLocalDateStr = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

  const handlePickDate = (_: DateTimePickerEvent, date?: Date) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
      if (date) {
        navigation.navigate('MedicationHome', { date: toLocalDateStr(date) });
      }
      return;
    }
    if (date) setPickerDate(date);
  };

  const confirmIosDate = () => {
    setShowDatePicker(false);
    navigation.navigate('MedicationHome', { date: toLocalDateStr(pickerDate) });
  };

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

  const styles = getStyles(colors);

  return (
    <SafeAreaView style={styles.container}>
      {/* 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={12}>
          <Ionicons name="chevron-back" size={24} color={colors.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>복약 이력</Text>
        <TouchableOpacity
          onPress={() => {
            setPickerDate(new Date());
            setShowDatePicker(true);
          }}
          hitSlop={12}
          style={styles.headerRightBtn}
        >
          <Ionicons name="calendar-outline" size={22} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {/* FREE 플랜 업그레이드 배너 */}
      {isFree && (
        <View style={styles.freeBanner}>
          <Text style={styles.freeBannerText}>
            무료 플랜은 최근 30일 이력만 조회됩니다.
          </Text>
          <TouchableOpacity
            onPress={() => navigation.navigate('Paywall')}
            hitSlop={8}
          >
            <Text style={styles.freeBannerUpgrade}>업그레이드</Text>
          </TouchableOpacity>
        </View>
      )}

      <SectionList
        sections={sections}
        keyExtractor={(item) => item.logId}
        contentContainerStyle={sections.length === 0 ? styles.emptyContainer : styles.listContent}
        stickySectionHeadersEnabled
        renderSectionHeader={({ section }) => (
          <TouchableOpacity
            style={styles.sectionHeader}
            onPress={() => navigation.navigate('MedicationHome', { date: section.date })}
            activeOpacity={0.7}
          >
            <Text style={styles.sectionDate}>{section.title}</Text>
            <View style={styles.sectionRight}>
              <Text style={styles.sectionRate}>
                {section.takenCount}/{section.totalCount} 복용
              </Text>
              <Ionicons name="chevron-forward" size={16} color={colors.textSub} />
            </View>
          </TouchableOpacity>
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

      {/* 날짜 선택기 (이력 없는 과거 날짜 직접 진입) */}
      {showDatePicker && Platform.OS === 'android' && (
        <DateTimePicker
          value={pickerDate}
          mode="date"
          display="default"
          maximumDate={new Date()}
          onChange={handlePickDate}
        />
      )}
      {Platform.OS === 'ios' && (
        <Modal
          visible={showDatePicker}
          transparent
          animationType="fade"
          onRequestClose={() => setShowDatePicker(false)}
        >
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setShowDatePicker(false)}
          >
            <View style={styles.modalSheet}>
              <DateTimePicker
                value={pickerDate}
                mode="date"
                display="spinner"
                maximumDate={new Date()}
                onChange={handlePickDate}
                themeVariant="light"
              />
              <TouchableOpacity style={styles.modalConfirmBtn} onPress={confirmIosDate}>
                <Text style={styles.modalConfirmText}>확인</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </Modal>
      )}
    </SafeAreaView>
  );
};

const getStyles = (colors: ReturnType<typeof useTheme>['colors']) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: {
      height: sizes.headerHeight,
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: sizes.spacing.lg,
    },
    backBtn: {
      fontSize: sizes.font.md,
      color: colors.primary,
      fontFamily: fontFamily.medium,
      width: 48,
    },
    headerTitle: {
      flex: 1,
      textAlign: 'center',
      fontSize: sizes.font.lg,
      fontFamily: fontFamily.bold,
      color: colors.text,
    },
    headerRightBtn: {
      width: 48,
      alignItems: 'flex-end',
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.4)',
      justifyContent: 'flex-end',
    },
    modalSheet: {
      backgroundColor: colors.surface,
      paddingTop: sizes.spacing.md,
      paddingBottom: sizes.spacing.xl,
      borderTopLeftRadius: sizes.radius.xxl,
      borderTopRightRadius: sizes.radius.xxl,
      alignItems: 'center',
    },
    modalConfirmBtn: {
      marginTop: sizes.spacing.md,
      paddingVertical: sizes.spacing.md,
      paddingHorizontal: sizes.spacing.xxl,
      backgroundColor: colors.primary,
      borderRadius: sizes.radius.full,
    },
    modalConfirmText: {
      fontSize: sizes.font.md,
      fontFamily: fontFamily.bold,
      color: colors.textInverse,
    },
    freeBanner: {
      backgroundColor: colors.warningLight,
      paddingHorizontal: sizes.spacing.lg,
      paddingVertical: sizes.spacing.sm,
      borderBottomWidth: 1,
      borderBottomColor: colors.warning + '44',
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    freeBannerText: {
      fontSize: sizes.font.sm,
      color: '#92400E',
      flex: 1,
    },
    freeBannerUpgrade: {
      fontSize: sizes.font.sm,
      fontFamily: fontFamily.bold,
      color: colors.primary,
      marginLeft: sizes.spacing.sm,
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
      borderBottomColor: colors.divider,
    },
    sectionDate: {
      fontSize: sizes.font.sm,
      fontFamily: fontFamily.semibold,
      color: colors.text,
    },
    sectionRate: {
      fontSize: sizes.font.xs,
      color: colors.textSub,
    },
    sectionRight: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: sizes.spacing.xs,
    },
    logRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: sizes.spacing.lg,
      paddingVertical: sizes.spacing.md,
      backgroundColor: colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: colors.divider,
    },
    slotLabel: {
      fontSize: sizes.font.md,
      color: colors.text,
    },
    statusBadge: {
      paddingHorizontal: sizes.spacing.sm,
      paddingVertical: 3,
      borderRadius: sizes.radius.full,
    },
    statusText: {
      fontSize: sizes.font.xs,
      fontFamily: fontFamily.semibold,
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
      fontFamily: fontFamily.semibold,
      color: colors.textSub,
    },
    emptySubText: { fontSize: sizes.font.sm, color: colors.textDisabled },
  });
