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
import { useTranslation } from 'react-i18next';
import type { StackNavigationProp } from '@react-navigation/stack';
import { customAlert } from '@/shared/components/CustomAlert';
import { useTheme, sizes, fontFamily } from '@/shared/theme';
import { softShadow } from '@/shared/theme/shadows';
import { ScreenHeader } from '@/shared/components/ScreenHeader';
import { AnimatedPressable } from '@/shared/components/AnimatedPressable';
import { useScheduleDetail, useDeleteSchedule } from '@/features/schedule/hooks/useSchedule';
import { usePrepNotesBySchedule } from '@/features/prepnote/hooks/usePrepNote';
import { LoadingSpinner } from '@/shared/components/LoadingSpinner';
import type { CareStackParamList } from '@/navigation/CareNavigator';
import { navigationRef } from '@/navigation/navigationRef';

type Nav = StackNavigationProp<CareStackParamList, 'ScheduleDetail'>;
type RootNav = any;
type Route = RouteProp<CareStackParamList, 'ScheduleDetail'>;

const formatDateTime = (iso: string, t: (k: string, o?: any) => string) => {
  const [datePart, timePart] = iso.split('T');
  const [y, mo, da] = datePart.split('-');
  const [h, m] = (timePart ?? '00:00').split(':');
  return t('schedule:datetime_format', {
    year: y,
    month: Number(mo),
    day: Number(da),
    time: `${h}:${m}`,
  });
};

