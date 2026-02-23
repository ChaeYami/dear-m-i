import React, { useState, useRef, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  FlatList,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { useTranslation } from 'react-i18next';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme, sizes, fontFamily } from '@/shared/theme';
import { softShadow } from '@/shared/theme/shadows';
import { AnimatedPressable } from '@/shared/components/AnimatedPressable';
import { ScreenHeader } from '@/shared/components/ScreenHeader';
import { EmotionGraph } from '@/features/checkin/components/EmotionGraph';
import { DailyCheckinForm } from '@/features/checkin/components/DailyCheckinForm';
import { useCheckinHistory, useCreateCheckin } from '@/features/checkin/hooks/useCheckin';
import { useDailyNotes, useCreateDailyNote, useDeleteDailyNote } from '@/features/checkin/hooks/useDailyNote';
import { useRecentSchedules } from '@/features/record/hooks/useRecord';
import { useResetStackOnTabFocus } from '@/shared/hooks/useResetStackOnTabFocus';
import { useTabBarSafeBottom } from '@/shared/hooks/useTabBarSafeBottom';
import { useTabBarScrollHide } from '@/shared/hooks/useTabBarScrollHide';
import { getEmotionColor } from '@/shared/components/EmotionSlider';
import { customAlert } from '@/shared/components/CustomAlert';
import type { CheckinStackParamList } from '@/navigation/CheckinNavigator';
import type { DailyNoteType, DailyCheckin } from '@/shared/types/domain.types';
import { navigationRef } from '@/navigation/navigationRef';

type Nav = StackNavigationProp<CheckinStackParamList, 'CheckinHome'>;

const toLocalDateStr = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const getTodayStr = () => toLocalDateStr(new Date());

const generateDates = (days: number): string[] => {
  const dates: string[] = [];
  const today = new Date();
  for (let i = 0; i < days; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    dates.push(toLocalDateStr(d));
  }
  return dates;
};

const useDayNames = () => {
  const { t } = useTranslation('common');
  return useMemo(
    () => [
      t('weekday_sun'), t('weekday_mon'), t('weekday_tue'), t('weekday_wed'),
      t('weekday_thu'), t('weekday_fri'), t('weekday_sat'),
    ],
    [t],
  );
};

// 감정 점수 → 색상 레이블 (이모지 대신 숫자 점수 표시)
const NOTE_TYPE_CONFIG: Array<{ type: DailyNoteType; icon: keyof typeof Ionicons.glyphMap; labelKey: string }> = [
  { type: 'FEELING', icon: 'heart-outline', labelKey: 'note_type_feeling' },
  { type: 'SYMPTOM', icon: 'medical-outline', labelKey: 'note_type_symptom' },
  { type: 'QUESTION', icon: 'help-circle-outline', labelKey: 'note_type_question' },
  { type: 'SIDE_EFFECT', icon: 'warning-outline', labelKey: 'note_type_side_effect' },
  { type: 'OTHER', icon: 'create-outline', labelKey: 'note_type_other' },
];

const getNoteTypeConfig = (type: DailyNoteType) =>
  NOTE_TYPE_CONFIG.find((c) => c.type === type) ?? NOTE_TYPE_CONFIG[4];

const formatNoteTime = (createdAt: string) => {
  const d = new Date(createdAt);
  const now = new Date();
  const isToday =
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate();
  const h = String(d.getHours()).padStart(2, '0');
  const m = String(d.getMinutes()).padStart(2, '0');
  if (isToday) return `오늘 ${h}:${m}`;
  const mo = d.getMonth() + 1;
  const da = d.getDate();
  return `${mo}/${da} ${h}:${m}`;
};

