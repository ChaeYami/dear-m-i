import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
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
  message = '프리미엄 플랜에서 이용할 수 있어요',
}) => {
  const { colors } = useTheme();
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
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
          {message}
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
            프리미엄 시작하기
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
