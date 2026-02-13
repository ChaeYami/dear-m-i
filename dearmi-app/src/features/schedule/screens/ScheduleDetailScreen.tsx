import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { customAlert } from '@/shared/components/CustomAlert';
import { useTheme, sizes, fontFamily } from '@/shared/theme';
import { softShadow } from '@/shared/theme/shadows';
import { ScreenHeader } from '@/shared/components/ScreenHeader';
import { AnimatedPressable } from '@/shared/components/AnimatedPressable';
import { useScheduleDetail, useDeleteSchedule } from '@/features/schedule/hooks/useSchedule';
import { usePrepNotesBySchedule } from '@/features/prepnote/hooks/usePrepNote';
import { LoadingSpinner } from '@/shared/components/LoadingSpinner';
import type { ScheduleStackParamList } from '@/navigation/ScheduleNavigator';
import { navigationRef } from '@/navigation/navigationRef';

type Nav = StackNavigationProp<ScheduleStackParamList, 'ScheduleDetail'>;
type RootNav = any;
type Route = RouteProp<ScheduleStackParamList, 'ScheduleDetail'>;

const formatDateTime = (iso: string) => {
  // ISO 문자열에서 직접 파싱 (타임존 변환 방지)
  const [datePart, timePart] = iso.split('T');
  const [y, mo, da] = datePart.split('-');
  const [h, m] = (timePart ?? '00:00').split(':');
  return `${y}년 ${Number(mo)}월 ${Number(da)}일  ${h}:${m}`;
};

