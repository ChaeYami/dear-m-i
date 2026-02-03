import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { colors, sizes } from '@/constants';
import { EmotionSlider } from '@/shared/components/EmotionSlider';
import { useCreateRecord, useUpdateRecord, useRecordDetail, useRecentSchedules } from '@/features/record/hooks/useRecord';
import { usePrepNotesBySchedule } from '@/features/prepnote/hooks/usePrepNote';
import { useCheckinSummary } from '@/features/checkin/hooks/useCheckin';
import { getEmotionColor } from '@/shared/components/EmotionSlider';
import { useAuthStore } from '@/features/auth/store/authStore';
import { LoadingSpinner } from '@/shared/components/LoadingSpinner';
import { prescriptionApi } from '@/features/prescription/api';
import type { RecordStackParamList } from '@/navigation/RecordNavigator';

type Nav = StackNavigationProp<RecordStackParamList, 'RecordForm'>;
type Route = RouteProp<RecordStackParamList, 'RecordForm'>;

const FREE_CONTENT_LIMIT = 200;

export const RecordFormScreen: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const params = useRoute<Route>().params;
  const scheduleIdFromNav = params?.scheduleId;
  const recordId = params?.recordId;
  const isEdit = Boolean(recordId);

  const user = useAuthStore((s) => s.user);
  const isPremium = user?.plan === 'PREMIUM';
  const contentLimit = isPremium ? undefined : FREE_CONTENT_LIMIT;

  const { data: existingRecord, isLoading: isLoadingRecord } = useRecordDetail(recordId ?? 0);
  const { data: recentSchedules = [] } = useRecentSchedules();
  const { mutate: createRecord, isPending: isCreating } = useCreateRecord();
  const { mutate: updateRecord, isPending: isUpdating } = useUpdateRecord();
  const isPending = isCreating || isUpdating;

  const [selectedScheduleId, setSelectedScheduleId] = useState<number | undefined>(
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
    Alert.alert('처방전 사진', '', [
      {
        text: '카메라로 촬영',
        onPress: async () => {
          const { status } = await ImagePicker.requestCameraPermissionsAsync();
          if (status !== 'granted') { Alert.alert('권한 필요', '카메라 접근 권한이 필요합니다.'); return; }
          const r = await ImagePicker.launchCameraAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.85 });
          if (!r.canceled && r.assets.length > 0) setRxImage(r.assets[0]);
        },
      },
      {
        text: '갤러리에서 선택',
        onPress: async () => {
          const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
          if (status !== 'granted') { Alert.alert('권한 필요', '갤러리 접근 권한이 필요합니다.'); return; }
          const r = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.85 });
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
      const { data: presignedRes } = await prescriptionApi.getPresignedUrl();
      if (!presignedRes.success || !presignedRes.data) throw new Error('업로드 URL 발급 실패');
      const { s3Key, uploadUrl } = presignedRes.data;
      await prescriptionApi.uploadToS3(uploadUrl, rxImage.uri, rxImage.mimeType ?? 'image/jpeg', () => {});
      const today = new Date().toISOString().split('T')[0];
      await prescriptionApi.createPrescription({ s3Key, prescribedAt: today });
      setRxDone(true);
    } catch (e) {
      Alert.alert('처방전 업로드 실패', e instanceof Error ? e.message : '다시 시도해 주세요.');
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
      Alert.alert('필수 입력', '내용을 입력해 주세요.');
      return;
    }
    if (contentLimit && content.length > contentLimit) {
      Alert.alert('글자 수 초과', `무료 플랜은 ${contentLimit}자까지 입력할 수 있습니다.`);
      return;
    }

    const payload = {
      scheduleId: selectedScheduleId,
      content: content.trim(),
      emotionScore,
      tags: tags.length > 0 ? tags : undefined,
    };

    if (isEdit && recordId) {
      updateRecord({ id: recordId, data: payload }, { onSuccess: () => navigation.goBack() });
    } else {
      createRecord(payload, { onSuccess: () => navigation.goBack() });
    }
  };

  if (isEdit && isLoadingRecord) return <LoadingSpinner fullscreen />;

  const selectedSchedule = recentSchedules.find((s) => s.id === selectedScheduleId);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={12}>
          <Text style={styles.headerCancel}>취소</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{isEdit ? '기록 수정' : '기록 작성'}</Text>
        <TouchableOpacity onPress={handleSave} disabled={isPending} hitSlop={12}>
          <Text style={[styles.headerSave, isPending && styles.headerSaveDisabled]}>
            {isPending ? '저장 중…' : '저장'}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {checkinSummary && checkinSummary.totalCheckins > 0 && (
          <View style={styles.summarySection}>
            <TouchableOpacity
              style={styles.summaryToggle}
              onPress={() => setShowCheckinSummary((v) => !v)}
              activeOpacity={0.8}
            >
              <Text style={styles.summaryToggleText}>
                이번 주 체크인 요약 ({checkinSummary.totalCheckins}일)
              </Text>
              <Ionicons
                name={showCheckinSummary ? 'chevron-up' : 'chevron-down'}
                size={16}
                color={colors.secondary}
              />
            </TouchableOpacity>
            {showCheckinSummary && (
              <View style={styles.summaryCard}>
                {checkinSummary.averageEmotionScore != null && (
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>평균 감정</Text>
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
                    <Text style={styles.summaryLabel}>평균 수면</Text>
                    <Text style={styles.summaryValue}>
                      {checkinSummary.averageSleepHours.toFixed(1)}시간
                    </Text>
                  </View>
                )}
                {checkinSummary.medicationRate != null && (
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>복약률</Text>
                    <Text style={styles.summaryValue}>{checkinSummary.medicationRate}%</Text>
                  </View>
                )}
                {checkinSummary.topTriggerTags.length > 0 && (
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>주요 트리거</Text>
                    <Text style={styles.summaryValue}>
                      {checkinSummary.topTriggerTags.join(', ')}
                    </Text>
                  </View>
                )}
              </View>
            )}
          </View>
        )}

        <View style={styles.field}>
          <Text style={styles.fieldLabel}>연결 일정 (선택)</Text>
          <TouchableOpacity
            style={styles.scheduleSelector}
            onPress={() => setShowSchedulePicker((v) => !v)}
            activeOpacity={0.8}
          >
            <Text style={selectedSchedule ? styles.scheduleName : styles.schedulePlaceholder}>
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
            <View style={styles.dropdown}>
              <TouchableOpacity
                style={styles.dropdownItem}
                onPress={() => {
                  setSelectedScheduleId(undefined);
                  setShowSchedulePicker(false);
                }}
              >
                <Text style={styles.dropdownItemText}>선택 안 함</Text>
              </TouchableOpacity>
              {recentSchedules.map((s) => (
                <TouchableOpacity
                  key={s.id}
                  style={[
                    styles.dropdownItem,
                    s.id === selectedScheduleId && styles.dropdownItemSelected,
                  ]}
                  onPress={() => {
                    setSelectedScheduleId(s.id);
                    setShowSchedulePicker(false);
                  }}
                >
                  <Text
                    style={[
                      styles.dropdownItemText,
                      s.id === selectedScheduleId && styles.dropdownItemTextSelected,
                    ]}
                  >
                    {s.hospitalName}
                  </Text>
                  <Text style={styles.dropdownItemDate}>{formatDate(s.scheduledAt)}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {selectedScheduleId && prepNotes.length > 0 && (
          <View style={styles.prepNoteSection}>
            <TouchableOpacity
              style={styles.prepNoteToggle}
              onPress={() => setShowPrepNotes((v) => !v)}
              activeOpacity={0.8}
            >
              <View style={styles.prepNoteToggleLeft}>
                <Ionicons name="create-outline" size={16} color={colors.primary} />
                <Text style={styles.prepNoteToggleText}>
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
                <View key={note.id} style={styles.prepNoteCard}>
                  <Text style={styles.prepNoteContent}>{note.content}</Text>
                </View>
              ))}
          </View>
        )}

        <View style={styles.field}>
          <Text style={styles.fieldLabel}>오늘 컨디션</Text>
          <EmotionSlider value={emotionScore} onChange={setEmotionScore} />
        </View>

        <View style={styles.field}>
          <View style={styles.fieldLabelRow}>
            <Text style={styles.fieldLabel}>
              상담 내용 <Text style={styles.required}>*</Text>
            </Text>
            {contentLimit && (
              <Text
                style={[
                  styles.charCount,
                  content.length > contentLimit && styles.charCountOver,
                ]}
              >
                {content.length}/{contentLimit}
                {!isPremium && ' (무료 플랜)'}
              </Text>
            )}
          </View>
          <TextInput
            style={[styles.textArea, content.length > (contentLimit ?? Infinity) && styles.textAreaError]}
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
          <Text style={styles.fieldLabel}>태그 (선택)</Text>
          <View style={styles.tagInputRow}>
            <TextInput
              style={styles.tagInput}
              placeholder="#우울감, #수면장애…"
              placeholderTextColor={colors.textDisabled}
              value={tagInput}
              onChangeText={setTagInput}
              onSubmitEditing={handleAddTag}
              returnKeyType="done"
              blurOnSubmit={false}
            />
            <TouchableOpacity style={styles.tagAddBtn} onPress={handleAddTag}>
              <Text style={styles.tagAddBtnText}>추가</Text>
            </TouchableOpacity>
          </View>
          {tags.length > 0 && (
            <View style={styles.tagList}>
              {tags.map((tag) => (
                <TouchableOpacity
                  key={tag}
                  style={styles.tagChip}
                  onPress={() => handleRemoveTag(tag)}
                  activeOpacity={0.75}
                >
                  <Text style={styles.tagChipText}>#{tag}</Text>
                  <Ionicons name="close-circle" size={14} color={colors.primary} />
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* 처방전 첨부 (프리미엄) */}
        {isPremium && (
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>처방전 첨부 (선택)</Text>
            {rxDone ? (
              <View style={styles.rxDoneBox}>
                <Ionicons name="checkmark-circle" size={20} color={colors.success} />
                <Text style={styles.rxDoneText}>처방전이 등록되었습니다. OCR 분석이 진행됩니다.</Text>
              </View>
            ) : rxImage ? (
              <View style={styles.rxPreviewWrap}>
                <Image source={{ uri: rxImage.uri }} style={styles.rxPreview} resizeMode="cover" />
                <View style={styles.rxActions}>
                  <TouchableOpacity style={styles.rxChangeBtn} onPress={pickRxImage} disabled={rxUploading}>
                    <Text style={styles.rxChangeBtnText}>다시 선택</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.rxUploadBtn, rxUploading && styles.rxUploadBtnDisabled]}
                    onPress={uploadRx}
                    disabled={rxUploading}
                  >
                    {rxUploading ? (
                      <ActivityIndicator size="small" color={colors.textInverse} />
                    ) : (
                      <>
                        <Ionicons name="cloud-upload-outline" size={16} color={colors.textInverse} />
                        <Text style={styles.rxUploadBtnText}>업로드 및 OCR</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <TouchableOpacity style={styles.rxAddBtn} onPress={pickRxImage} activeOpacity={0.8}>
                <Ionicons name="camera-outline" size={24} color={colors.primary} />
                <Text style={styles.rxAddBtnText}>처방전 사진 첨부</Text>
                <Text style={styles.rxAddBtnSub}>촬영 또는 갤러리에서 선택</Text>
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
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    height: sizes.headerHeight,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: sizes.spacing.lg,
  },
  headerTitle: {
    fontSize: sizes.font.lg,
    fontWeight: sizes.fontWeight.bold,
    color: colors.text,
  },
  headerCancel: { fontSize: sizes.font.md, color: colors.textSub },
  headerSave: {
    fontSize: sizes.font.md,
    fontWeight: sizes.fontWeight.semibold,
    color: colors.primary,
  },
  headerSaveDisabled: { opacity: 0.4 },
  content: { padding: sizes.spacing.lg, gap: sizes.spacing.lg, paddingBottom: 40 },
  field: { gap: sizes.spacing.sm },
  fieldLabelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  fieldLabel: {
    fontSize: sizes.font.sm,
    fontWeight: sizes.fontWeight.medium,
    color: colors.textSub,
  },
  required: { color: colors.error },
  charCount: { fontSize: sizes.font.xs, color: colors.textDisabled },
  charCountOver: { color: colors.error, fontWeight: sizes.fontWeight.semibold },
  scheduleSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surfaceSolid,
    borderWidth: 1,
    borderColor: colors.divider,
    borderRadius: sizes.radius.md,
    paddingHorizontal: sizes.spacing.md,
    paddingVertical: sizes.spacing.md,
  },
  scheduleName: { fontSize: sizes.font.md, color: colors.text, flex: 1 },
  schedulePlaceholder: { fontSize: sizes.font.md, color: colors.textDisabled, flex: 1 },
  dropdown: {
    backgroundColor: colors.surfaceSolid,
    borderWidth: 1,
    borderColor: colors.divider,
    borderRadius: sizes.radius.md,
    overflow: 'hidden',
  },
  dropdownItem: {
    paddingHorizontal: sizes.spacing.md,
    paddingVertical: sizes.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dropdownItemSelected: { backgroundColor: colors.primaryLight + '15' },
  dropdownItemText: { fontSize: sizes.font.md, color: colors.text },
  dropdownItemTextSelected: { color: colors.primary, fontWeight: sizes.fontWeight.semibold },
  dropdownItemDate: { fontSize: sizes.font.sm, color: colors.textSub },
  textArea: {
    backgroundColor: colors.surfaceSolid,
    borderWidth: 1,
    borderColor: colors.divider,
    borderRadius: sizes.radius.md,
    paddingHorizontal: sizes.spacing.md,
    paddingTop: sizes.spacing.md,
    paddingBottom: sizes.spacing.md,
    fontSize: sizes.font.md,
    color: colors.text,
    minHeight: 140,
    lineHeight: 22,
  },
  textAreaError: { borderColor: colors.error },
  tagInputRow: { flexDirection: 'row', gap: sizes.spacing.sm },
  tagInput: {
    flex: 1,
    backgroundColor: colors.surfaceSolid,
    borderWidth: 1,
    borderColor: colors.divider,
    borderRadius: sizes.radius.md,
    paddingHorizontal: sizes.spacing.md,
    paddingVertical: sizes.spacing.sm,
    fontSize: sizes.font.md,
    color: colors.text,
  },
  tagAddBtn: {
    backgroundColor: colors.primary,
    borderRadius: sizes.radius.md,
    paddingHorizontal: sizes.spacing.md,
    justifyContent: 'center',
  },
  tagAddBtnText: {
    color: colors.textInverse,
    fontSize: sizes.font.sm,
    fontWeight: sizes.fontWeight.semibold,
  },
  tagList: { flexDirection: 'row', flexWrap: 'wrap', gap: sizes.spacing.xs },
  tagChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryLight + '25',
    paddingHorizontal: sizes.spacing.sm,
    paddingVertical: 4,
    borderRadius: sizes.radius.full,
    gap: 4,
  },
  tagChipText: {
    fontSize: sizes.font.xs,
    color: colors.primary,
    fontWeight: sizes.fontWeight.medium,
  },
  summarySection: { gap: sizes.spacing.sm },
  summaryToggle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.secondaryLight + '20',
    borderRadius: sizes.radius.md,
    paddingHorizontal: sizes.spacing.md,
    paddingVertical: sizes.spacing.sm,
    borderWidth: 1,
    borderColor: colors.secondaryLight,
  },
  summaryToggleText: {
    fontSize: sizes.font.sm,
    color: colors.secondary,
    fontWeight: sizes.fontWeight.semibold,
  },
  summaryCard: {
    backgroundColor: colors.surfaceSolid,
    borderRadius: sizes.radius.md,
    padding: sizes.spacing.md,
    borderWidth: 1,
    borderColor: colors.divider,
    gap: sizes.spacing.sm,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: sizes.font.sm,
    color: colors.textSub,
  },
  summaryValue: {
    fontSize: sizes.font.sm,
    fontWeight: sizes.fontWeight.semibold,
    color: colors.text,
  },
  prepNoteSection: { gap: sizes.spacing.sm },
  prepNoteToggle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.primaryLight + '15',
    borderRadius: sizes.radius.md,
    paddingHorizontal: sizes.spacing.md,
    paddingVertical: sizes.spacing.sm,
    borderWidth: 1,
    borderColor: colors.primaryLight,
  },
  prepNoteToggleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: sizes.spacing.xs,
  },
  prepNoteToggleText: {
    fontSize: sizes.font.sm,
    color: colors.primary,
    fontWeight: sizes.fontWeight.semibold,
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
    fontSize: sizes.font.sm,
    color: colors.textSub,
    lineHeight: 20,
  },
  // 처방전 첨부
  rxAddBtn: {
    alignItems: 'center',
    gap: sizes.spacing.xs,
    paddingVertical: sizes.spacing.xl,
    borderRadius: sizes.radius.lg,
    borderWidth: 1.5,
    borderColor: colors.divider,
    borderStyle: 'dashed',
    backgroundColor: colors.surfaceSolid,
  },
  rxAddBtnText: {
    fontSize: sizes.font.md,
    fontWeight: sizes.fontWeight.semibold,
    color: colors.primary,
  },
  rxAddBtnSub: {
    fontSize: sizes.font.xs,
    color: colors.textDisabled,
  },
  rxPreviewWrap: {
    borderRadius: sizes.radius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.divider,
  },
  rxPreview: {
    width: '100%',
    height: 180,
  },
  rxActions: {
    flexDirection: 'row',
    gap: sizes.spacing.sm,
    padding: sizes.spacing.sm,
    backgroundColor: colors.surfaceSolid,
  },
  rxChangeBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: sizes.spacing.sm,
    borderRadius: sizes.radius.md,
    borderWidth: 1,
    borderColor: colors.divider,
  },
  rxChangeBtnText: {
    fontSize: sizes.font.sm,
    color: colors.textSub,
    fontWeight: sizes.fontWeight.medium,
  },
  rxUploadBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: sizes.spacing.xs,
    paddingVertical: sizes.spacing.sm,
    borderRadius: sizes.radius.md,
    backgroundColor: colors.primary,
  },
  rxUploadBtnDisabled: { opacity: 0.6 },
  rxUploadBtnText: {
    fontSize: sizes.font.sm,
    color: colors.textInverse,
    fontWeight: sizes.fontWeight.semibold,
  },
  rxDoneBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: sizes.spacing.sm,
    backgroundColor: colors.successLight,
    borderRadius: sizes.radius.md,
    padding: sizes.spacing.md,
  },
  rxDoneText: {
    flex: 1,
    fontSize: sizes.font.sm,
    color: colors.success,
    fontWeight: sizes.fontWeight.medium,
  },
});
