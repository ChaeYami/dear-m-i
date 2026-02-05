import React, { useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useTheme, sizes, fontFamily } from '@/shared/theme';
import { softShadow } from '@/shared/theme/shadows';
import { useLogin } from '@/features/auth/hooks/useLogin';
import { LoadingSpinner } from '@/shared/components/LoadingSpinner';

export const LoginScreen: React.FC = () => {
  const { colors } = useTheme();
  const { t } = useTranslation('auth');
  const { loginWithGoogle, loginWithApple, loginWithDev, isLoading, error, clearError } = useLogin();
  const isDev = __DEV__;

  // -- Entry animation shared values --
  const translateY = useSharedValue(30);
  const opacity = useSharedValue(0);

  useEffect(() => {
    translateY.value = withSpring(0, {
      damping: 20,
      stiffness: 90,
      mass: 1,
    });
    opacity.value = withTiming(1, { duration: 600 });
  }, []);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(clearError, 4000);
      return () => clearTimeout(timer);
    }
  }, [error, clearError]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  if (isLoading) {
    return <LoadingSpinner fullscreen />;
  }

  return (
    <SafeAreaView
      style={{
        flex: 1,
        backgroundColor: colors.background,
      }}
    >
      <Animated.View
        style={[
          {
            flex: 1,
            justifyContent: 'space-between',
            paddingVertical: sizes.spacing.xxl,
            paddingHorizontal: sizes.spacing.xl,
          },
          animatedStyle,
        ]}
      >
        {/* -- Top: Logo + App Name -- */}
        <View
          style={{
            alignItems: 'center',
            marginTop: sizes.spacing.xxl * 1.5,
          }}
        >
          {/* Gradient blob behind logo */}
          <View
            style={{
              width: 160,
              height: 160,
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: sizes.spacing.lg,
            }}
          >
            <LinearGradient
              colors={[colors.primaryLight, colors.primary]}
              start={{ x: 0.2, y: 0 }}
              end={{ x: 0.8, y: 1 }}
              style={{
                position: 'absolute',
                width: 160,
                height: 160,
                borderRadius: 80,
                opacity: 0.3,
              }}
            />
            <View
              style={{
                width: 100,
                height: 100,
                borderRadius: 50,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: colors.primary,
                ...softShadow(colors),
              }}
            >
              <Text
                style={{
                  fontSize: 48,
                  fontFamily: fontFamily.bold,
                  color: colors.textInverse,
                }}
              >
                M
              </Text>
            </View>
          </View>

          <Text
            style={{
              fontSize: sizes.font.xxxl + 4,
              fontFamily: fontFamily.bold,
              color: colors.text,
              letterSpacing: 1.5,
              marginBottom: sizes.spacing.sm,
            }}
          >
            Dear Mi
          </Text>

          <Text
            style={{
              fontSize: sizes.font.md,
              fontFamily: fontFamily.regular,
              color: colors.textSub,
              letterSpacing: 0.3,
            }}
          >
            {t('app_tagline')}
          </Text>
        </View>

        {/* -- Middle: Buttons -- */}
        <View style={{ gap: sizes.spacing.lg, paddingHorizontal: sizes.spacing.sm }}>
          {error && (
            <View
              style={{
                backgroundColor: colors.errorLight,
                borderRadius: sizes.radius.xl,
                padding: sizes.spacing.lg,
                marginBottom: sizes.spacing.xs,
              }}
            >
              <Text
                style={{
                  color: colors.error,
                  fontSize: sizes.font.sm,
                  fontFamily: fontFamily.medium,
                  textAlign: 'center',
                  lineHeight: 20,
                }}
              >
                {error}
              </Text>
            </View>
          )}

          {/* Google button */}
          <TouchableOpacity
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: colors.surface,
              borderWidth: 1,
              borderColor: colors.divider,
              borderRadius: sizes.radius.full,
              height: 56,
              paddingHorizontal: sizes.spacing.lg,
              ...softShadow(colors),
            }}
            onPress={loginWithGoogle}
            activeOpacity={0.85}
          >
            <View
              style={{
                width: 24,
                height: 24,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Ionicons name="logo-google" size={20} color="#4285F4" />
            </View>
            <Text
              style={{
                flex: 1,
                textAlign: 'center',
                fontSize: sizes.font.md,
                fontFamily: fontFamily.semibold,
                color: colors.text,
                marginRight: 24,
              }}
            >
              {t('continue_google')}
            </Text>
          </TouchableOpacity>

          {/* Apple button (iOS only) */}
          {Platform.OS === 'ios' && (
            <TouchableOpacity
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: '#1A1825',
                borderWidth: 1,
                borderColor: 'transparent',
                borderRadius: sizes.radius.full,
                height: 56,
                paddingHorizontal: sizes.spacing.lg,
                ...softShadow(colors),
              }}
              onPress={loginWithApple}
              activeOpacity={0.85}
            >
              <View
                style={{
                  width: 24,
                  height: 24,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Ionicons name="logo-apple" size={20} color="#FFFFFF" />
              </View>
              <Text
                style={{
                  flex: 1,
                  textAlign: 'center',
                  fontSize: sizes.font.md,
                  fontFamily: fontFamily.semibold,
                  color: '#FFFFFF',
                  marginRight: 24,
                }}
              >
                {t('continue_apple')}
              </Text>
            </TouchableOpacity>
          )}

          {/* Dev login button */}
          {isDev && (
            <TouchableOpacity
              style={{
                borderWidth: 1,
                borderColor: colors.warning,
                borderRadius: sizes.radius.full,
                borderStyle: 'dashed' as const,
                height: 44,
                alignItems: 'center' as const,
                justifyContent: 'center' as const,
              }}
              onPress={loginWithDev}
              activeOpacity={0.7}
            >
              <Text
                style={{
                  fontSize: sizes.font.sm,
                  color: colors.warning,
                  fontFamily: fontFamily.medium,
                }}
              >
                Dev Login (test@test.com)
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* -- Bottom: Terms -- */}
        <Text
          style={{
            fontSize: sizes.font.xs,
            fontFamily: fontFamily.regular,
            color: colors.textDisabled,
            textAlign: 'center',
            lineHeight: 16,
            paddingHorizontal: sizes.spacing.lg,
            marginTop: sizes.spacing.lg,
          }}
        >
          {t('terms_agreement')}
        </Text>
      </Animated.View>
    </SafeAreaView>
  );
};
