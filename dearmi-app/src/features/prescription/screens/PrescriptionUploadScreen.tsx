import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Platform,
  ScrollView,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { DatePickerModal } from '@/features/schedule/components/DatePickerModal';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { useTranslation } from 'react-i18next';
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
  const { t, i18n } = useTranslation(['prescription', 'common']);
  const user = useAuthStore((s) => s.user);
  const isPremium = user?.plan === 'PREMIUM';

  const [imageAsset, setImageAsset] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [prescribedDate, setPrescribedDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [uploadStep, setUploadStep] = useState<UploadStep>('idle');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [errorMsg, setErrorMsg] = useState('');

  const isUploading = uploadStep === 'uploading_s3' || uploadStep === 'saving';
  const isLimitExceeded = uploadStep === 'error' && errorMsg.includes('limit');

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const pulseLoopRef = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    if (uploadStep === 'saving') {
      pulseLoopRef.current = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 0.35, duration: 700, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 700, useNativeDriver: true }),
        ])
      );
      pulseLoopRef.current.start();
    } else {
      pulseLoopRef.current?.stop();
      pulseAnim.setValue(1);
    }
    return () => { pulseLoopRef.current?.stop(); };
  }, [uploadStep]);

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
        customAlert(t('common:permission_required'), t('prescription:camera_permission'));
        return;
      }
      result = await ImagePicker.launchCameraAsync(options);
    } else {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        customAlert(t('common:permission_required'), t('prescription:gallery_permission'));
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
    customAlert(t('prescription:select_image'), '', [
      { text: t('prescription:take_photo'), onPress: () => pickImage('camera') },
      { text: t('prescription:pick_gallery'), onPress: () => pickImage('gallery') },
      { text: t('common:cancel'), style: 'cancel' },
    ]);
  };

  const handleCamera = () => pickImage('camera');
  const handleGallery = () => pickImage('gallery');

  // ─── 업로드 플로우 ────────────────────────────────────────────────────────

  const handleUpload = async () => {
    if (!imageAsset) return;

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
        throw new Error(t('prescription:upload_url_missing'));
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
        throw new Error(t('prescription:register_failed'));
      }

      // Step 4: OCR 결과 화면으로 이동
      setUploadStep('done');
      navigation.replace('OcrResult', { prescriptionId: createRes.data.prescriptionId });
    } catch (e: any) {
      setUploadStep('error');
      if (e?.response?.status === 402) {
        setErrorMsg('limit');
      } else {
        setErrorMsg(e instanceof Error ? e.message : t('prescription:upload_error'));
      }
    }
  };

  // ─── 진행률 바 ────────────────────────────────────────────────────────────

  const renderProgress = () => {
    if (uploadStep === 'idle' || uploadStep === 'done') return null;

    const label =
      uploadStep === 'uploading_s3'
        ? t('prescription:upload_image_progress', { percent: uploadProgress })
        : uploadStep === 'saving'
        ? t('prescription:ocr_requesting')
        : uploadStep === 'error'
        ? errorMsg
        : '';

    return (
      <View style={staticStyles.progressBox}>
        {uploadStep !== 'error' && (
          <View style={[staticStyles.progressBar, { backgroundColor: colors.divider }]}>
            <Animated.View
              style={[
                staticStyles.progressFill,
                {
                  width: uploadStep === 'saving' ? '100%' : `${uploadProgress}%`,
                  backgroundColor:
                    uploadStep === 'saving' ? colors.secondary : colors.primary,
                  opacity: uploadStep === 'saving' ? pulseAnim : 1,
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

  return (
    <SafeAreaView style={[staticStyles.container, { backgroundColor: colors.background }]}>
      {/* 헤더 */}
      <View style={staticStyles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={12}>
          <Ionicons name="chevron-back" size={24} color={colors.primary} />
        </TouchableOpacity>
        <Text style={[staticStyles.headerTitle, { fontFamily: fontFamily.bold, color: colors.text }]}>
          {t('prescription:upload_title')}
        </Text>
        <View style={{ width: 48 }} />
      </View>

      {/* FREE 유저 안내 배너 */}
      {!isPremium && !isLimitExceeded && (
        <View style={[staticStyles.infoBanner, { backgroundColor: colors.primaryMuted, borderColor: colors.primary + '30' }]}>
          <Ionicons name="information-circle-outline" size={16} color={colors.primary} />
          <Text style={[staticStyles.infoBannerText, { color: colors.primary }]}>
            {t('prescription:free_weekly_limit')}
          </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Paywall' as any)} hitSlop={8}>
            <Text style={[staticStyles.infoBannerLink, { color: colors.primary }]}>{t('common:more')}</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* 주간 한도 초과 배너 */}
      {isLimitExceeded && (
        <View style={[staticStyles.infoBanner, { backgroundColor: colors.errorLight, borderColor: colors.error + '40' }]}>
          <Ionicons name="lock-closed" size={16} color={colors.error} />
          <Text style={[staticStyles.infoBannerText, { color: colors.error }]}>
            {t('prescription:limit_exceeded_week')}
          </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Paywall' as any)} hitSlop={8}>
            <Text style={[staticStyles.infoBannerLink, { color: colors.error }]}>{t('common:upgrade')}</Text>
          </TouchableOpacity>
        </View>
      )}

      <ScrollView contentContainerStyle={staticStyles.content}>
        {/* 이미지 미리보기 / 선택 영역 */}
        {imageAsset ? (
          <TouchableOpacity
            style={[
              staticStyles.imageArea,
              { borderColor: colors.divider, backgroundColor: colors.surface },
            ]}
            onPress={showSourcePicker}
            disabled={isUploading}
            activeOpacity={0.8}
          >
            <Image source={{ uri: imageAsset.uri }} style={staticStyles.previewImage} resizeMode="contain" />
          </TouchableOpacity>
        ) : (
          <View
            style={[
              staticStyles.imageArea,
              staticStyles.imageAreaEmpty,
              { borderColor: colors.divider, backgroundColor: colors.surface },
              isLimitExceeded && staticStyles.imageAreaBlocked,
            ]}
          >
            <Ionicons name="document-outline" size={44} color={colors.textDisabled} />
            <Text style={[staticStyles.imagePlaceholderText, { fontFamily: fontFamily.semibold, color: colors.textSub }]}>
              {t('prescription:select_photo')}
            </Text>
            {/* 카메라 (primary) / 갤러리 (secondary) 명시적 분리 */}
            <TouchableOpacity
              style={[staticStyles.ctaPrimary, { backgroundColor: colors.primary }]}
              onPress={handleCamera}
              disabled={isUploading || isLimitExceeded}
              activeOpacity={0.85}
            >
              <Ionicons name="camera-outline" size={18} color={colors.textInverse} />
              <Text style={[staticStyles.ctaPrimaryText, { color: colors.textInverse }]}>
                {t('prescription:take_photo')}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[staticStyles.ctaSecondary, { borderColor: colors.primary }]}
              onPress={handleGallery}
              disabled={isUploading || isLimitExceeded}
              activeOpacity={0.85}
            >
              <Ionicons name="images-outline" size={18} color={colors.primary} />
              <Text style={[staticStyles.ctaSecondaryText, { color: colors.primary }]}>
                {t('prescription:pick_gallery')}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {imageAsset ? (
          <TouchableOpacity
            style={staticStyles.reSelectBtn}
            onPress={showSourcePicker}
            disabled={isUploading}
          >
            <Text style={[staticStyles.reSelectText, { fontFamily: fontFamily.medium, color: colors.primary }]}>
              {t('prescription:reselect')}
            </Text>
          </TouchableOpacity>
        ) : (
          /* 사진 미선택 시 인식 팁 */
          <View style={[staticStyles.tipBox, { backgroundColor: colors.surface, borderColor: colors.divider }]}>
            <Text style={[staticStyles.tipTitle, { fontFamily: fontFamily.semibold, color: colors.text }]}>
              {t('prescription:upload_tip_title')}
            </Text>
            {[
              { icon: 'business-outline',  text: t('prescription:upload_guide_hospital') },
              { icon: 'calendar-outline',  text: t('prescription:upload_guide_prescribed_at') },
              { icon: 'medical-outline',   text: t('prescription:upload_guide_drug') },
              { icon: 'time-outline',      text: t('prescription:upload_guide_duration') },
            ].map(({ icon, text }) => (
              <View key={text} style={staticStyles.tipRow}>
                <Ionicons name={icon as any} size={15} color={colors.primary} />
                <Text style={[staticStyles.tipText, { color: colors.text }]}>{text}</Text>
              </View>
            ))}
            <View style={[staticStyles.tipDivider, { backgroundColor: colors.divider }]} />
            <Text style={[staticStyles.tipHint, { color: colors.textSub }]}>
              {t('prescription:upload_tip_hint')}
            </Text>
          </View>
        )}

        {/* 처방 날짜 선택 */}
        <View style={staticStyles.dateField}>
          <Text style={[staticStyles.dateLabel, { fontFamily: fontFamily.medium, color: colors.textSub }]}>
            {t('prescription:prescribed_date')}
          </Text>
          <TouchableOpacity
            style={[staticStyles.dateSelector, { backgroundColor: colors.surface, borderColor: colors.divider }]}
            onPress={() => setShowDatePicker(true)}
            disabled={isUploading}
            activeOpacity={0.8}
          >
            <Ionicons name="calendar-outline" size={18} color={colors.primary} />
            <Text style={[staticStyles.dateText, { color: colors.text }]}>
              {i18n.language === 'ko'
                ? t('prescription:prescribed_date_format', {
                    year: prescribedDate.getFullYear(),
                    month: prescribedDate.getMonth() + 1,
                    day: prescribedDate.getDate(),
                  })
                : prescribedDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
            </Text>
          </TouchableOpacity>
          <Text style={[staticStyles.dateHint, { color: colors.textSub }]}>
            {t('prescription:prescribed_date_hint')}
          </Text>
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

        {/* 진행 상태 */}
        {renderProgress()}

        {/* 업로드 버튼 */}
        <TouchableOpacity
          style={[
            staticStyles.uploadBtn,
            { backgroundColor: colors.secondary },
            (!imageAsset || isUploading || isLimitExceeded) && staticStyles.uploadBtnDisabled,
          ]}
          onPress={handleUpload}
          disabled={!imageAsset || isUploading || isLimitExceeded}
          activeOpacity={0.85}
        >
          <Text style={[staticStyles.uploadBtnText, { fontFamily: fontFamily.semibold, color: colors.textInverse }]}>
            {isUploading ? t('prescription:upload_btn_processing') : t('prescription:upload_btn_label')}
          </Text>
        </TouchableOpacity>
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
    borderRadius: sizes.radius.lg,
    borderWidth: 2,
    borderStyle: 'dashed',
    overflow: 'hidden',
    height: 280,
  },
  imageAreaEmpty: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: sizes.spacing.md,
    paddingHorizontal: sizes.spacing.xl,
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
    marginBottom: sizes.spacing.xs,
  },
  imagePlaceholderSub: { fontSize: sizes.font.sm },
  ctaPrimary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: sizes.spacing.sm,
    width: '100%',
    paddingVertical: sizes.spacing.md,
    borderRadius: sizes.radius.md,
    justifyContent: 'center',
  },
  ctaPrimaryText: {
    fontSize: sizes.font.md,
    fontFamily: fontFamily.semibold,
  },
  ctaSecondary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: sizes.spacing.sm,
    width: '100%',
    paddingVertical: sizes.spacing.md - 2,
    borderRadius: sizes.radius.md,
    borderWidth: 1.5,
    justifyContent: 'center',
  },
  ctaSecondaryText: {
    fontSize: sizes.font.md,
    fontFamily: fontFamily.medium,
  },
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
  infoBanner: {
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
  infoBannerText: {
    flex: 1,
    fontSize: sizes.font.sm,
    fontFamily: fontFamily.medium,
  },
  infoBannerLink: {
    fontSize: sizes.font.sm,
    fontFamily: fontFamily.bold,
  },
  imageAreaBlocked: {
    opacity: 0.45,
  },
  dateHint: {
    fontSize: sizes.font.xs,
    marginTop: 2,
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
  tipBox: {
    borderRadius: sizes.radius.lg,
    borderWidth: 1,
    paddingHorizontal: sizes.spacing.md,
    paddingVertical: sizes.spacing.md,
    gap: sizes.spacing.sm,
  },
  tipTitle: {
    fontSize: sizes.font.md,
    marginBottom: 2,
  },
  tipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: sizes.spacing.sm,
  },
  tipText: {
    fontSize: sizes.font.md,
  },
  tipDivider: {
    height: 1,
    marginVertical: sizes.spacing.xs,
  },
  tipHint: {
    fontSize: sizes.font.sm,
  },
});
