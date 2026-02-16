import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import type { StackNavigationProp } from '@react-navigation/stack';
import { useTheme, sizes, fontFamily } from '@/shared/theme';
import { useAuthStore } from '@/features/auth/store/authStore';
import type { RootStackParamList } from '@/navigation/RootNavigator';

interface PremiumGateProps {
  children: React.ReactNode;
  message?: string;
}

export const PremiumGate: React.FC<PremiumGateProps> = ({
  children,
  message,
}) => {
  const { colors } = useTheme();
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const { t } = useTranslation(['common', 'subscription']);
  const resolvedMessage = message ?? t('common:premium_plan_only');
  const plan = useAuthStore((s) => s.user?.plan);
  const isPremium = plan === 'PREMIUM';

  if (isPremium) return <>{children}</>;

  return (
    <View style={styles.wrapper}>
      {children}
      <View
        style={[
          styles.overlay,
          { backgroundColor: colors.background + 'EB' },
        ]}
      >
        <Ionicons name="lock-closed" size={36} color={colors.text} />
        <Text
          style={{
            fontFamily: fontFamily.semibold,
            fontSize: sizes.font.md,
            color: colors.text,
            textAlign: 'center',
          }}
        >
          {resolvedMessage}
        </Text>
        <TouchableOpacity
          style={{
            backgroundColor: colors.primary,
            paddingHorizontal: sizes.spacing.xl,
            paddingVertical: sizes.spacing.md,
            borderRadius: sizes.radius.lg,
          }}
          onPress={() => navigation.navigate('Paywall')}
          activeOpacity={0.85}
        >
          <Text
            style={{
              fontFamily: fontFamily.semibold,
              fontSize: sizes.font.md,
              color: colors.textInverse,
            }}
          >
            {t('subscription:manage_start')}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: { position: 'relative' },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    gap: sizes.spacing.md,
    borderRadius: sizes.radius.xl,
    padding: sizes.spacing.xl,
  },
});
