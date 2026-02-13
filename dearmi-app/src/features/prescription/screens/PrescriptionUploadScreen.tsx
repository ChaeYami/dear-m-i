import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Platform,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { DatePickerModal } from '@/features/schedule/components/DatePickerModal';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { customAlert } from '@/shared/components/CustomAlert';
import { useTheme, sizes, fontFamily } from '@/shared/theme';
import { prescriptionApi } from '@/features/prescription/api';
import { useAuthStore } from '@/features/auth/store/authStore';
import type { MedicationStackParamList } from '@/navigation/MedicationNavigator';

type Nav = StackNavigationProp<MedicationStackParamList, 'PrescriptionUpload'>;

type UploadStep = 'idle' | 'uploading_s3' | 'saving' | 'done' | 'error';

export const PrescriptionUploadScreen: React.FC = () => {
  const { colors } = useTheme();
  const navigation = useNavigation<Nav>();
  const user = useAuthStore((s) => s.user);
  const isPremium = user?.plan === 'PREMIUM';

  const [imageAsset, setImageAsset] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [prescribedDate, setPrescribedDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [uploadStep, setUploadStep] = useState<UploadStep>('idle');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [errorMsg, setErrorMsg] = useState('');

  const isUploading = uploadStep === 'uploading_s3' || uploadStep === 'saving';

  // ─── 이미지 선택 ──────────────────────────────────────────────────────────

  const pickImage = async (source: 'camera' | 'gallery') => {
    const options: ImagePicker.ImagePickerOptions = {
      mediaTypes: ['images'],
      quality: 0.85,
      allowsEditing: false,
    };

    let result: ImagePicker.ImagePickerResult;
    if (source === 'camera') {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        customAlert('권한 필요', '카메라 접근 권한이 필요합니다.');
        return;
      }
      result = await ImagePicker.launchCameraAsync(options);
    } else {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        customAlert('권한 필요', '갤러리 접근 권한이 필요합니다.');
        return;
      }
      result = await ImagePicker.launchImageLibraryAsync(options);
    }

    if (!result.canceled && result.assets.length > 0) {
      setImageAsset(result.assets[0]);
      setUploadStep('idle');
      setErrorMsg('');
    }
  };

  const showSourcePicker = () => {
    customAlert('사진 선택', '', [
      { text: '카메라로 촬영', onPress: () => pickImage('camera') },
      { text: '갤러리에서 선택', onPress: () => pickImage('gallery') },
      { text: '취소', style: 'cancel' },
    ]);
  };

  // ─── 업로드 플로우 ────────────────────────────────────────────────────────

  const handleUpload = async () => {
    if (!imageAsset) return;

    if (!isPremium) {
      customAlert(
        '프리미엄 기능',
        '처방전 자동 인식은 프리미엄 플랜 전용 기능입니다.',
        [{ text: '확인' }]
      );
      return;
    }

    setUploadStep('uploading_s3');
    setUploadProgress(0);
    setErrorMsg('');

    try {
      // Step 1: Presigned URL 발급
      const mimeType = imageAsset.mimeType ?? 'image/jpeg';
      const ext = mimeType === 'image/png' ? 'png' : 'jpg';
      const { data: presignedRes } = await prescriptionApi.getPresignedUrl(
        `prescription.${ext}`,
        mimeType
      );
      if (!presignedRes.success || !presignedRes.data) {
        throw new Error('업로드 URL을 받지 못했습니다.');
      }
      const { s3Key, uploadUrl } = presignedRes.data;

      // Step 2: S3 직접 업로드
      await prescriptionApi.uploadToS3(uploadUrl, imageAsset.uri, mimeType, setUploadProgress);

      // Step 3: 백엔드에 처방전 등록
      setUploadStep('saving');
      const dateStr = `${prescribedDate.getFullYear()}-${String(prescribedDate.getMonth() + 1).padStart(2, '0')}-${String(prescribedDate.getDate()).padStart(2, '0')}`;
      const { data: createRes } = await prescriptionApi.createPrescription({
        s3Key,
        prescribedAt: dateStr,
      });

      if (!createRes.success || !createRes.data) {
        throw new Error('처방전 등록에 실패했습니다.');
      }

      // Step 4: OCR 결과 화면으로 이동
      setUploadStep('done');
      navigation.replace('OcrResult', { prescriptionId: createRes.data.prescriptionId });
    } catch (e) {
      setUploadStep('error');
      setErrorMsg(e instanceof Error ? e.message : '업로드 중 오류가 발생했습니다.');
    }
  };

  // ─── 진행률 바 ────────────────────────────────────────────────────────────

  const renderProgress = () => {
    if (uploadStep === 'idle' || uploadStep === 'done') return null;

    const label =
      uploadStep === 'uploading_s3'
        ? `이미지 업로드 중… ${uploadProgress}%`
        : uploadStep === 'saving'
        ? '자동 인식 중…'
        : uploadStep === 'error'
        ? errorMsg
        : '';

    return (
      <View style={staticStyles.progressBox}>
        {uploadStep !== 'error' && (
          <View style={[staticStyles.progressBar, { backgroundColor: colors.divider }]}>
            <View
              style={[
                staticStyles.progressFill,
                {
                  width: uploadStep === 'saving' ? '100%' : `${uploadProgress}%`,
                  backgroundColor:
                    uploadStep === 'saving' ? colors.secondary : colors.primary,
                },
              ]}
            />
          </View>
        )}
        <Text
          style={[
            staticStyles.progressLabel,
            { color: colors.textSub },
            uploadStep === 'error' && { color: colors.error, fontFamily: fontFamily.medium },
          ]}
        >
          {label}
        </Text>
      </View>
    );
  };

  // FREE 유저: 화면 진입 즉시 페이월로 안내하고 업로드 UI 비활성화
  const isBlocked = !isPremium;

  return (
    <SafeAreaView style={[staticStyles.container, { backgroundColor: colors.background }]}>
      {/* 헤더 */}
      <View style={staticStyles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={12}>
          <Ionicons name="chevron-back" size={24} color={colors.primary} />
        </TouchableOpacity>
        <Text style={[staticStyles.headerTitle, { fontFamily: fontFamily.bold, color: colors.text }]}>
          처방전 등록
        </Text>
        <View style={{ width: 48 }} />
      </View>

      {/* FREE 유저 진입 차단 배너 */}
      {isBlocked && (
        <View style={[staticStyles.premiumBanner, { backgroundColor: colors.primaryMuted, borderColor: colors.primary + '30' }]}>
          <Ionicons name="lock-closed" size={16} color={colors.primary} />
          <Text style={[staticStyles.premiumBannerText, { color: colors.primary }]}>
            처방전 자동 인식은 프리미엄 전용 기능이에요.
          </Text>
          <TouchableOpacity
            onPress={() => navigation.navigate('Paywall' as any)}
            hitSlop={8}
          >
            <Text style={[staticStyles.premiumBannerLink, { color: colors.primary }]}>업그레이드</Text>
          </TouchableOpacity>
        </View>
      )}

      <ScrollView contentContainerStyle={staticStyles.content} pointerEvents={isBlocked ? 'none' : 'auto'}>
        {/* 이미지 미리보기 / 선택 영역 */}
        <TouchableOpacity
          style={[
            staticStyles.imageArea,
            { borderColor: colors.divider, backgroundColor: colors.surface },
            isBlocked && staticStyles.imageAreaBlocked,
          ]}
          onPress={showSourcePicker}
          disabled={isUploading || isBlocked}
          activeOpacity={0.8}
        >
          {imageAsset ? (
            <Image source={{ uri: imageAsset.uri }} style={staticStyles.previewImage} resizeMode="contain" />
          ) : (
            <View style={staticStyles.imagePlaceholder}>
              <Ionicons
                name={isBlocked ? 'lock-closed-outline' : 'document-outline'}
                size={48}
                color={colors.textDisabled}
              />
              <Text style={[staticStyles.imagePlaceholderText, { fontFamily: fontFamily.semibold, color: colors.textSub }]}>
                {isBlocked ? '프리미엄 전용 기능입니다' : '처방전 사진을 선택하세요'}
              </Text>
              {!isBlocked && (
                <Text style={[staticStyles.imagePlaceholderSub, { color: colors.textDisabled }]}>
                  카메라 촬영 또는 갤러리
                </Text>
              )}
            </View>
          )}
        </TouchableOpacity>

        {imageAsset && !isBlocked && (
          <TouchableOpacity
            style={staticStyles.reSelectBtn}
            onPress={showSourcePicker}
            disabled={isUploading}
          >
            <Text style={[staticStyles.reSelectText, { fontFamily: fontFamily.medium, color: colors.primary }]}>
              다시 선택
            </Text>
          </TouchableOpacity>
        )}

        {/* 처방 날짜 선택 */}
        {!isBlocked && (
          <View style={staticStyles.dateField}>
            <Text style={[staticStyles.dateLabel, { fontFamily: fontFamily.medium, color: colors.textSub }]}>
              처방 날짜
            </Text>
            <TouchableOpacity
              style={[staticStyles.dateSelector, { backgroundColor: colors.surface, borderColor: colors.divider }]}
              onPress={() => setShowDatePicker(true)}
              disabled={isUploading}
              activeOpacity={0.8}
            >
              <Ionicons name="calendar-outline" size={18} color={colors.primary} />
              <Text style={[staticStyles.dateText, { color: colors.text }]}>
                {`${prescribedDate.getFullYear()}년 ${prescribedDate.getMonth() + 1}월 ${prescribedDate.getDate()}일`}
              </Text>
            </TouchableOpacity>
            <DatePickerModal
              visible={showDatePicker}
              initialDate={prescribedDate.toISOString().split('T')[0]}
              maxDate={new Date().toISOString().split('T')[0]}
              onConfirm={(dateStr) => {
                setShowDatePicker(false);
                setPrescribedDate(new Date(dateStr + 'T00:00:00'));
              }}
              onClose={() => setShowDatePicker(false)}
            />
          </View>
        )}

        {/* 진행 상태 */}
        {!isBlocked && renderProgress()}

        {/* 업로드 버튼 */}
        {!isBlocked && (
          <TouchableOpacity
            style={[
              staticStyles.uploadBtn,
              { backgroundColor: colors.secondary },
              (!imageAsset || isUploading) && staticStyles.uploadBtnDisabled,
            ]}
            onPress={handleUpload}
            disabled={!imageAsset || isUploading}
            activeOpacity={0.85}
          >
            <Text style={[staticStyles.uploadBtnText, { fontFamily: fontFamily.semibold, color: colors.textInverse }]}>
              {isUploading ? '처리 중…' : '처방전 등록 및 자동 인식'}
            </Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const staticStyles = StyleSheet.create({
  container: { flex: 1 },
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
  },
  content: { padding: sizes.spacing.lg, gap: sizes.spacing.lg },
  imageArea: {
    height: 300,
    borderRadius: sizes.radius.lg,
    borderWidth: 2,
    borderStyle: 'dashed',
    overflow: 'hidden',
  },
  previewImage: { width: '100%', height: '100%' },
  imagePlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: sizes.spacing.sm,
  },
  imagePlaceholderText: {
    fontSize: sizes.font.md,
  },
  imagePlaceholderSub: { fontSize: sizes.font.sm },
  reSelectBtn: { alignSelf: 'center' },
  dateField: { gap: sizes.spacing.sm },
  dateLabel: {
    fontSize: sizes.font.sm,
  },
  dateSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: sizes.spacing.sm,
    borderWidth: 1,
    borderRadius: sizes.radius.md,
    paddingHorizontal: sizes.spacing.md,
    paddingVertical: sizes.spacing.md,
  },
  dateText: {
    fontSize: sizes.font.md,
  },
  dateDoneBtn: {
    alignItems: 'flex-end',
    paddingVertical: sizes.spacing.xs,
  },
  dateDoneText: {
    fontSize: sizes.font.md,
  },
  reSelectText: {
    fontSize: sizes.font.sm,
  },
  progressBox: { gap: sizes.spacing.sm },
  progressBar: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: { height: '100%', borderRadius: 3 },
  progressLabel: {
    fontSize: sizes.font.sm,
    textAlign: 'center',
  },
  premiumBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: sizes.spacing.sm,
    marginHorizontal: sizes.spacing.lg,
    marginBottom: sizes.spacing.sm,
    paddingHorizontal: sizes.spacing.md,
    paddingVertical: sizes.spacing.sm + 2,
    borderRadius: sizes.radius.lg,
    borderWidth: 1,
  },
  premiumBannerText: {
    flex: 1,
    fontSize: sizes.font.sm,
    fontFamily: fontFamily.medium,
  },
  premiumBannerLink: {
    fontSize: sizes.font.sm,
    fontFamily: fontFamily.bold,
  },
  imageAreaBlocked: {
    opacity: 0.45,
  },
  uploadBtn: {
    borderRadius: sizes.radius.md,
    paddingVertical: sizes.spacing.md,
    alignItems: 'center',
  },
  uploadBtnDisabled: { opacity: 0.4 },
  uploadBtnText: {
    fontSize: sizes.font.md,
  },
});
