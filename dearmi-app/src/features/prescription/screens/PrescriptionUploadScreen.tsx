import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { colors, sizes } from '@/constants';
import { prescriptionApi } from '@/features/prescription/api';
import { useAuthStore } from '@/features/auth/store/authStore';
import type { PrescriptionStackParamList } from '@/navigation/PrescriptionNavigator';

type Nav = StackNavigationProp<PrescriptionStackParamList, 'PrescriptionUpload'>;

type UploadStep = 'idle' | 'uploading_s3' | 'saving' | 'done' | 'error';

export const PrescriptionUploadScreen: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const user = useAuthStore((s) => s.user);
  const isPremium = user?.plan === 'PREMIUM';

  const [imageAsset, setImageAsset] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [uploadStep, setUploadStep] = useState<UploadStep>('idle');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [errorMsg, setErrorMsg] = useState('');

  const isUploading = uploadStep === 'uploading_s3' || uploadStep === 'saving';

  // ─── 이미지 선택 ──────────────────────────────────────────────────────────

  const pickImage = async (source: 'camera' | 'gallery') => {
    const options: ImagePicker.ImagePickerOptions = {
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.85,
      allowsEditing: false,
    };

    let result: ImagePicker.ImagePickerResult;
    if (source === 'camera') {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('권한 필요', '카메라 접근 권한이 필요합니다.');
        return;
      }
      result = await ImagePicker.launchCameraAsync(options);
    } else {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('권한 필요', '갤러리 접근 권한이 필요합니다.');
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
    Alert.alert('사진 선택', '', [
      { text: '카메라로 촬영', onPress: () => pickImage('camera') },
      { text: '갤러리에서 선택', onPress: () => pickImage('gallery') },
      { text: '취소', style: 'cancel' },
    ]);
  };

  // ─── 업로드 플로우 ────────────────────────────────────────────────────────

  const handleUpload = async () => {
    if (!imageAsset) return;

    if (!isPremium) {
      Alert.alert(
        '프리미엄 기능',
        '처방전 OCR은 프리미엄 플랜 전용 기능입니다.',
        [{ text: '확인' }]
      );
      return;
    }

    setUploadStep('uploading_s3');
    setUploadProgress(0);
    setErrorMsg('');

    try {
      // Step 1: Presigned URL 발급
      const { data: presignedRes } = await prescriptionApi.getPresignedUrl();
      if (!presignedRes.success || !presignedRes.data) {
        throw new Error('업로드 URL을 받지 못했습니다.');
      }
      const { s3Key, uploadUrl } = presignedRes.data;

      // Step 2: S3 직접 업로드
      const mimeType = imageAsset.mimeType ?? 'image/jpeg';
      await prescriptionApi.uploadToS3(uploadUrl, imageAsset.uri, mimeType, setUploadProgress);

      // Step 3: 백엔드에 처방전 등록
      setUploadStep('saving');
      const today = new Date().toISOString().split('T')[0];
      const { data: createRes } = await prescriptionApi.createPrescription({
        s3Key,
        prescribedAt: today,
      });

      if (!createRes.success || !createRes.data) {
        throw new Error('처방전 등록에 실패했습니다.');
      }

      // Step 4: OCR 결과 화면으로 이동
      setUploadStep('done');
      navigation.replace('OcrResult', { prescriptionId: createRes.data.id });
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
        ? 'OCR 분석 요청 중…'
        : uploadStep === 'error'
        ? errorMsg
        : '';

    return (
      <View style={styles.progressBox}>
        {uploadStep !== 'error' && (
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
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
            styles.progressLabel,
            uploadStep === 'error' && styles.errorText,
          ]}
        >
          {label}
        </Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={12}>
          <Ionicons name="chevron-back" size={24} color={colors.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>처방전 등록</Text>
        <View style={{ width: 48 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* 이미지 미리보기 / 선택 영역 */}
        <TouchableOpacity
          style={styles.imageArea}
          onPress={showSourcePicker}
          disabled={isUploading}
          activeOpacity={0.8}
        >
          {imageAsset ? (
            <Image source={{ uri: imageAsset.uri }} style={styles.previewImage} resizeMode="contain" />
          ) : (
            <View style={styles.imagePlaceholder}>
              <Ionicons name="document-outline" size={48} color={colors.textDisabled} />
              <Text style={styles.imagePlaceholderText}>처방전 사진을 선택하세요</Text>
              <Text style={styles.imagePlaceholderSub}>카메라 촬영 또는 갤러리</Text>
            </View>
          )}
        </TouchableOpacity>

        {imageAsset && (
          <TouchableOpacity
            style={styles.reSelectBtn}
            onPress={showSourcePicker}
            disabled={isUploading}
          >
            <Text style={styles.reSelectText}>다시 선택</Text>
          </TouchableOpacity>
        )}

        {/* 진행 상태 */}
        {renderProgress()}

        {/* 프리미엄 안내 */}
        {!isPremium && (
          <View style={styles.premiumNotice}>
            <Text style={styles.premiumNoticeText}>
              처방전 OCR은 프리미엄 플랜 전용 기능입니다.
            </Text>
          </View>
        )}

        {/* 업로드 버튼 */}
        <TouchableOpacity
          style={[
            styles.uploadBtn,
            (!imageAsset || isUploading) && styles.uploadBtnDisabled,
          ]}
          onPress={handleUpload}
          disabled={!imageAsset || isUploading}
          activeOpacity={0.85}
        >
          <Text style={styles.uploadBtnText}>
            {isUploading ? '처리 중…' : isPremium ? '처방전 등록 및 OCR 분석' : '처방전 등록'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
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
    borderBottomColor: colors.divider,
  },
  backBtn: { fontSize: sizes.font.md, color: colors.primary, fontWeight: sizes.fontWeight.medium },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: sizes.font.lg,
    fontWeight: sizes.fontWeight.bold,
    color: colors.text,
  },
  content: { padding: sizes.spacing.lg, gap: sizes.spacing.lg },
  imageArea: {
    height: 300,
    borderRadius: sizes.radius.lg,
    borderWidth: 2,
    borderColor: colors.divider,
    borderStyle: 'dashed',
    overflow: 'hidden',
    backgroundColor: colors.surface,
  },
  previewImage: { width: '100%', height: '100%' },
  imagePlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: sizes.spacing.sm,
  },
  imagePlaceholderIcon: { fontSize: 48 },
  imagePlaceholderText: {
    fontSize: sizes.font.md,
    fontWeight: sizes.fontWeight.semibold,
    color: colors.textSub,
  },
  imagePlaceholderSub: { fontSize: sizes.font.sm, color: colors.textDisabled },
  reSelectBtn: { alignSelf: 'center' },
  reSelectText: {
    fontSize: sizes.font.sm,
    color: colors.primary,
    fontWeight: sizes.fontWeight.medium,
  },
  progressBox: { gap: sizes.spacing.sm },
  progressBar: {
    height: 6,
    backgroundColor: colors.divider,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: { height: '100%', borderRadius: 3 },
  progressLabel: {
    fontSize: sizes.font.sm,
    color: colors.textSub,
    textAlign: 'center',
  },
  errorText: { color: colors.error, fontWeight: sizes.fontWeight.medium },
  premiumNotice: {
    backgroundColor: colors.warningLight,
    borderRadius: sizes.radius.md,
    padding: sizes.spacing.md,
    borderWidth: 1,
    borderColor: colors.warning + '55',
  },
  premiumNoticeText: {
    fontSize: sizes.font.sm,
    color: colors.textSub,
    textAlign: 'center',
  },
  uploadBtn: {
    backgroundColor: colors.secondary,
    borderRadius: sizes.radius.md,
    paddingVertical: sizes.spacing.md,
    alignItems: 'center',
  },
  uploadBtnDisabled: { opacity: 0.4 },
  uploadBtnText: {
    fontSize: sizes.font.md,
    fontWeight: sizes.fontWeight.semibold,
    color: colors.textInverse,
  },
});
