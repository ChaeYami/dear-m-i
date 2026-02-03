import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { colors, sizes } from '@/constants';
import { useLogin } from '@/features/auth/hooks/useLogin';
import { LoadingSpinner } from '@/shared/components/LoadingSpinner';

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
      <View style={styles.header}>
        <View style={styles.logoCircle}>
          <Text style={styles.logoText}>M</Text>
        </View>
        <Text style={styles.appName}>Dear Mi</Text>
        <Text style={styles.tagline}>{t('app_tagline')}</Text>
      </View>

      <View style={styles.buttonArea}>
        {error && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        <TouchableOpacity
          style={styles.socialButton}
          onPress={loginWithGoogle}
          activeOpacity={0.85}
        >
          <View style={styles.socialIconPlaceholder}>
            <Ionicons name="logo-google" size={20} color="#4285F4" />
          </View>
          <Text style={styles.socialButtonText}>{t('continue_google')}</Text>
        </TouchableOpacity>

        {Platform.OS === 'ios' && (
          <TouchableOpacity
            style={[styles.socialButton, styles.appleButton]}
            onPress={loginWithApple}
            activeOpacity={0.85}
          >
            <View style={styles.socialIconPlaceholder}>
              <Ionicons name="logo-apple" size={20} color={colors.textInverse} />
            </View>
            <Text style={[styles.socialButtonText, styles.appleButtonText]}>
              {t('continue_apple')}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {isDev && (
        <TouchableOpacity
          style={styles.devButton}
          onPress={loginWithDev}
          activeOpacity={0.7}
        >
          <Text style={styles.devButtonText}>Dev Login (test@test.com)</Text>
        </TouchableOpacity>
      )}

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
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: sizes.spacing.md,
  },
  logoText: {
    fontSize: 40,
    fontWeight: '700',
    color: colors.textInverse,
  },
  appName: {
    fontSize: sizes.font.xxxl,
    fontWeight: '700',
    color: colors.text,
    marginBottom: sizes.spacing.xs,
  },
  tagline: {
    fontSize: sizes.font.md,
    color: colors.textSub,
  },
  buttonArea: {
    gap: sizes.spacing.md,
  },
  errorBox: {
    backgroundColor: colors.errorLight,
    borderRadius: sizes.radius.md,
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
    backgroundColor: colors.surfaceSolid,
    borderWidth: 1,
    borderColor: colors.divider,
    borderRadius: sizes.radius.lg,
    paddingVertical: sizes.spacing.md,
    paddingHorizontal: sizes.spacing.lg,
    gap: sizes.spacing.md,
  },
  appleButton: {
    backgroundColor: '#1A1825',
    borderColor: 'transparent',
  },
  socialIconPlaceholder: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  socialButtonText: {
    flex: 1,
    textAlign: 'center',
    fontSize: sizes.font.md,
    fontWeight: '600',
    color: colors.text,
  },
  appleButtonText: {
    color: colors.textInverse,
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
    color: colors.textDisabled,
    textAlign: 'center',
    lineHeight: 18,
  },
});
