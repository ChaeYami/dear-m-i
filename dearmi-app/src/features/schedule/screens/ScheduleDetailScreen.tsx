import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { colors, sizes } from '@/constants';
import { useScheduleDetail, useDeleteSchedule } from '@/features/schedule/hooks/useSchedule';
import { usePrepNotesBySchedule } from '@/features/prepnote/hooks/usePrepNote';
import { LoadingSpinner } from '@/shared/components/LoadingSpinner';
import type { ScheduleStackParamList } from '@/navigation/ScheduleNavigator';

type Nav = StackNavigationProp<ScheduleStackParamList, 'ScheduleDetail'>;
type RootNav = any;
type Route = RouteProp<ScheduleStackParamList, 'ScheduleDetail'>;

const formatDateTime = (iso: string) => {
  const d = new Date(iso);
  return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일  ${d
    .getHours()
    .toString()
    .padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
};

export const ScheduleDetailScreen: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const { scheduleId } = useRoute<Route>().params;

  const { data: schedule, isLoading } = useScheduleDetail(scheduleId);
  const { data: prepNotes = [] } = usePrepNotesBySchedule(String(scheduleId));
  const { mutate: deleteSchedule, isPending: isDeleting } = useDeleteSchedule();

  const handleDelete = () => {
    if (!schedule) return;
    Alert.alert('일정 삭제', '이 일정을 삭제할까요?', [
      { text: '취소', style: 'cancel' },
      {
        text: '삭제',
        style: 'destructive',
        onPress: () => {
          const d = new Date(schedule.scheduledAt);
          deleteSchedule(
            { id: schedule.id, year: d.getFullYear(), month: d.getMonth() + 1 },
            { onSuccess: () => navigation.goBack() }
          );
        },
      },
    ]);
  };

  const handleLinkRecord = () => {
    if (!schedule) return;
    const tabNav = navigation.getParent()?.getParent() as RootNav;
    tabNav?.navigate('Record', {
      screen: 'RecordForm',
      params: { scheduleId: schedule.id },
    });
  };

  if (isLoading) return <LoadingSpinner fullscreen />;

  if (!schedule) {
    return (
      <SafeAreaView style={styles.container}>
        <Header onBack={() => navigation.goBack()} title="일정 상세" />
        <View style={styles.emptyWrap}>
          <Text style={styles.emptyText}>일정을 찾을 수 없습니다.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Header onBack={() => navigation.goBack()} title="일정 상세" />

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.card}>
          <InfoRow label="병원" value={schedule.hospitalName} />
          {schedule.doctorName && (
            <InfoRow label="담당 선생님" value={`${schedule.doctorName} 선생님`} />
          )}
          <InfoRow label="일시" value={formatDateTime(schedule.scheduledAt)} />
          {schedule.memo && <InfoRow label="메모" value={schedule.memo} multiline />}
        </View>

        <View style={styles.prepNoteSection}>
          <View style={styles.prepNoteHeader}>
            <Text style={styles.prepNoteSectionTitle}>진료 준비 메모</Text>
            <TouchableOpacity
              onPress={() =>
                navigation.navigate('PrepNoteForm', { scheduleId: String(scheduleId) })
              }
              hitSlop={8}
            >
              <Text style={styles.prepNoteAddBtn}>+ 메모 추가</Text>
            </TouchableOpacity>
          </View>
          {prepNotes.length === 0 ? (
            <Text style={styles.prepNoteEmpty}>아직 준비 메모가 없어요.</Text>
          ) : (
            prepNotes.map((note) => (
              <TouchableOpacity
                key={note.id}
                style={styles.prepNoteCard}
                onPress={() =>
                  navigation.navigate('PrepNoteForm', {
                    noteId: note.id,
                    scheduleId: String(scheduleId),
                  })
                }
                activeOpacity={0.75}
              >
                <Text style={styles.prepNoteContent} numberOfLines={3}>
                  {note.content}
                </Text>
              </TouchableOpacity>
            ))
          )}
        </View>

        <TouchableOpacity style={styles.linkButton} onPress={handleLinkRecord} activeOpacity={0.8}>
          <Ionicons name="document-text-outline" size={18} color={colors.secondary} />
          <Text style={styles.linkButtonText}>상담 기록 연결하기</Text>
        </TouchableOpacity>

        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.actionBtn, styles.editBtn]}
            onPress={() => navigation.navigate('ScheduleForm', { schedule })}
            activeOpacity={0.8}
          >
            <Text style={styles.editBtnText}>수정</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionBtn, styles.deleteBtn]}
            onPress={handleDelete}
            disabled={isDeleting}
            activeOpacity={0.8}
          >
            <Text style={styles.deleteBtnText}>{isDeleting ? '삭제 중…' : '삭제'}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const Header: React.FC<{ onBack: () => void; title: string }> = ({ onBack, title }) => (
  <View style={styles.header}>
    <TouchableOpacity onPress={onBack} hitSlop={12}>
      <Ionicons name="chevron-back" size={24} color={colors.primary} />
    </TouchableOpacity>
    <Text style={styles.headerTitle}>{title}</Text>
    <View style={styles.headerRight} />
  </View>
);

