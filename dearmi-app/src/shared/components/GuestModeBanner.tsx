import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@/features/auth/store/authStore';
import { useTheme, sizes, fontFamily } from '@/shared/theme';

/**
 * 게스트(둘러보기) 모드 안내 배너.
 *
 * 각 탭 화면의 SafeAreaView 안 ScreenHeader 위에 prepend 되는 형태로 노출된다.
 * RootNavigator 의 NavigationContainer 직속에 두면 화면 SafeAreaView 의
 * `edges: ['top']` 이 native module 기반이라 SafeAreaInsetsContext override 가
 * 안 먹혀 상단에 이중 공백이 생긴다 → 화면 안에서 일반 column 으로 layout 하는 게 깔끔.
 *
 * App Store 5.1.1(v) 대응의 일환:
 *   회원가입 없이 입장한 사용자에게 데이터가 저장되지 않음을 명시하고,
 *   원클릭으로 로그인 화면(=Auth 스택)으로 복귀할 수 있게 한다.
 */
export const GuestModeBanner: React.FC = () => {
  const { colors } = useTheme();
  const { t } = useTranslation('common');
  const isGuest = useAuthStore((s) => s.isGuest);
  const exitGuestMode = useAuthStore((s) => s.exitGuestMode);

  if (!isGuest) return null;

  return (
    <View
      style={[
        styles.wrap,
        { backgroundColor: colors.primaryMuted, borderColor: colors.primary },
      ]}
    >
      <Ionicons name="information-circle" size={18} color={colors.primary} />
      <View style={styles.textCol}>
        <Text
          style={{
            fontSize: sizes.font.sm,
            fontFamily: fontFamily.semibold,
            color: colors.text,
          }}
        >
          {t('guest_banner_title')}
        </Text>
        <Text
          style={{
            fontSize: sizes.font.xs,
            color: colors.textSub,
            marginTop: 1,
          }}
        >
          {t('guest_banner_desc')}
        </Text>
      </View>
      <TouchableOpacity
        onPress={exitGuestMode}
        activeOpacity={0.7}
        style={[styles.cta, { backgroundColor: colors.primary }]}
        hitSlop={8}
      >
        <Text
          style={{
            fontSize: sizes.font.xs,
            fontFamily: fontFamily.bold,
            color: colors.textInverse,
          }}
        >
          {t('guest_banner_cta')}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: sizes.spacing.md,
    paddingVertical: sizes.spacing.sm,
    marginHorizontal: sizes.spacing.md,
    marginTop: sizes.spacing.sm,
    borderRadius: sizes.radius.md,
    borderWidth: 1,
  },
  textCol: {
    flex: 1,
  },
  cta: {
    paddingHorizontal: sizes.spacing.md,
    paddingVertical: 6,
    borderRadius: sizes.radius.full,
  },
});