export const ScheduleDetailScreen: React.FC = () => {
  const { colors } = useTheme();
  const navigation = useNavigation<Nav>();
  const { scheduleId } = useRoute<Route>().params;

  const { data: schedule, isLoading } = useScheduleDetail(scheduleId);
  const { data: prepNotes = [] } = usePrepNotesBySchedule(String(scheduleId));
  const { mutate: deleteSchedule, isPending: isDeleting } = useDeleteSchedule();

  const handleDelete = () => {
    if (!schedule) return;
    customAlert('일정 삭제', '이 일정을 삭제할까요?', [
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
    (navigationRef.current as any)?.navigate('Main', {
      screen: 'Record',
      params: {
        screen: 'RecordForm',
        params: { scheduleId: schedule.id },
      },
    });
  };

  if (isLoading) return <LoadingSpinner fullscreen />;

  if (!schedule) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <ScreenHeader variant="back" title="일정 상세" />
        <View style={styles.emptyWrap}>
          <Text style={[styles.emptyText, { color: colors.textSub, fontFamily: fontFamily.medium }]}>일정을 찾을 수 없습니다.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScreenHeader variant="back" title="일정 상세" />

      <ScrollView contentContainerStyle={styles.content}>
        <View style={[styles.card, { backgroundColor: colors.surface }, softShadow(colors)]}>
          <InfoRow label="병원" value={schedule.hospitalName} colors={colors} />
          {schedule.doctorName && (
            <InfoRow label="담당 선생님" value={`${schedule.doctorName} 선생님`} colors={colors} />
          )}
          <InfoRow label="일시" value={formatDateTime(schedule.scheduledAt)} colors={colors} />
          {schedule.memo && <InfoRow label="메모" value={schedule.memo} multiline colors={colors} />}
        </View>

        <View style={[styles.prepNoteSection, { backgroundColor: colors.surface, borderRadius: sizes.radius.xxl }, softShadow(colors)]}>
          <View style={styles.prepNoteHeader}>
            <Text style={[styles.prepNoteSectionTitle, { color: colors.textSub, fontFamily: fontFamily.bold }]}>진료 준비 메모</Text>
            <TouchableOpacity
              onPress={() =>
                navigation.navigate('PrepNoteForm', { scheduleId: String(scheduleId) })
              }
              hitSlop={8}
            >
              <Text style={[styles.prepNoteAddBtn, { color: colors.primary, fontFamily: fontFamily.semibold }]}>+ 메모 추가</Text>
            </TouchableOpacity>
          </View>
          {prepNotes.length === 0 ? (
            <Text style={[styles.prepNoteEmpty, { color: colors.textDisabled, fontFamily: fontFamily.medium }]}>아직 준비 메모가 없어요.</Text>
          ) : (
            prepNotes.map((note) => (
              <AnimatedPressable
                key={note.id}
                style={[styles.prepNoteCard, { backgroundColor: colors.primaryMuted + '40', borderLeftColor: colors.primary }]}
                onPress={() =>
                  navigation.navigate('PrepNoteForm', {
                    noteId: note.id,
                    scheduleId: String(scheduleId),
                  })
                }
              >
                <Text style={[styles.prepNoteContent, { color: colors.text, fontFamily: fontFamily.medium }]} numberOfLines={3}>
                  {note.content}
                </Text>
              </AnimatedPressable>
            ))
          )}
        </View>

        <AnimatedPressable
          style={[styles.linkButton, { backgroundColor: colors.surface, borderColor: colors.secondary }, softShadow(colors)]}
          onPress={handleLinkRecord}
        >
          <Ionicons name="document-text-outline" size={18} color={colors.secondary} />
          <Text style={[styles.linkButtonText, { color: colors.secondary, fontFamily: fontFamily.semibold }]}>상담 기록 연결하기</Text>
        </AnimatedPressable>

        <View style={styles.actions}>
          <AnimatedPressable
            style={[styles.actionBtn, { backgroundColor: colors.primary }]}
            onPress={() => navigation.navigate('ScheduleForm', { schedule })}
          >
            <Text style={[styles.actionBtnText, { color: colors.textInverse, fontFamily: fontFamily.semibold }]}>수정</Text>
          </AnimatedPressable>
          <AnimatedPressable
            style={[styles.actionBtn, { backgroundColor: colors.errorLight, borderWidth: 1, borderColor: colors.error }]}
            onPress={handleDelete}
            disabled={isDeleting}
          >
            <Text style={[styles.actionBtnText, { color: colors.error, fontFamily: fontFamily.semibold }]}>{isDeleting ? '삭제 중…' : '삭제'}</Text>
          </AnimatedPressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const InfoRow: React.FC<{ label: string; value: string; multiline?: boolean; colors: any }> = ({
  label,
  value,
  multiline,
  colors,
}) => (
  <View style={[styles.infoRow, { backgroundColor: colors.primaryMuted + '50', borderRadius: 12 }, multiline && styles.infoRowMultiline]}>
    <Text style={[styles.infoLabel, { color: colors.textSub, fontFamily: fontFamily.medium }]}>{label}</Text>
    <Text style={[styles.infoValue, { color: colors.text, fontFamily: fontFamily.medium }, multiline && styles.infoValueMultiline]}>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: sizes.spacing.lg, gap: sizes.spacing.lg },
  emptyWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyText: { fontSize: sizes.font.md },
  card: {
    borderRadius: sizes.radius.xxl,
    padding: sizes.spacing.lg,
    gap: sizes.spacing.sm,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: sizes.spacing.md,
    paddingVertical: sizes.spacing.sm + 2,
  },
  infoRowMultiline: { flexDirection: 'column', alignItems: 'flex-start', gap: sizes.spacing.xs },
  infoLabel: {
    fontSize: sizes.font.sm,
    minWidth: 80,
  },
  infoValue: {
    fontSize: sizes.font.md,
    flex: 1,
    textAlign: 'right',
  },
  infoValueMultiline: { textAlign: 'left', flex: undefined, lineHeight: 22 },
  prepNoteSection: {
    gap: sizes.spacing.sm,
    padding: sizes.spacing.lg,
  },
  prepNoteHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  prepNoteSectionTitle: {
    fontSize: sizes.font.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  prepNoteAddBtn: {
    fontSize: sizes.font.sm,
  },
  prepNoteEmpty: {
    fontSize: sizes.font.sm,
    paddingVertical: sizes.spacing.sm,
  },
  prepNoteCard: {
    borderRadius: 12,
    padding: sizes.spacing.md,
    borderLeftWidth: 3,
  },
  prepNoteContent: {
    fontSize: sizes.font.md,
    lineHeight: 22,
  },
  linkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: sizes.spacing.sm,
    borderRadius: sizes.radius.full,
    paddingVertical: sizes.spacing.md,
    paddingHorizontal: sizes.spacing.lg,
    borderWidth: 1.5,
    borderStyle: 'dashed',
  },
  linkButtonText: {
    fontSize: sizes.font.md,
  },
  actions: { flexDirection: 'row', gap: sizes.spacing.md },
  actionBtn: {
    flex: 1,
    paddingVertical: sizes.spacing.md,
    borderRadius: sizes.radius.full,
    alignItems: 'center',
  },
  actionBtnText: {
    fontSize: sizes.font.md,
  },
});
