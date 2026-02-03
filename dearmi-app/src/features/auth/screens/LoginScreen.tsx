import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  Image,
  SafeAreaView,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { colors, sizes } from '@/constants';
import { useLogin } from '@/features/auth/hooks/useLogin';
import { LoadingSpinner } from '@/shared/components/LoadingSpinner';

/**
 * 소셜 로그인 화면
 * - Google OAuth2 (iOS + Android)
 * - Apple Sign In (iOS 전용 — App Store 가이드라인 준수)
 * - expo-web-browser로 백엔드 OAuth 엔드포인트 열기
 * - 딥링크 dearmi://auth?access_token=...&refresh_token=... 파싱
 */
export const LoginScreen: React.FC = () => {
  const { t } = useTranslation('auth');
  const { loginWithGoogle, loginWithApple, loginWithDev, isLoading, error, clearError } = useLogin();
  const isDev = __DEV__;

  useEffect(() => {
    if (error) {
      const timer = setTimeout(clearError, 4000);
      return () => clearTimeout(timer);
    }
  }, [error, clearError]);

  if (isLoading) {
    return <LoadingSpinner fullscreen />;
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* 헤더 영역 */}
      <View style={styles.header}>
        <View style={styles.logoCircle}>
          <Text style={styles.logoText}>M</Text>
        </View>
        <Text style={styles.appName}>Dear Mi</Text>
        <Text style={styles.tagline}>{t('app_tagline')}</Text>
      </View>

      {/* 버튼 영역 */}
      <View style={styles.buttonArea}>
        {error && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {/* Google 로그인 */}
        <TouchableOpacity
          style={styles.socialButton}
          onPress={loginWithGoogle}
          activeOpacity={0.85}
        >
          <View style={styles.socialIconPlaceholder}>
            <Text style={styles.socialIconText}>G</Text>
          </View>
          <Text style={styles.socialButtonText}>{t('continue_google')}</Text>
        </TouchableOpacity>

        {/* Apple 로그인 (iOS 전용) */}
        {Platform.OS === 'ios' && (
          <TouchableOpacity
            style={[styles.socialButton, styles.appleButton]}
            onPress={loginWithApple}
            activeOpacity={0.85}
          >
            <View style={styles.socialIconPlaceholder}>
              <Text style={[styles.socialIconText, styles.appleIconText]}></Text>
            </View>
            <Text style={[styles.socialButtonText, styles.appleButtonText]}>
              {t('continue_apple')}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Dev 로그인 (개발 빌드에서만 표시) */}
      {isDev && (
        <TouchableOpacity
          style={styles.devButton}
          onPress={loginWithDev}
          activeOpacity={0.7}
        >
          <Text style={styles.devButtonText}>Dev Login (test@test.com)</Text>
        </TouchableOpacity>
      )}

      {/* 하단 약관 */}
      <Text style={styles.terms}>{t('terms_agreement')}</Text>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'space-between',
    paddingVertical: sizes.spacing.xxl,
    paddingHorizontal: sizes.spacing.xl,
  },
  header: {
    alignItems: 'center',
    marginTop: sizes.spacing.xxl,
  },
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: sizes.spacing.md,
  },
  logoText: {
    fontSize: 40,
    fontWeight: '700',
    color: colors.text.onPrimary,
  },
  appName: {
    fontSize: sizes.font.xxxl,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: sizes.spacing.xs,
  },
  tagline: {
    fontSize: sizes.font.md,
    color: colors.text.secondary,
  },
  buttonArea: {
    gap: sizes.spacing.md,
  },
  errorBox: {
    backgroundColor: colors.errorLight,
    borderRadius: sizes.spacing.sm,
    padding: sizes.spacing.md,
    marginBottom: sizes.spacing.sm,
  },
  errorText: {
    color: colors.error,
    fontSize: sizes.font.sm,
    textAlign: 'center',
  },
  socialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: sizes.spacing.sm,
    paddingVertical: sizes.spacing.md,
    paddingHorizontal: sizes.spacing.lg,
    gap: sizes.spacing.md,
  },
  appleButton: {
    backgroundColor: colors.text.primary,
    borderColor: colors.text.primary,
  },
  socialIconPlaceholder: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  socialIconText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.primary,
  },
  appleIconText: {
    color: colors.text.onPrimary,
    fontSize: 18,
  },
  socialButtonText: {
    flex: 1,
    textAlign: 'center',
    fontSize: sizes.font.md,
    fontWeight: '600',
    color: colors.text.primary,
  },
  appleButtonText: {
    color: colors.text.onPrimary,
  },
  devButton: {
    borderWidth: 1,
    borderColor: colors.warning,
    borderRadius: sizes.radius.md,
    borderStyle: 'dashed' as const,
    paddingVertical: sizes.spacing.sm,
    alignItems: 'center' as const,
  },
  devButtonText: {
    fontSize: sizes.font.sm,
    color: colors.warning,
    fontWeight: sizes.fontWeight.medium,
  },
  terms: {
    fontSize: sizes.font.xs,
    color: colors.text.disabled,
    textAlign: 'center',
    lineHeight: 18,
  },
});