export const CheckinHomeScreen: React.FC = () => {
  useResetStackOnTabFocus();
  const { colors } = useTheme();
  const navigation = useNavigation<Nav>();
  const { t } = useTranslation('checkin');
  const { t: tCommon } = useTranslation('common');
  const DAY_NAMES = useDayNames();
  const tabBarSafeBottom = useTabBarSafeBottom();
  const scrollHandlers = useTabBarScrollHide();

  const todayStr = getTodayStr();
  const dates = useMemo(() => generateDates(30), []);

  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [showCheckinForm, setShowCheckinForm] = useState(false);

  // 스레드 메모 입력 상태
  const [noteBody, setNoteBody] = useState('');
  const [noteType, setNoteType] = useState<DailyNoteType>('FEELING');
  const [showTypePicker, setShowTypePicker] = useState(false);
  const noteInputRef = useRef<TextInput>(null);

  // 30일 체크인 이력
  const startDate30 = dates[dates.length - 1];
  const { data: history, isLoading: historyLoading } = useCheckinHistory(startDate30, todayStr);

  // 선택된 날짜의 스레드 메모 (해당 날짜 기준 ±0)
  const { data: dailyNotes = [], isLoading: notesLoading } = useDailyNotes(selectedDate, selectedDate);

  // 다음 가까운 진료 일정 (배너용)
  const { data: upcomingSchedules = [] } = useRecentSchedules('FUTURE');
  const nextSchedule = upcomingSchedules[0] ?? null;
  const daysUntilNext = useMemo(() => {
    if (!nextSchedule) return null;
    const diff = Math.ceil(
      (new Date(nextSchedule.scheduledAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24),
    );
    return diff >= 0 ? diff : null;
  }, [nextSchedule]);

  const { mutate: createNote, isPending: isCreatingNote } = useCreateDailyNote();
  const { mutate: deleteNote } = useDeleteDailyNote();
  const { mutate: upsertCheckin } = useCreateCheckin();

  const checkinMap = useMemo(() => {
    const map = new Map<string, DailyCheckin>();
    history?.content?.forEach((c) => map.set(c.checkedAt, c));
    return map;
  }, [history]);

  const selectedCheckin = checkinMap.get(selectedDate) ?? null;
  const isToday = selectedDate === todayStr;

  const handleEmotionTap = useCallback(
    (score: number) => {
      upsertCheckin({
        emotionScore: score,
        checkedAt: selectedDate,
      });
    },
    [upsertCheckin, selectedDate],
  );

  const handleSendNote = useCallback(() => {
    const body = noteBody.trim();
    if (!body) return;
    createNote(
      { body, noteType, noteDate: selectedDate },
      {
        onSuccess: () => setNoteBody(''),
        onError: () => customAlert('오류', '메모를 저장하지 못했습니다.'),
      },
    );
  }, [noteBody, noteType, selectedDate, createNote]);

  const handleDeleteNote = useCallback(
    (id: string) => {
      customAlert('메모 삭제', '이 메모를 삭제할까요?', [
        { text: tCommon('cancel'), style: 'cancel' },
        { text: tCommon('delete'), style: 'destructive', onPress: () => deleteNote(id) },
      ]);
    },
    [deleteNote, tCommon],
  );

  const styles = useMemo(() => makeStyles(colors, tabBarSafeBottom), [colors, tabBarSafeBottom]);

  const dynamicStyles = useMemo(
    () => ({
      dateItemToday: { borderColor: colors.primary, borderWidth: 2 },
      dateItemHasCheckin: {
        backgroundColor: colors.primaryMuted,
        borderColor: colors.primary + '60',
        borderWidth: 1.5,
      },
      dateItemSelected: {
        backgroundColor: colors.primary,
        borderColor: colors.primary,
        ...softShadow(colors),
      },
    }),
    [colors],
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScreenHeader
        variant="tab"
        title={t('title')}
        hasNotification
        searchScope="CHECKIN"
      />

      {/* 날짜 스크롤 바 */}
      <FlatList
        data={dates}
        horizontal
        inverted
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item}
        style={styles.dateBarWrapper}
        contentContainerStyle={styles.dateBar}
        renderItem={({ item }) => {
          const d = new Date(item);
          const dayName = DAY_NAMES[d.getDay()];
          const dayNum = d.getDate();
          const isSelected = item === selectedDate;
          const hasCheckin = checkinMap.has(item);
          const isSunday = d.getDay() === 0;
          const isItemToday = item === todayStr;
          return (
            <View style={styles.dateCol}>
              <Text style={[styles.dateDayName, isSunday && { color: colors.error }]}>
                {dayName}
              </Text>
              <TouchableOpacity
                style={[
                  styles.dateItem,
                  isItemToday && !isSelected && dynamicStyles.dateItemToday,
                  hasCheckin && !isSelected && dynamicStyles.dateItemHasCheckin,
                  isSelected && dynamicStyles.dateItemSelected,
                ]}
                onPress={() => setSelectedDate(item)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.dateDayNum,
                    isSelected && { color: colors.textInverse },
                    hasCheckin && !isSelected && { color: colors.primary },
                  ]}
                >
                  {dayNum}
                </Text>
              </TouchableOpacity>
              {hasCheckin ? (
                <Ionicons
                  name="checkmark-circle"
                  size={10}
                  color={isSelected ? 'rgba(255,255,255,0.75)' : colors.primary}
                  style={{ marginTop: 2 }}
                />
              ) : (
                <View style={{ width: 10, height: 10, marginTop: 2 }} />
              )}
            </View>
          );
        }}
      />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          {...scrollHandlers}
        >
          {/* ── 오늘의 기분 (이모지 빠른 탭) ── */}
          <View style={[styles.card, softShadow(colors)]}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>{isToday ? '오늘의 기분' : `${new Date(selectedDate).getMonth() + 1}/${new Date(selectedDate).getDate()} 기분`}</Text>
              {selectedCheckin && (
                <TouchableOpacity onPress={() => setShowCheckinForm(true)} hitSlop={8}>
                  <Ionicons name="create-outline" size={18} color={colors.primary} />
                </TouchableOpacity>
              )}
            </View>

            {/* 감정 점수 선택 바 — 항상 표시, 현재 값 하이라이트 */}
            <View style={styles.emojiRow}>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((score) => {
                const isSelected = selectedCheckin?.emotionScore === score;
                const color = getEmotionColor(score);
                return (
                  <TouchableOpacity
                    key={score}
                    onPress={() => handleEmotionTap(score)}
                    style={[
                      styles.emojiBtn,
                      isSelected && { backgroundColor: color + '30', borderRadius: sizes.radius.full },
                    ]}
                    activeOpacity={0.7}
                  >
                    <View style={[
                      styles.scoreCircle,
                      { borderColor: isSelected ? color : colors.divider },
                      isSelected && { backgroundColor: color },
                    ]}>
                      <Text style={[styles.scoreText, { color: isSelected ? '#fff' : colors.textSub }]}>
                        {score}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>

            {!selectedCheckin && (
              <Text style={styles.emojiHint}>탭해서 기분을 기록하세요</Text>
            )}

            {/* 상세 폼 바로가기 */}
            {selectedCheckin && (
              <TouchableOpacity onPress={() => setShowCheckinForm(true)} style={styles.detailBtn}>
                <Text style={styles.detailBtnText}>수면 · 복약 기록하기</Text>
                <Ionicons name="chevron-forward" size={14} color={colors.primary} />
              </TouchableOpacity>
            )}
            {!selectedCheckin && isToday && (
              <TouchableOpacity onPress={() => setShowCheckinForm(true)} style={styles.detailBtn}>
                <Text style={styles.detailBtnText}>수면 · 복약도 기록하기</Text>
                <Ionicons name="chevron-forward" size={14} color={colors.primary} />
              </TouchableOpacity>
            )}
          </View>

          {/* ── 다음 진료 배너 ── */}
          {nextSchedule && daysUntilNext !== null && daysUntilNext <= 7 && (
            <TouchableOpacity
              style={[styles.schedBanner, softShadow(colors)]}
              onPress={() =>
                (navigationRef.current as any)?.navigate('Main', {
                  screen: 'Care',
                  params: { screen: 'PrepNoteForm', params: { scheduleId: String(nextSchedule.id) } },
                })
              }
              activeOpacity={0.85}
            >
              <View style={styles.schedBannerLeft}>
                <Ionicons name="medical" size={22} color={colors.primary} />
                <View>
                  <Text style={styles.schedBannerTitle}>
                    {daysUntilNext === 0 ? '오늘 진료' : `진료 ${daysUntilNext}일 전`}
                  </Text>
                  <Text style={styles.schedBannerSub} numberOfLines={1}>
                    {nextSchedule.hospitalName}
                  </Text>
                </View>
              </View>
              <View style={styles.schedBannerCta}>
                <Text style={styles.schedBannerCtaText}>준비 메모</Text>
                <Ionicons name="chevron-forward" size={14} color={colors.primary} />
              </View>
            </TouchableOpacity>
          )}

          {/* ── 스레드 메모 피드 ── */}
          <View style={styles.threadSection}>
            <Text style={styles.sectionTitle}>메모</Text>

            {/* 입력창 */}
            <View style={[styles.noteInputCard, softShadow(colors)]}>
              {/* 타입 선택 버튼 */}
              <TouchableOpacity
                style={styles.noteTypeBtn}
                onPress={() => setShowTypePicker(true)}
                activeOpacity={0.7}
              >
                <Ionicons name={getNoteTypeConfig(noteType).icon} size={16} color={colors.primary} />
                <Ionicons name="chevron-down" size={12} color={colors.textSub} />
              </TouchableOpacity>

              <TextInput
                ref={noteInputRef}
                style={styles.noteInput}
                placeholder="지금 느끼는 것, 증상, 궁금한 것…"
                placeholderTextColor={colors.textDisabled}
                value={noteBody}
                onChangeText={setNoteBody}
                multiline
                maxLength={300}
                returnKeyType="default"
              />
              <TouchableOpacity
                style={[styles.sendBtn, !noteBody.trim() && { opacity: 0.4 }]}
                onPress={handleSendNote}
                disabled={!noteBody.trim() || isCreatingNote}
                activeOpacity={0.8}
              >
                <Ionicons name="arrow-up-circle" size={28} color={colors.primary} />
              </TouchableOpacity>
            </View>

            {/* 노트 목록 */}
            {notesLoading ? null : dailyNotes.length === 0 ? (
              <View style={styles.emptyNotes}>
                <Text style={styles.emptyNotesText}>아직 메모가 없어요</Text>
              </View>
            ) : (
              <View style={styles.noteList}>
                {dailyNotes.map((note) => {
                  const cfg = getNoteTypeConfig(note.noteType);
                  return (
                    <View key={note.id} style={[styles.noteCard, softShadow(colors)]}>
                      <View style={styles.noteCardHeader}>
                        <View style={styles.noteTypeBadge}>
                          <Ionicons name={cfg.icon} size={12} color={colors.primary} />
                          <Text style={styles.noteTypeBadgeLabel}>
                            {t(cfg.labelKey as any, { defaultValue: cfg.type })}
                          </Text>
                        </View>
                        <Text style={styles.noteTime}>{formatNoteTime(note.createdAt)}</Text>
                        <TouchableOpacity
                          onPress={() => handleDeleteNote(note.id)}
                          hitSlop={8}
                          style={{ marginLeft: 8 }}
                        >
                          <Ionicons name="trash-outline" size={15} color={colors.textDisabled} />
                        </TouchableOpacity>
                      </View>
                      <Text style={styles.noteBody}>{note.body}</Text>
                      {note.usedInPrepNoteId && (
                        <Text style={styles.noteUsed}>진료 준비 메모에 사용됨</Text>
                      )}
                    </View>
                  );
                })}
              </View>
            )}
          </View>

          {/* ── 감정 그래프 ── */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('emotion_trend')}</Text>
            <EmotionGraph />
          </View>

          {/* 전체 기록 */}
          <AnimatedPressable
            onPress={() => navigation.navigate('CheckinHistory')}
            style={[styles.historyLink, softShadow(colors)]}
          >
            <Text style={styles.historyLinkText}>{t('view_all')}</Text>
            <Ionicons name="chevron-forward" size={16} color={colors.primary} />
          </AnimatedPressable>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* 체크인 상세 폼 모달 */}
      <Modal visible={showCheckinForm} animationType="slide" presentationStyle="pageSheet">
        <DailyCheckinForm
          existingCheckin={selectedCheckin}
          targetDate={selectedDate}
          onClose={() => setShowCheckinForm(false)}
        />
      </Modal>

      {/* 노트 타입 선택 시트 */}
      <Modal visible={showTypePicker} transparent animationType="slide" onRequestClose={() => setShowTypePicker(false)}>
        <Pressable style={styles.pickerBackdrop} onPress={() => setShowTypePicker(false)}>
          <View style={[styles.pickerSheet, { backgroundColor: colors.surface }]}>
            <Text style={styles.pickerTitle}>메모 종류</Text>
            {NOTE_TYPE_CONFIG.map((cfg) => (
              <TouchableOpacity
                key={cfg.type}
                style={[
                  styles.pickerRow,
                  noteType === cfg.type && { backgroundColor: colors.primaryMuted },
                ]}
                onPress={() => {
                  setNoteType(cfg.type);
                  setShowTypePicker(false);
                }}
              >
                <Ionicons name={cfg.icon} size={20} color={noteType === cfg.type ? colors.primary : colors.textSub} style={styles.pickerIcon} />
                <Text style={[styles.pickerLabel, { color: colors.text }]}>
                  {t(cfg.labelKey as any, { defaultValue: cfg.type })}
                </Text>
                {noteType === cfg.type && (
                  <Ionicons name="checkmark" size={18} color={colors.primary} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
};

const makeStyles = (colors: ReturnType<typeof useTheme>['colors'], tabBarSafeBottom: number) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    dateBarWrapper: { flexGrow: 0, flexShrink: 0 },
    dateBar: {
      paddingHorizontal: sizes.spacing.md,
      paddingTop: sizes.spacing.sm,
      paddingBottom: sizes.spacing.md,
      gap: sizes.spacing.sm,
    },
    dateCol: { alignItems: 'center', gap: 4 },
    dateDayName: { fontSize: 10, fontFamily: fontFamily.medium, color: colors.textSub },
    dateItem: {
      width: 48, height: 48, borderRadius: sizes.radius.full,
      alignItems: 'center', justifyContent: 'center',
      borderWidth: 1.5, borderColor: 'transparent',
      backgroundColor: colors.surface,
    },
    dateDayNum: { fontSize: sizes.font.md, fontFamily: fontFamily.bold, color: colors.text },
    content: {
      paddingHorizontal: sizes.spacing.lg,
      paddingTop: sizes.spacing.md,
      gap: sizes.spacing.lg,
      paddingBottom: tabBarSafeBottom + 16,
    },
    // 기분 카드
    card: {
      backgroundColor: colors.surface,
      borderRadius: sizes.radius.xxl,
      padding: 20,
      gap: sizes.spacing.sm,
    },
    cardHeader: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    },
    cardTitle: {
      fontSize: sizes.font.md, fontFamily: fontFamily.bold, color: colors.text,
    },
    emojiRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingVertical: 4,
    },
    emojiBtn: {
      padding: 2,
      alignItems: 'center',
      justifyContent: 'center',
    },
    scoreCircle: {
      width: 28,
      height: 28,
      borderRadius: sizes.radius.full,
      borderWidth: 1.5,
      alignItems: 'center',
      justifyContent: 'center',
    },
    scoreText: {
      fontSize: 11,
      fontFamily: fontFamily.bold,
    },
    emojiHint: {
      fontSize: sizes.font.xs,
      color: colors.textDisabled,
      textAlign: 'center',
      fontFamily: fontFamily.regular,
    },
    detailBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingTop: 4,
      gap: 4,
    },
    detailBtnText: {
      fontSize: sizes.font.xs,
      color: colors.primary,
      fontFamily: fontFamily.medium,
    },
    // 배너
    schedBanner: {
      backgroundColor: colors.surface,
      borderRadius: sizes.radius.xl,
      paddingHorizontal: sizes.spacing.md,
      paddingVertical: sizes.spacing.sm + 2,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    schedBannerLeft: { flexDirection: 'row', alignItems: 'center', gap: sizes.spacing.sm },
    schedBannerTitle: {
      fontSize: sizes.font.sm, fontFamily: fontFamily.bold, color: colors.text,
    },
    schedBannerSub: {
      fontSize: sizes.font.xs, color: colors.textSub, fontFamily: fontFamily.regular,
    },
    schedBannerCta: { flexDirection: 'row', alignItems: 'center', gap: 2 },
    schedBannerCtaText: {
      fontSize: sizes.font.sm, color: colors.primary, fontFamily: fontFamily.semibold,
    },
    // 스레드 섹션
    threadSection: { gap: sizes.spacing.md },
    sectionTitle: {
      fontSize: sizes.font.md, fontFamily: fontFamily.bold, color: colors.text,
    },
    noteInputCard: {
      backgroundColor: colors.surface,
      borderRadius: sizes.radius.xl,
      flexDirection: 'row',
      alignItems: 'flex-end',
      paddingHorizontal: sizes.spacing.sm,
      paddingVertical: sizes.spacing.sm,
      gap: sizes.spacing.xs,
    },
    noteTypeBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 2,
      paddingHorizontal: sizes.spacing.xs,
      paddingVertical: 6,
      borderRadius: sizes.radius.md,
      backgroundColor: colors.background,
    },
    noteInput: {
      flex: 1,
      fontSize: sizes.font.md,
      color: colors.text,
      maxHeight: 100,
      paddingVertical: 6,
      lineHeight: 20,
    },
    sendBtn: { paddingBottom: 2 },
    emptyNotes: { alignItems: 'center', paddingVertical: sizes.spacing.lg },
    emptyNotesText: {
      fontSize: sizes.font.sm, color: colors.textDisabled, fontFamily: fontFamily.regular,
    },
    noteList: { gap: sizes.spacing.sm },
    noteCard: {
      backgroundColor: colors.surface,
      borderRadius: sizes.radius.xl,
      padding: sizes.spacing.md,
      gap: sizes.spacing.xs,
    },
    noteCardHeader: {
      flexDirection: 'row', alignItems: 'center', gap: sizes.spacing.xs,
    },
    noteTypeBadge: {
      flexDirection: 'row', alignItems: 'center', gap: 4,
      backgroundColor: colors.background,
      paddingHorizontal: 8, paddingVertical: 3,
      borderRadius: sizes.radius.full,
    },
    noteTypeBadgeLabel: {
      fontSize: sizes.font.xs, color: colors.textSub, fontFamily: fontFamily.medium,
    },
    noteTime: {
      flex: 1, fontSize: sizes.font.xs, color: colors.textDisabled,
      textAlign: 'right', fontFamily: fontFamily.regular,
    },
    noteBody: {
      fontSize: sizes.font.md, color: colors.text, lineHeight: 22,
      fontFamily: fontFamily.regular,
    },
    noteUsed: {
      fontSize: sizes.font.xs, color: colors.primary, fontFamily: fontFamily.medium,
    },
    // 그래프/기록
    section: { gap: sizes.spacing.sm },
    historyLink: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.surface,
      borderRadius: sizes.radius.xxl,
      padding: sizes.spacing.md,
    },
    historyLinkText: {
      fontSize: sizes.font.md, fontFamily: fontFamily.semibold, color: colors.primary,
    },
    // 타입 선택 시트
    pickerBackdrop: {
      flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end',
    },
    pickerSheet: {
      borderTopLeftRadius: sizes.radius.xxl,
      borderTopRightRadius: sizes.radius.xxl,
      paddingHorizontal: sizes.spacing.lg,
      paddingTop: sizes.spacing.md,
      paddingBottom: sizes.spacing.xl,
      gap: sizes.spacing.xs,
    },
    pickerTitle: {
      fontSize: sizes.font.md, fontFamily: fontFamily.bold, color: colors.text,
      paddingBottom: sizes.spacing.sm,
    },
    pickerRow: {
      flexDirection: 'row', alignItems: 'center', gap: sizes.spacing.sm,
      paddingVertical: sizes.spacing.sm,
      paddingHorizontal: sizes.spacing.sm,
      borderRadius: sizes.radius.md,
    },
    pickerIcon: { width: 28, textAlign: 'center' },
    pickerLabel: { flex: 1, fontSize: sizes.font.md, fontFamily: fontFamily.regular },
  });