const InfoRow: React.FC<{ label: string; value: string; multiline?: boolean }> = ({
  label,
  value,
  multiline,
}) => (
  <View style={[styles.infoRow, multiline && styles.infoRowMultiline]}>
    <Text style={styles.infoLabel}>{label}</Text>
    <Text style={[styles.infoValue, multiline && styles.infoValueMultiline]}>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
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
    fontWeight: sizes.fontWeight.bold,
    color: colors.text,
  },
  headerRight: { width: 48 },
  content: { padding: sizes.spacing.lg, gap: sizes.spacing.lg },
  emptyWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyText: { fontSize: sizes.font.md, color: colors.textSub },
  card: {
    backgroundColor: colors.surfaceSolid,
    borderRadius: sizes.radius.xl,
    padding: sizes.spacing.lg,
    gap: sizes.spacing.md,
    borderWidth: 1,
    borderColor: colors.divider,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoRowMultiline: { flexDirection: 'column', alignItems: 'flex-start', gap: sizes.spacing.xs },
  infoLabel: {
    fontSize: sizes.font.sm,
    color: colors.textSub,
    fontWeight: sizes.fontWeight.medium,
    minWidth: 80,
  },
  infoValue: {
    fontSize: sizes.font.md,
    color: colors.text,
    flex: 1,
    textAlign: 'right',
  },
  infoValueMultiline: { textAlign: 'left', flex: undefined, lineHeight: 22 },
  prepNoteSection: {
    gap: sizes.spacing.sm,
  },
  prepNoteHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  prepNoteSectionTitle: {
    fontSize: sizes.font.sm,
    fontWeight: sizes.fontWeight.bold,
    color: colors.textSub,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  prepNoteAddBtn: {
    fontSize: sizes.font.sm,
    color: colors.primary,
    fontWeight: sizes.fontWeight.semibold,
  },
  prepNoteEmpty: {
    fontSize: sizes.font.sm,
    color: colors.textDisabled,
    paddingVertical: sizes.spacing.sm,
  },
  prepNoteCard: {
    backgroundColor: colors.surfaceSolid,
    borderRadius: sizes.radius.md,
    padding: sizes.spacing.md,
    borderWidth: 1,
    borderColor: colors.divider,
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
  },
  prepNoteContent: {
    fontSize: sizes.font.md,
    color: colors.text,
    lineHeight: 22,
  },
  linkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: sizes.spacing.sm,
    backgroundColor: colors.surfaceSolid,
    borderRadius: sizes.radius.lg,
    paddingVertical: sizes.spacing.md,
    paddingHorizontal: sizes.spacing.lg,
    borderWidth: 1.5,
    borderColor: colors.secondary,
    borderStyle: 'dashed',
  },
  linkButtonText: {
    fontSize: sizes.font.md,
    color: colors.secondary,
    fontWeight: sizes.fontWeight.semibold,
  },
  actions: { flexDirection: 'row', gap: sizes.spacing.md },
  actionBtn: {
    flex: 1,
    paddingVertical: sizes.spacing.md,
    borderRadius: sizes.radius.lg,
    alignItems: 'center',
  },
  editBtn: {
    backgroundColor: colors.primary,
  },
  editBtnText: {
    fontSize: sizes.font.md,
    fontWeight: sizes.fontWeight.semibold,
    color: colors.textInverse,
  },
  deleteBtn: {
    backgroundColor: colors.errorLight,
    borderWidth: 1,
    borderColor: colors.error,
  },
  deleteBtnText: {
    fontSize: sizes.font.md,
    fontWeight: sizes.fontWeight.semibold,
    color: colors.error,
  },
});
