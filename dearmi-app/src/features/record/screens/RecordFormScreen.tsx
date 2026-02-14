import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { DatePickerModal } from '@/features/schedule/components/DatePickerModal';
import type { StackNavigationProp } from '@react-navigation/stack';
import { customAlert } from '@/shared/components/CustomAlert';
import { useTheme, sizes, fontFamily } from '@/shared/theme';
import { ScreenHeader } from '@/shared/components/ScreenHeader';
import { EmotionSlider } from '@/shared/components/EmotionSlider';
import { useCreateRecord, useUpdateRecord, useRecordDetail, useRecentSchedules } from '@/features/record/hooks/useRecord';
import { usePrepNotesBySchedule } from '@/features/prepnote/hooks/usePrepNote';
import { useCheckinSummary } from '@/features/checkin/hooks/useCheckin';
import { getEmotionColor } from '@/shared/components/EmotionSlider';
import { useAuthStore } from '@/features/auth/store/authStore';
import { useUnsavedChangesWarning } from '@/shared/hooks/useUnsavedChangesWarning';
import { LoadingSpinner } from '@/shared/components/LoadingSpinner';
import { prescriptionApi } from '@/features/prescription/api';
import type { CareStackParamList as RecordStackParamList } from '@/navigation/CareNavigator';

type Nav = StackNavigationProp<RecordStackParamList, 'RecordForm'>;
type Route = RouteProp<RecordStackParamList, 'RecordForm'>;

const FREE_CONTENT_LIMIT = 200;

