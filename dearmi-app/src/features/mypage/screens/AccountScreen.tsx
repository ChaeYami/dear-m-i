import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { useTheme, sizes, fontFamily } from '@/shared/theme';
import { softShadow } from '@/shared/theme/shadows';
import { AnimatedPressable } from '@/shared/components/AnimatedPressable';
import { ScreenHeader } from '@/shared/components/ScreenHeader';
import { SectionTitle } from '@/shared/components/SectionTitle';
import { useTabBarSafeBottom } from '@/shared/hooks/useTabBarSafeBottom';
import { useAuthStore } from '@/features/auth/store/authStore';
import type { MyPageStackParamList } from '@/navigation/MyPageNavigator';

type Nav = StackNavigationProp<MyPageStackParamList, 'Account'>;

export const AccountScreen: React.FC = () => {
  const { colors } = useTheme();
  const navigation = useNavigation<Nav>();
  const { t } = useTranslation(['settings', 'auth', 'common']);
  const { logout, user } = useAuthStore();
  const tabBarSafeBottom = useTabBarSafeBottom();
  const shadow = softShadow(colors);

  const handleLogout = () => {
    Alert.alert(t('auth:logout'), t('auth:logout_confirm'), [
      { text: t('common:cancel'), style: 'cancel' },
      { text: t('auth:logout'), style: 'destructive', onPress: () => logout() },
    ]);
  };

  const handleDeleteAccount = () => {
    Alert.alert(t('auth:delete_account'), t('auth:delete_account_confirm'), [
      { text: t('common:cancel'), style: 'cancel' },
      {
        text: t('auth:delete_account'),
        style: 'destructive',
        onPress: () => {
          Alert.alert(t('common:error'), '탈퇴 API가 아직 연결되지 않았습니다.');
        },
      },
    ]);
  };

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: { flex: 1, backgroundColor: colors.background },
        content: {
          paddingHorizontal: sizes.spacing.lg,
          paddingBottom: tabBarSafeBottom + 16,
        },
        section: {
          gap: sizes.spacing.sm,
          marginTop: sizes.spacing.lg,
        },
        sectionTitleWrap: {
          paddingHorizontal: sizes.spacing.xs,
          marginBottom: sizes.spacing.xs,
        },
        card: {
          backgroundColor: colors.surface,
          borderRadius: sizes.radius.xxl,
          overflow: 'hidden',
        },
        row: {
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: sizes.spacing.lg,
          paddingVertical: 14,
          gap: sizes.spacing.md,
        },
        iconWrap: {
          width: 32,
          height: 32,
          borderRadius: 10,
          alignItems: 'center',
          justifyContent: 'center',
        },
        iconWrapDefault: { backgroundColor: colors.primaryMuted },
        iconWrapDanger: { backgroundColor: colors.errorLight },
        label: {
          flex: 1,
          fontSize: sizes.font.md,
          fontFamily: fontFamily.medium,
        },
        labelDefault: { color: colors.text },
        labelDanger: { color: colors.error },
        divider: {
          height: 1,
          backgroundColor: colors.divider,
          marginHorizontal: sizes.spacing.lg,
        },
        emailBox: {
          padding: sizes.spacing.lg,
        },
        emailLabel: {
          fontSize: sizes.font.xs,
          color: colors.textSub,
          fontFamily: fontFamily.medium,
        },
        emailValue: {
          fontSize: sizes.font.md,
          color: colors.text,
          fontFamily: fontFamily.semibold,
          marginTop: 4,
        },
        note: {
          marginTop: sizes.spacing.md,
          fontSize: sizes.font.xs,
          color: colors.textDisabled,
          fontFamily: fontFamily.regular,
          lineHeight: 18,
        },
      }),
    [colors, tabBarSafeBottom],
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScreenHeader variant="back" title={t('settings:menu_account')} />

      <ScrollView contentContainerStyle={styles.content}>
        {/* 가입 정보 */}
        <View style={styles.section}>
          <View style={[styles.card, shadow]}>
            <View style={styles.emailBox}>
              <Text style={styles.emailLabel}>{user?.email ? 'Email' : ''}</Text>
              <Text style={styles.emailValue}>{user?.email ?? '-'}</Text>
            </View>
          </View>
        </View>

        {/* 언어 설정 */}
        <View style={styles.section}>
          <View style={[styles.card, shadow]}>
            <AnimatedPressable
              style={styles.row}
              onPress={() => navigation.navigate('LanguageSettings')}
            >
              <View style={[styles.iconWrap, styles.iconWrapDefault]}>
                <Ionicons name="language-outline" size={18} color={colors.primary} />
              </View>
              <Text style={[styles.label, styles.labelDefault]}>{t('settings:menu_language')}</Text>
              <Ionicons name="chevron-forward" size={16} color={colors.textDisabled} />
            </AnimatedPressable>
          </View>
        </View>

        {/* 로그아웃 / 탈퇴 */}
        <View style={styles.section}>
          <View style={styles.sectionTitleWrap}>
            <SectionTitle size="sm" muted>
              {t('settings:section_account')}
            </SectionTitle>
          </View>
          <View style={[styles.card, shadow]}>
            <AnimatedPressable style={styles.row} onPress={handleLogout}>
              <View style={[styles.iconWrap, styles.iconWrapDefault]}>
                <Ionicons name="log-out-outline" size={18} color={colors.primary} />
              </View>
              <Text style={[styles.label, styles.labelDefault]}>{t('auth:logout')}</Text>
              <Ionicons name="chevron-forward" size={16} color={colors.textDisabled} />
            </AnimatedPressable>
            <View style={styles.divider} />
            <AnimatedPressable style={styles.row} onPress={handleDeleteAccount}>
              <View style={[styles.iconWrap, styles.iconWrapDanger]}>
                <Ionicons name="person-remove-outline" size={18} color={colors.error} />
              </View>
              <Text style={[styles.label, styles.labelDanger]}>{t('auth:delete_account')}</Text>
              <Ionicons name="chevron-forward" size={16} color={colors.textDisabled} />
            </AnimatedPressable>
          </View>
          <Text style={styles.note}>{t('auth:delete_account_note')}</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};