export const ScheduleDetailScreen: React.FC = () => {
  const { colors } = useTheme();
  const navigation = useNavigation<Nav>();
  const { t } = useTranslation(['schedule', 'common']);
  const { scheduleId } = useRoute<Route>().params;

  const { data: schedule, isLoading } = useScheduleDetail(scheduleId);
  const { data: prepNotes = [] } = usePrepNotesBySchedule(String(scheduleId));
  const { mutate: deleteSchedule, isPending: isDeleting } = useDeleteSchedule();

  const isPastSchedule = schedule ? new Date(schedule.scheduledAt) < new Date() : false;

  const handleDelete = () => {
    if (!schedule) return;
    customAlert(t('schedule:delete_title'), t('schedule:delete_message'), [
      { text: t('common:cancel'), style: 'cancel' },
      {
        text: t('common:delete'),
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
      screen: 'Care',
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
        <ScreenHeader variant="back" title={t('schedule:detail')} />
        <View style={styles.emptyWrap}>
          <Text style={[styles.emptyText, { color: colors.textSub, fontFamily: fontFamily.medium }]}>{t('schedule:not_found')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScreenHeader variant="back" title={t('schedule:detail')} />

      <ScrollView contentContainerStyle={styles.content}>
        <View style={[styles.card, { backgroundColor: colors.surface }, softShadow(colors)]}>
          <InfoRow label={t('schedule:hospital')} value={schedule.hospitalName} colors={colors} />
          {schedule.doctorName && (
            <InfoRow label={t('schedule:doctor')} value={t('schedule:doctor_with_suffix', { name: schedule.doctorName })} colors={colors} />
          )}
          <InfoRow label={t('schedule:datetime')} value={formatDateTime(schedule.scheduledAt, t)} colors={colors} />
          {schedule.memo && <InfoRow label={t('schedule:memo')} value={schedule.memo} multiline colors={colors} />}
        </View>

        {/* 진료 사건 타임라인 — 준비 → 방문 → 기록 */}
        <View style={[styles.timelineCard, { backgroundColor: colors.surface }, softShadow(colors)]}>
          <Text style={[styles.timelineTitle, { color: colors.textSub, fontFamily: fontFamily.bold }]}>
            {t('schedule:event_timeline_title')}
          </Text>

          {/* 1단계: 준비 메모 */}
          <View style={styles.timelineRow}>
            <View style={[
              styles.timelineDot,
              { backgroundColor: prepNotes.length > 0 ? colors.success : colors.divider },
            ]}>
              <Ionicons
                name={prepNotes.length > 0 ? 'checkmark' : 'create-outline'}
                size={12}
                color={prepNotes.length > 0 ? '#fff' : colors.textSub}
              />
            </View>
            <View style={styles.timelineContent}>
              <Text style={[styles.timelineLabel, { color: colors.text, fontFamily: fontFamily.semibold }]}>
                {t('schedule:timeline_prep')}
                {prepNotes.length > 0 && (
                  <Text style={{ color: colors.success, fontFamily: fontFamily.medium }}>{` ${t('schedule:count_suffix', { count: prepNotes.length })}`}</Text>
                )}
              </Text>
              <TouchableOpacity
                onPress={() => navigation.navigate('PrepNoteForm', { scheduleId: String(scheduleId) })}
                hitSlop={8}
              >
                <Text style={[styles.timelineAction, { color: colors.primary }]}>
                  {prepNotes.length > 0 ? t('common:add') : t('schedule:add_prep_note')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={[styles.timelineLine, { backgroundColor: colors.divider }]} />

          {/* 2단계: 진료 방문 */}
          <View style={styles.timelineRow}>
            <View style={[
              styles.timelineDot,
              { backgroundColor: isPastSchedule ? colors.secondary : colors.primaryLight },
            ]}>
              <Ionicons name="medical" size={12} color="#fff" />
            </View>
            <View style={styles.timelineContent}>
              <Text style={[styles.timelineLabel, { color: colors.text, fontFamily: fontFamily.semibold }]}>
                {t('schedule:timeline_visit')}
              </Text>
              <Text style={[styles.timelineSub, { color: colors.textSub }]}>
                {formatDateTime(schedule.scheduledAt, t)}
              </Text>
            </View>
          </View>

          <View style={[styles.timelineLine, { backgroundColor: colors.divider }]} />

          {/* 3단계: 진료 기록 */}
          <View style={styles.timelineRow}>
            <View style={[styles.timelineDot, { backgroundColor: colors.divider }]}>
              <Ionicons name="document-text-outline" size={12} color={colors.textSub} />
            </View>
            <View style={styles.timelineContent}>
              <Text style={[styles.timelineLabel, { color: colors.text, fontFamily: fontFamily.semibold }]}>
                {t('schedule:timeline_record')}
              </Text>
              <TouchableOpacity onPress={handleLinkRecord} hitSlop={8}>
                <Text style={[styles.timelineAction, { color: colors.secondary }]}>
                  {t('schedule:connect_record')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* 준비 메모 목록 */}
        {prepNotes.length > 0 && (
          <View style={[styles.prepNoteSection, { backgroundColor: colors.surface, borderRadius: sizes.radius.xxl }, softShadow(colors)]}>
            <View style={styles.prepNoteHeader}>
              <Text style={[styles.prepNoteSectionTitle, { color: colors.textSub, fontFamily: fontFamily.bold }]}>{t('schedule:prep_note_title')}</Text>
            </View>
            {prepNotes.map((note) => {
              // content가 없으면 첫 번째 섹션 텍스트를 미리보기로
              const preview = note.content?.trim() ||
                note.sections?.moodChanges?.trim() ||
                note.sections?.newSymptoms?.trim() ||
                note.sections?.sideEffects?.trim() ||
                (note.sections?.questions?.[0] ? `Q. ${note.sections.questions[0]}` : '') ||
                '';
              const linkedCount = note.linkedNoteIds?.length ?? 0;
              return (
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
                    {preview || t('schedule:prep_note_empty_preview', { defaultValue: '(내용 없음)' })}
                  </Text>
                  {linkedCount > 0 && (
                    <View style={[styles.linkedBadge, { backgroundColor: colors.primaryMuted }]}>
                      <Ionicons name="chatbubble-outline" size={11} color={colors.primary} />
                      <Text style={[styles.linkedBadgeText, { color: colors.primary }]}>
                        {t('schedule:daily_note_linked', { count: linkedCount, defaultValue: `하루 메모 ${linkedCount}개` })}
                      </Text>
                    </View>
                  )}
                </AnimatedPressable>
              );
            })}
          </View>
        )}

        <View style={styles.actions}>
          <AnimatedPressable
            style={[styles.actionBtn, { backgroundColor: colors.primary }]}
            onPress={() => navigation.navigate('ScheduleForm', { schedule })}
          >
            <Text style={[styles.actionBtnText, { color: colors.textInverse, fontFamily: fontFamily.semibold }]}>{t('common:edit')}</Text>
          </AnimatedPressable>
          <AnimatedPressable
            style={[styles.actionBtn, { backgroundColor: colors.errorLight, borderWidth: 1, borderColor: colors.error }]}
            onPress={handleDelete}
            disabled={isDeleting}
          >
            <Text style={[styles.actionBtnText, { color: colors.error, fontFamily: fontFamily.semibold }]}>{isDeleting ? t('common:deleting') : t('common:delete')}</Text>
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
  linkedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: sizes.radius.full,
    marginTop: sizes.spacing.xs,
  },
  linkedBadgeText: {
    fontSize: sizes.font.xs,
    fontFamily: fontFamily.medium,
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
  timelineCard: {
    borderRadius: sizes.radius.xxl,
    padding: sizes.spacing.lg,
    gap: 0,
  },
  timelineTitle: {
    fontSize: sizes.font.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: sizes.spacing.md,
  },
  timelineRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: sizes.spacing.md,
  },
  timelineDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  timelineLine: {
    width: 2,
    height: 20,
    marginLeft: 11,
    marginVertical: 4,
  },
  timelineContent: {
    flex: 1,
    paddingBottom: 4,
  },
  timelineLabel: {
    fontSize: sizes.font.md,
    marginBottom: 2,
  },
  timelineAction: {
    fontSize: sizes.font.sm,
  },
  timelineSub: {
    fontSize: sizes.font.sm,
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