export const RecordFormScreen: React.FC = () => {
  const { colors } = useTheme();
  const navigation = useNavigation<Nav>();
  const params = useRoute<Route>().params;
  const scheduleIdFromNav = params?.scheduleId;
  const consultedAtFromNav = params?.consultedAt;
  const recordId = params?.recordId;
  const isEdit = Boolean(recordId);

  const user = useAuthStore((s) => s.user);
  const isPremium = user?.plan === 'PREMIUM';
  const contentLimit = isPremium ? undefined : FREE_CONTENT_LIMIT;

  const { data: existingRecord, isLoading: isLoadingRecord } = useRecordDetail(recordId ?? '');
  const { data: recentSchedules = [] } = useRecentSchedules('PAST');
  const { mutate: createRecord, isPending: isCreating } = useCreateRecord();
  const { mutate: updateRecord, isPending: isUpdating } = useUpdateRecord();
  const isPending = isCreating || isUpdating;
  const [saveSuccess, setSaveSuccess] = useState(false);

  const [selectedScheduleId, setSelectedScheduleId] = useState<string | undefined>(
    scheduleIdFromNav ?? existingRecord?.scheduleId
  );
  const [emotionScore, setEmotionScore] = useState<number>(
    existingRecord?.emotionScore ?? 5
  );
  const [content, setContent] = useState(existingRecord?.content ?? '');
  const [tags, setTags] = useState<string[]>(existingRecord?.tags ?? []);
  const [tagInput, setTagInput] = useState('');
  const [showSchedulePicker, setShowSchedulePicker] = useState(false);
  const [showPrepNotes, setShowPrepNotes] = useState(false);
  const [showCheckinSummary, setShowCheckinSummary] = useState(false);

  // 일정 미연결 시 직접 선택할 진료 날짜 (처방전에서 진입 시 prescribedAt 으로 초기화)
  const [consultedAt, setConsultedAt] = useState<Date | null>(
    existingRecord?.consultedAt
      ? new Date(existingRecord.consultedAt)
      : consultedAtFromNav
      ? new Date(consultedAtFromNav + 'T00:00:00')
      : null
  );
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [hydrated, setHydrated] = useState(!isEdit);

  // 편집 모드: 비동기 로드된 existingRecord 로 폼 상태 초기화 (1회)
  useEffect(() => {
    if (!isEdit || !existingRecord || hydrated) return;
    setSelectedScheduleId(existingRecord.scheduleId);
    setEmotionScore(existingRecord.emotionScore ?? 5);
    setContent(existingRecord.content ?? '');
    setTags(existingRecord.tags ?? []);
    setConsultedAt(existingRecord.consultedAt ? new Date(existingRecord.consultedAt) : null);
    setHydrated(true);
  }, [isEdit, existingRecord, hydrated]);

  // 변경사항 추적 → 이탈 경고 (편집 모드는 hydrate 후에만)
  const isDirty = hydrated && (
    content.trim() !== (existingRecord?.content ?? '') ||
    emotionScore !== (existingRecord?.emotionScore ?? 5) ||
    JSON.stringify(tags) !== JSON.stringify(existingRecord?.tags ?? []) ||
    selectedScheduleId !== (isEdit ? existingRecord?.scheduleId : scheduleIdFromNav) ||
    (consultedAt?.toISOString().split('T')[0] ?? null) !== (existingRecord?.consultedAt ?? null)
  );

  const { markSavedAndExit } = useUnsavedChangesWarning({ isDirty });

  // 처방전 첨부
  const [rxImage, setRxImage] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [rxUploading, setRxUploading] = useState(false);
  const [rxDone, setRxDone] = useState(false);

  const { data: checkinSummary } = useCheckinSummary();

  const { data: prepNotes = [] } = usePrepNotesBySchedule(
    selectedScheduleId ? String(selectedScheduleId) : undefined
  );

  // ─── 처방전 첨부 ─────────────────────────────────────────────
  const pickRxImage = async () => {
    customAlert('처방전 사진', '', [
      {
        text: '카메라로 촬영',
        onPress: async () => {
          const { status } = await ImagePicker.requestCameraPermissionsAsync();
          if (status !== 'granted') { customAlert('권한 필요', '카메라 접근 권한이 필요합니다.'); return; }
          const r = await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.85 });
          if (!r.canceled && r.assets.length > 0) setRxImage(r.assets[0]);
        },
      },
      {
        text: '갤러리에서 선택',
        onPress: async () => {
          const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
          if (status !== 'granted') { customAlert('권한 필요', '갤러리 접근 권한이 필요합니다.'); return; }
          const r = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.85 });
          if (!r.canceled && r.assets.length > 0) setRxImage(r.assets[0]);
        },
      },
      { text: '취소', style: 'cancel' },
    ]);
  };

  const uploadRx = async () => {
    if (!rxImage || !isPremium) return;
    setRxUploading(true);
    try {
      const mimeType = rxImage.mimeType ?? 'image/jpeg';
      const ext = mimeType === 'image/png' ? 'png' : 'jpg';
      const { data: presignedRes } = await prescriptionApi.getPresignedUrl(`prescription.${ext}`, mimeType);
      if (!presignedRes.success || !presignedRes.data) throw new Error('업로드 URL 발급 실패');
      const { s3Key, uploadUrl } = presignedRes.data;
      await prescriptionApi.uploadToS3(uploadUrl, rxImage.uri, mimeType, () => {});
      const prescribedAt = selectedSchedule
        ? selectedSchedule.scheduledAt.split('T')[0]
        : consultedAt
        ? `${consultedAt.getFullYear()}-${String(consultedAt.getMonth() + 1).padStart(2, '0')}-${String(consultedAt.getDate()).padStart(2, '0')}`
        : new Date().toISOString().split('T')[0];
      await prescriptionApi.createPrescription({ s3Key, prescribedAt });
      setRxDone(true);
    } catch (e) {
      customAlert('처방전 업로드 실패', e instanceof Error ? e.message : '다시 시도해 주세요.');
    } finally {
      setRxUploading(false);
    }
  };

  const handleAddTag = () => {
    const trimmed = tagInput.trim().replace(/^#/, '');
    if (trimmed && !tags.includes(trimmed)) {
      setTags((prev) => [...prev, trimmed]);
    }
    setTagInput('');
  };

  const handleRemoveTag = (tag: string) => {
    setTags((prev) => prev.filter((t) => t !== tag));
  };

  const handleSave = () => {
    if (!content.trim()) {
      customAlert('필수 입력', '내용을 입력해 주세요.');
      return;
    }
    if (contentLimit && content.length > contentLimit) {
      customAlert('글자 수 초과', `무료 플랜은 ${contentLimit}자까지 입력할 수 있습니다.`);
      return;
    }

    const formatLocalDate = (d: Date) => {
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${y}-${m}-${day}`;
    };

    const payload = {
      scheduleId: selectedScheduleId,
      content: content.trim(),
      emotionScore,
      tags: tags.length > 0 ? tags : undefined,
      // 일정 미연결이고 직접 날짜를 선택한 경우만 전송
      consultedAt: !selectedScheduleId && consultedAt ? formatLocalDate(consultedAt) : undefined,
    };

    const onSuccess = () => {
      setSaveSuccess(true);
      setTimeout(() => markSavedAndExit(), 800);
    };

    if (isEdit && recordId) {
      updateRecord({ id: recordId, data: payload }, { onSuccess });
    } else {
      createRecord(payload, { onSuccess });
    }
  };

  if (isEdit && isLoadingRecord) return <LoadingSpinner fullscreen />;

  const selectedSchedule = recentSchedules.find((s) => s.id === selectedScheduleId);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {saveSuccess && (
        <View style={[styles.successBanner, { backgroundColor: colors.successLight }]}>
          <Ionicons name="checkmark-circle" size={16} color={colors.success} />
          <Text style={[styles.successBannerText, { color: colors.success }]}>기록이 저장되었어요</Text>
        </View>
      )}
      <ScreenHeader
        variant="form"
        title={isEdit ? '기록 수정' : '기록 작성'}
        onCancel={() => navigation.goBack()}
        onSave={handleSave}
        saveDisabled={isPending || (!!contentLimit && content.length > contentLimit)}
      />

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {checkinSummary && checkinSummary.totalCheckins > 0 && (
          <View style={styles.summarySection}>
            <TouchableOpacity
              style={[styles.summaryToggle, { backgroundColor: colors.secondaryLight + '20', borderColor: colors.secondaryLight }]}
              onPress={() => setShowCheckinSummary((v) => !v)}
              activeOpacity={0.8}
            >
              <Text style={[styles.summaryToggleText, { color: colors.secondary }]}>
                진료 전 참고 — 이번 주 체크인 ({checkinSummary.totalCheckins}일)
              </Text>
              <Ionicons
                name={showCheckinSummary ? 'chevron-up' : 'chevron-down'}
                size={16}
                color={colors.secondary}
              />
            </TouchableOpacity>
            {showCheckinSummary && (
              <View style={[styles.summaryCard, { backgroundColor: colors.surface, borderColor: colors.divider }]}>
                {checkinSummary.averageEmotionScore != null && (
                  <View style={styles.summaryRow}>
                    <Text style={[styles.summaryLabel, { color: colors.textSub }]}>평균 감정</Text>
                    <Text
                      style={[
                        styles.summaryValue,
                        { color: getEmotionColor(Math.round(checkinSummary.averageEmotionScore)) },
                      ]}
                    >
                      {checkinSummary.averageEmotionScore.toFixed(1)}점
                    </Text>
                  </View>
                )}
                {checkinSummary.averageSleepHours != null && (
                  <View style={styles.summaryRow}>
                    <Text style={[styles.summaryLabel, { color: colors.textSub }]}>평균 수면</Text>
                    <Text style={[styles.summaryValue, { color: colors.text }]}>
                      {checkinSummary.averageSleepHours.toFixed(1)}시간
                    </Text>
                  </View>
                )}
                {checkinSummary.medicationRate != null && (
                  <View style={styles.summaryRow}>
                    <Text style={[styles.summaryLabel, { color: colors.textSub }]}>복약률</Text>
                    <Text style={[styles.summaryValue, { color: colors.text }]}>{checkinSummary.medicationRate}%</Text>
                  </View>
                )}
                {checkinSummary.topTriggerTags.length > 0 && (
                  <View style={styles.summaryRow}>
                    <Text style={[styles.summaryLabel, { color: colors.textSub }]}>주요 트리거</Text>
                    <Text style={[styles.summaryValue, { color: colors.text }]}>
                      {checkinSummary.topTriggerTags.join(', ')}
                    </Text>
                  </View>
                )}
              </View>
            )}
          </View>
        )}

        <View style={styles.field}>
          <Text style={[styles.fieldLabel, { color: colors.textSub }]}>연결 일정 (선택)</Text>
          <TouchableOpacity
            style={[styles.scheduleSelector, { backgroundColor: colors.surface, borderColor: colors.divider }]}
            onPress={() => setShowSchedulePicker((v) => !v)}
            activeOpacity={0.8}
          >
            <Text style={selectedSchedule ? [styles.scheduleName, { color: colors.text }] : [styles.schedulePlaceholder, { color: colors.textDisabled }]}>
              {selectedSchedule
                ? `${selectedSchedule.hospitalName} · ${formatDate(selectedSchedule.scheduledAt)}`
                : '일정 선택 (선택 사항)'}
            </Text>
            <Ionicons
              name={showSchedulePicker ? 'chevron-up' : 'chevron-down'}
              size={16}
              color={colors.textSub}
            />
          </TouchableOpacity>

          {showSchedulePicker && (
            <View style={[styles.dropdown, { backgroundColor: colors.surface, borderColor: colors.divider }]}>
              <TouchableOpacity
                style={[styles.dropdownItem, { borderBottomColor: colors.divider }]}
                onPress={() => {
                  setSelectedScheduleId(undefined);
                  setShowSchedulePicker(false);
                }}
              >
                <Text style={[styles.dropdownItemText, { color: colors.text }]}>선택 안 함</Text>
              </TouchableOpacity>
              {recentSchedules.length === 0 && (
                <View style={[styles.dropdownItem, { borderBottomColor: colors.divider }]}>
                  <Text style={[styles.dropdownItemText, { color: colors.textDisabled }]}>최근 일정이 없습니다</Text>
                </View>
              )}
              {recentSchedules.map((s) => (
                <TouchableOpacity
                  key={s.id}
                  style={[
                    styles.dropdownItem,
                    { borderBottomColor: colors.divider },
                    s.id === selectedScheduleId && { backgroundColor: colors.primaryLight + '15' },
                  ]}
                  onPress={() => {
                    setSelectedScheduleId(s.id);
                    setShowSchedulePicker(false);
                  }}
                >
                  <Text
                    style={[
                      styles.dropdownItemText,
                      { color: colors.text },
                      s.id === selectedScheduleId && { color: colors.primary, fontFamily: fontFamily.semibold },
                    ]}
                  >
                    {s.hospitalName}
                  </Text>
                  <Text style={[styles.dropdownItemDate, { color: colors.textSub }]}>{formatDate(s.scheduledAt)}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* 일정 미연결 시 진료 날짜 직접 선택 */}
        {!selectedScheduleId && (
          <View style={styles.field}>
            <Text style={[styles.fieldLabel, { color: colors.textSub }]}>진료 날짜 (선택)</Text>
            <TouchableOpacity
              style={[styles.scheduleSelector, { backgroundColor: colors.surface, borderColor: colors.divider }]}
              onPress={() => setShowDatePicker(true)}
              activeOpacity={0.8}
            >
              <Text
                style={
                  consultedAt
                    ? [styles.scheduleName, { color: colors.text }]
                    : [styles.schedulePlaceholder, { color: colors.textDisabled }]
                }
              >
                {consultedAt
                  ? `${consultedAt.getFullYear()}년 ${consultedAt.getMonth() + 1}월 ${consultedAt.getDate()}일`
                  : '진료받은 날짜 선택'}
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                {consultedAt && (
                  <TouchableOpacity onPress={() => setConsultedAt(null)} hitSlop={8}>
                    <Ionicons name="close-circle" size={18} color={colors.textSub} />
                  </TouchableOpacity>
                )}
                <Ionicons name="calendar-outline" size={18} color={colors.textSub} />
              </View>
            </TouchableOpacity>
            <DatePickerModal
              visible={showDatePicker}
              initialDate={(consultedAt ?? new Date()).toISOString().split('T')[0]}
              maxDate={new Date().toISOString().split('T')[0]}
              onConfirm={(dateStr) => {
                setShowDatePicker(false);
                setConsultedAt(new Date(dateStr + 'T00:00:00'));
              }}
              onClose={() => setShowDatePicker(false)}
            />
          </View>
        )}

        {selectedScheduleId && prepNotes.length > 0 && (
          <View style={styles.prepNoteSection}>
            <TouchableOpacity
              style={[styles.prepNoteToggle, { backgroundColor: colors.primaryLight + '15', borderColor: colors.primaryLight }]}
              onPress={() => setShowPrepNotes((v) => !v)}
              activeOpacity={0.8}
            >
              <View style={styles.prepNoteToggleLeft}>
                <Ionicons name="create-outline" size={16} color={colors.primary} />
                <Text style={[styles.prepNoteToggleText, { color: colors.primary }]}>
                  진료 준비 메모 참고 ({prepNotes.length}개)
                </Text>
              </View>
              <Ionicons
                name={showPrepNotes ? 'chevron-up' : 'chevron-down'}
                size={16}
                color={colors.primary}
              />
            </TouchableOpacity>
            {showPrepNotes &&
              prepNotes.map((note) => (
                <View key={note.id} style={[styles.prepNoteCard, { backgroundColor: colors.surface, borderColor: colors.divider, borderLeftColor: colors.primary }]}>
                  <Text style={[styles.prepNoteContent, { color: colors.textSub }]}>{note.content}</Text>
                </View>
              ))}
          </View>
        )}

        <View style={styles.field}>
          <Text style={[styles.fieldLabel, { color: colors.textSub }]}>진료 시 컨디션</Text>
          <EmotionSlider value={emotionScore} onChange={setEmotionScore} />
        </View>

        <View style={styles.field}>
          <View style={styles.fieldLabelRow}>
            <Text style={[styles.fieldLabel, { color: colors.textSub }]}>
              상담 내용 <Text style={{ color: colors.error }}>*</Text>
            </Text>
            {contentLimit && (
              <Text
                style={[
                  styles.charCount,
                  content.length > contentLimit
                    ? { color: colors.error, fontFamily: fontFamily.semibold }
                    : content.length >= contentLimit * 0.9
                    ? { color: colors.warning }
                    : { color: colors.textDisabled },
                ]}
              >
                {content.length}/{contentLimit}
              </Text>
            )}
          </View>
          <TextInput
            style={[styles.textArea, { backgroundColor: colors.surface, borderColor: colors.divider, color: colors.text }, content.length > (contentLimit ?? Infinity) && { borderColor: colors.error }]}
            placeholder="진료 내용, 의사 선생님 말씀, 느낀 점 등을 자유롭게 기록하세요"
            placeholderTextColor={colors.textDisabled}
            value={content}
            onChangeText={setContent}
            multiline
            numberOfLines={6}
            textAlignVertical="top"
          />
        </View>

        <View style={styles.field}>
          <Text style={[styles.fieldLabel, { color: colors.textSub }]}>태그 (선택)</Text>
          <View style={styles.tagInputRow}>
            <TextInput
              style={[styles.tagInput, { backgroundColor: colors.surface, borderColor: colors.divider, color: colors.text }]}
              placeholder="#우울감, #수면장애…"
              placeholderTextColor={colors.textDisabled}
              value={tagInput}
              onChangeText={setTagInput}
              onSubmitEditing={handleAddTag}
              returnKeyType="done"
              blurOnSubmit={false}
            />
            <TouchableOpacity style={[styles.tagAddBtn, { backgroundColor: colors.primary }]} onPress={handleAddTag}>
              <Text style={[styles.tagAddBtnText, { color: colors.textInverse }]}>추가</Text>
            </TouchableOpacity>
          </View>
          {tags.length > 0 && (
            <View style={styles.tagList}>
              {tags.map((tag) => (
                <TouchableOpacity
                  key={tag}
                  style={[styles.tagChip, { backgroundColor: colors.accentMuted }]}
                  onPress={() => handleRemoveTag(tag)}
                  activeOpacity={0.75}
                >
                  <Text style={[styles.tagChipText, { color: colors.accent }]}>#{tag}</Text>
                  <Ionicons name="close-circle" size={14} color={colors.accent} />
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* 처방전 첨부 (프리미엄) */}
        {isPremium && (
          <View style={styles.field}>
            <Text style={[styles.fieldLabel, { color: colors.textSub }]}>처방전 첨부 (선택)</Text>
            <Text style={[styles.fieldHint, { color: colors.textDisabled }]}>
              이 기록에 함께 보관할 처방전이에요. 복약 일정 자동 생성은 복약 탭 › 처방전에서 하세요.
            </Text>
            {rxDone ? (
              <View style={[styles.rxDoneBox, { backgroundColor: colors.successLight }]}>
                <Ionicons name="checkmark-circle" size={20} color={colors.success} />
                <Text style={[styles.rxDoneText, { color: colors.success }]}>처방전이 등록되었습니다. 자동 인식이 진행됩니다.</Text>
              </View>
            ) : rxImage ? (
              <View style={[styles.rxPreviewWrap, { borderColor: colors.divider }]}>
                <Image source={{ uri: rxImage.uri }} style={styles.rxPreview} resizeMode="cover" />
                <View style={[styles.rxActions, { backgroundColor: colors.surface }]}>
                  <TouchableOpacity style={[styles.rxChangeBtn, { borderColor: colors.divider }]} onPress={pickRxImage} disabled={rxUploading}>
                    <Text style={[styles.rxChangeBtnText, { color: colors.textSub }]}>다시 선택</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.rxUploadBtn, { backgroundColor: colors.primary }, rxUploading && styles.rxUploadBtnDisabled]}
                    onPress={uploadRx}
                    disabled={rxUploading}
                  >
                    {rxUploading ? (
                      <ActivityIndicator size="small" color={colors.textInverse} />
                    ) : (
                      <>
                        <Ionicons name="cloud-upload-outline" size={16} color={colors.textInverse} />
                        <Text style={[styles.rxUploadBtnText, { color: colors.textInverse }]}>업로드 및 자동 인식</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <TouchableOpacity style={[styles.rxAddBtn, { borderColor: colors.divider, backgroundColor: colors.surface }]} onPress={pickRxImage} activeOpacity={0.8}>
                <Ionicons name="camera-outline" size={24} color={colors.primary} />
                <Text style={[styles.rxAddBtnText, { color: colors.primary }]}>처방전 사진 첨부</Text>
                <Text style={[styles.rxAddBtnSub, { color: colors.textDisabled }]}>촬영 또는 갤러리에서 선택</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const formatDate = (iso: string) => {
  const d = new Date(iso);
  return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  successBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: sizes.spacing.xs,
    paddingHorizontal: sizes.spacing.lg,
    paddingVertical: sizes.spacing.sm,
  },
  successBannerText: {
    fontSize: sizes.font.sm,
    fontFamily: fontFamily.semibold,
  },
  content: { padding: sizes.spacing.lg, gap: sizes.spacing.lg, paddingBottom: 40 },
  field: { gap: sizes.spacing.sm },
  fieldHint: {
    fontSize: sizes.font.xs,
    fontFamily: fontFamily.regular,
    lineHeight: 16,
    marginTop: -sizes.spacing.xs,
  },
  fieldLabelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  fieldLabel: {
    fontSize: sizes.font.sm,
    fontFamily: fontFamily.medium,
  },
  charCount: { fontSize: sizes.font.xs },
  scheduleSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: sizes.radius.md,
    paddingHorizontal: sizes.spacing.md,
    paddingVertical: sizes.spacing.md,
  },
  scheduleName: { fontSize: sizes.font.md, flex: 1 },
  schedulePlaceholder: { fontSize: sizes.font.md, flex: 1 },
  dropdown: {
    borderWidth: 1,
    borderRadius: sizes.radius.md,
    overflow: 'hidden',
  },
  dropdownItem: {
    paddingHorizontal: sizes.spacing.md,
    paddingVertical: sizes.spacing.md,
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dropdownItemText: { fontSize: sizes.font.md },
  dropdownItemDate: { fontSize: sizes.font.sm },
  textArea: {
    borderWidth: 1,
    borderRadius: sizes.radius.md,
    paddingHorizontal: sizes.spacing.md,
    paddingTop: sizes.spacing.md,
    paddingBottom: sizes.spacing.md,
    fontSize: sizes.font.md,
    minHeight: 140,
    lineHeight: 22,
  },
  tagInputRow: { flexDirection: 'row', gap: sizes.spacing.sm },
  tagInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: sizes.radius.md,
    paddingHorizontal: sizes.spacing.md,
    paddingVertical: sizes.spacing.sm,
    fontSize: sizes.font.md,
  },
  tagAddBtn: {
    borderRadius: sizes.radius.md,
    paddingHorizontal: sizes.spacing.md,
    justifyContent: 'center',
  },
  tagAddBtnText: {
    fontSize: sizes.font.sm,
    fontFamily: fontFamily.semibold,
  },
  tagList: { flexDirection: 'row', flexWrap: 'wrap', gap: sizes.spacing.xs },
  tagChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: sizes.spacing.sm,
    paddingVertical: 4,
    borderRadius: sizes.radius.full,
    gap: 4,
  },
  tagChipText: {
    fontSize: sizes.font.xs,
    fontFamily: fontFamily.medium,
  },
  summarySection: { gap: sizes.spacing.sm },
  summaryToggle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderRadius: sizes.radius.md,
    paddingHorizontal: sizes.spacing.md,
    paddingVertical: sizes.spacing.sm,
    borderWidth: 1,
  },
  summaryToggleText: {
    fontSize: sizes.font.sm,
    fontFamily: fontFamily.semibold,
  },
  summaryCard: {
    borderRadius: sizes.radius.md,
    padding: sizes.spacing.md,
    borderWidth: 1,
    gap: sizes.spacing.sm,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: sizes.font.sm,
  },
  summaryValue: {
    fontSize: sizes.font.sm,
    fontFamily: fontFamily.semibold,
  },
  prepNoteSection: { gap: sizes.spacing.sm },
  prepNoteToggle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderRadius: sizes.radius.md,
    paddingHorizontal: sizes.spacing.md,
    paddingVertical: sizes.spacing.sm,
    borderWidth: 1,
  },
  prepNoteToggleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: sizes.spacing.xs,
  },
  prepNoteToggleText: {
    fontSize: sizes.font.sm,
    fontFamily: fontFamily.semibold,
  },
  prepNoteCard: {
    borderRadius: sizes.radius.md,
    padding: sizes.spacing.md,
    borderWidth: 1,
    borderLeftWidth: 3,
  },
  prepNoteContent: {
    fontSize: sizes.font.sm,
    lineHeight: 20,
  },
  // 처방전 첨부
  rxAddBtn: {
    alignItems: 'center',
    gap: sizes.spacing.xs,
    paddingVertical: sizes.spacing.xl,
    borderRadius: sizes.radius.lg,
    borderWidth: 1.5,
    borderStyle: 'dashed',
  },
  rxAddBtnText: {
    fontSize: sizes.font.md,
    fontFamily: fontFamily.semibold,
  },
  rxAddBtnSub: {
    fontSize: sizes.font.xs,
  },
  rxPreviewWrap: {
    borderRadius: sizes.radius.lg,
    overflow: 'hidden',
    borderWidth: 1,
  },
  rxPreview: {
    width: '100%',
    height: 180,
  },
  rxActions: {
    flexDirection: 'row',
    gap: sizes.spacing.sm,
    padding: sizes.spacing.sm,
  },
  rxChangeBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: sizes.spacing.sm,
    borderRadius: sizes.radius.md,
    borderWidth: 1,
  },
  rxChangeBtnText: {
    fontSize: sizes.font.sm,
    fontFamily: fontFamily.medium,
  },
  rxUploadBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: sizes.spacing.xs,
    paddingVertical: sizes.spacing.sm,
    borderRadius: sizes.radius.md,
  },
  rxUploadBtnDisabled: { opacity: 0.6 },
  rxUploadBtnText: {
    fontSize: sizes.font.sm,
    fontFamily: fontFamily.semibold,
  },
  rxDoneBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: sizes.spacing.sm,
    borderRadius: sizes.radius.md,
    padding: sizes.spacing.md,
  },
  rxDoneText: {
    flex: 1,
    fontSize: sizes.font.sm,
    fontFamily: fontFamily.medium,
  },
});
