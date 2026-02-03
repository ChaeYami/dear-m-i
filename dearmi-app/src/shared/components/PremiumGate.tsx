import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { colors, sizes } from '@/constants';
import { useAuthStore } from '@/features/auth/store/authStore';
import type { RootStackParamList } from '@/navigation/RootNavigator';

interface PremiumGateProps {
  children: React.ReactNode;
  message?: string;
}

export const PremiumGate: React.FC<PremiumGateProps> = ({
  children,
  message = '프리미엄 플랜에서 이용할 수 있어요',
}) => {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const plan = useAuthStore((s) => s.user?.plan);
  const isPremium = plan === 'PREMIUM';

  if (isPremium) return <>{children}</>;

  return (
    <View style={styles.wrapper}>
      {children}
      <View style={styles.overlay}>
        <Ionicons name="lock-closed" size={36} color={colors.text} />
        <Text style={styles.message}>{message}</Text>
        <TouchableOpacity
          style={styles.upgradeBtn}
          onPress={() => navigation.navigate('Paywall')}
          activeOpacity={0.85}
        >
          <Text style={styles.upgradeBtnText}>프리미엄 시작하기</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: { position: 'relative' },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(247, 244, 240, 0.92)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: sizes.spacing.md,
    borderRadius: sizes.radius.xl,
    padding: sizes.spacing.xl,
  },
  message: {
    fontSize: sizes.font.md,
    fontWeight: sizes.fontWeight.semibold,
    color: colors.text,
    textAlign: 'center',
  },
  upgradeBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: sizes.spacing.xl,
    paddingVertical: sizes.spacing.md,
    borderRadius: sizes.radius.lg,
  },
  upgradeBtnText: {
    fontSize: sizes.font.md,
    fontWeight: sizes.fontWeight.semibold,
    color: colors.textInverse,
  },
});
