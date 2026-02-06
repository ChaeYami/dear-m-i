import React, { useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Switch,
} from 'react-native';
import Constants from 'expo-constants';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, CompositeNavigationProp } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { useTranslation } from 'react-i18next';
import { useTheme, sizes, fontFamily } from '@/shared/theme';
import { softShadow } from '@/shared/theme/shadows';
import { AnimatedPressable } from '@/shared/components/AnimatedPressable';
import { ScreenHeader } from '@/shared/components/ScreenHeader';
import { SectionTitle } from '@/shared/components/SectionTitle';
import { useResetStackOnTabFocus } from '@/shared/hooks/useResetStackOnTabFocus';
import { useTabBarSafeBottom } from '@/shared/hooks/useTabBarSafeBottom';
import { useTabBarScrollHide } from '@/shared/hooks/useTabBarScrollHide';
import { useAuthStore } from '@/features/auth/store/authStore';
import { useSubscriptionStore } from '@/features/subscription/store/subscriptionStore';
import type { MyPageStackParamList } from '@/navigation/MyPageNavigator';
import type { RootStackParamList } from '@/navigation/RootNavigator';

type Nav = CompositeNavigationProp<
  StackNavigationProp<MyPageStackParamList, 'MyPageTab'>,
  StackNavigationProp<RootStackParamList>
>;

interface MenuItemProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress?: () => void;
  right?: React.ReactNode;
  colors: any;
}

const MenuItem: React.FC<MenuItemProps> = ({ icon, label, onPress, right, colors }) => (
  <AnimatedPressable
    onPress={onPress}
    disabled={!onPress}
    style={{
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: sizes.spacing.lg,
      paddingVertical: 14,
      gap: sizes.spacing.md,
    }}
  >
    <View
      style={{
        width: 32,
        height: 32,
        borderRadius: 10,
        backgroundColor: colors.primaryMuted,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Ionicons name={icon} size={18} color={colors.primary} />
    </View>
    <Text
      style={{
        flex: 1,
        fontSize: sizes.font.md,
        fontFamily: fontFamily.medium,
        color: colors.text,
      }}
    >
      {label}
    </Text>
    {right ?? <Ionicons name="chevron-forward" size={16} color={colors.textDisabled} />}
  </AnimatedPressable>
);

const appVersion: string =
  (Constants.expoConfig?.version as string | undefined) ?? '1.0.0';

export const MyPageScreen: React.FC = () => {
  useResetStackOnTabFocus();
  const { colors, isDark, setMode } = useTheme();
  const navigation = useNavigation<Nav>();
  const { t } = useTranslation('settings');
  const { user } = useAuthStore();
  const { plan, expiresAt } = useSubscriptionStore();
  const tabBarSafeBottom = useTabBarSafeBottom();
  const scrollHandlers = useTabBarScrollHide();

  const shadow = softShadow(colors);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: { flex: 1, backgroundColor: colors.background },
        content: { paddingBottom: tabBarSafeBottom + 16 },
        profileCard: {
          backgroundColor: colors.surface,
          borderRadius: sizes.radius.xxl,
          padding: sizes.spacing.lg,
          flexDirection: 'row',
          alignItems: 'center',
          gap: sizes.spacing.md,
          marginTop: -28,
          marginHorizontal: sizes.spacing.lg,
        },
        avatar: {
          width: 56,
          height: 56,
          borderRadius: 28,
          backgroundColor: colors.primary,
          alignItems: 'center',
          justifyContent: 'center',
          borderWidth: 3,
          borderColor: colors.surface,
        },
        avatarText: {
          fontSize: sizes.font.xxl,
          fontFamily: fontFamily.bold,
          color: colors.textInverse,
        },
        profileInfo: { flex: 1 },
        profileName: {
          fontSize: sizes.font.md,
          fontFamily: fontFamily.semibold,
          color: colors.text,
        },
        profileEmail: {
          fontSize: sizes.font.xs,
          fontFamily: fontFamily.regular,
          color: colors.textSub,
          marginTop: 2,
        },
        planBadge: {
          paddingHorizontal: sizes.spacing.sm + 2,
          paddingVertical: sizes.spacing.xs,
          borderRadius: sizes.radius.full,
          backgroundColor: colors.disabled,
        },
        planBadgePremium: {
          backgroundColor: colors.secondaryLight + '30',
        },
        planBadgeText: {
          fontSize: sizes.font.xs,
          fontFamily: fontFamily.semibold,
          color: colors.textSub,
        },
        planBadgeTextPremium: {
          color: colors.secondary,
        },
        section: { gap: sizes.spacing.sm, marginTop: sizes.spacing.lg },
        sectionTitleWrap: {
          paddingHorizontal: sizes.spacing.xs,
          marginBottom: sizes.spacing.xs,
        },
        card: {
          backgroundColor: colors.surface,
          borderRadius: sizes.radius.xxl,
          overflow: 'hidden',
        },
        menuDivider: {
          height: 1,
          backgroundColor: colors.divider,
          marginHorizontal: sizes.spacing.lg,
        },
        subCard: {
          backgroundColor: colors.surface,
          borderRadius: sizes.radius.xxl,
          padding: sizes.spacing.lg,
          flexDirection: 'row',
          alignItems: 'center',
          marginTop: sizes.spacing.md,
        },
        subCardPremium: {
          backgroundColor: colors.primaryMuted,
        },
        subCardLeft: { flex: 1, gap: sizes.spacing.xs },
        subCardBadge: {
          fontSize: sizes.font.xs,
          fontFamily: fontFamily.bold,
          color: colors.primary,
          letterSpacing: 1,
        },
        subCardBadgeGray: {
          fontSize: sizes.font.xs,
          fontFamily: fontFamily.bold,
          color: colors.textDisabled,
          letterSpacing: 1,
        },
        subCardTitle: {
          fontSize: sizes.font.md,
          fontFamily: fontFamily.semibold,
          color: colors.text,
        },
        subCardDesc: {
          fontSize: sizes.font.xs,
          fontFamily: fontFamily.regular,
          color: colors.textSub,
        },
        legalList: {
          marginTop: sizes.spacing.xl,
          paddingHorizontal: sizes.spacing.lg,
          gap: sizes.spacing.md,
        },
        legalRow: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingVertical: sizes.spacing.sm,
        },
        legalText: {
          fontSize: sizes.font.sm,
          color: colors.textSub,
          fontFamily: fontFamily.regular,
        },
        versionRow: {
          marginTop: sizes.spacing.lg,
          paddingHorizontal: sizes.spacing.lg,
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
        },
        versionLabel: {
          fontSize: sizes.font.xs,
          color: colors.textDisabled,
          fontFamily: fontFamily.medium,
        },
        versionValue: {
          fontSize: sizes.font.xs,
          color: colors.textSub,
          fontFamily: fontFamily.medium,
        },
      }),
    [colors, tabBarSafeBottom],
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScreenHeader variant="tab" title={t('mypage_title')} hasNotification />

      <ScrollView contentContainerStyle={styles.content} {...scrollHandlers}>
        {/* Profile card */}
        <View style={[styles.profileCard, shadow]}>
          <View
            style={[
              styles.avatar,
              {
                shadowColor: colors.glassShadow,
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 1,
                shadowRadius: 10,
              },
            ]}
          >
            <Text style={styles.avatarText}>
              {user?.name?.charAt(0)?.toUpperCase() ?? '?'}
            </Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{user?.name ?? t('user_default')}</Text>
            <Text style={styles.profileEmail}>{user?.email ?? ''}</Text>
          </View>
          <View
            style={[styles.planBadge, user?.plan === 'PREMIUM' && styles.planBadgePremium]}
          >
            <Text
              style={[
                styles.planBadgeText,
                user?.plan === 'PREMIUM' && styles.planBadgeTextPremium,
              ]}
            >
              {user?.plan === 'PREMIUM' ? t('premium_badge') : t('free_badge')}
            </Text>
          </View>
        </View>

        <View style={{ paddingHorizontal: sizes.spacing.lg }}>
          {/* Subscription card */}
          {plan === 'PREMIUM' ? (
            <AnimatedPressable
              onPress={() => navigation.navigate('SubscriptionManage')}
              style={[styles.subCard, styles.subCardPremium, shadow]}
            >
              <View style={styles.subCardLeft}>
                <Text style={styles.subCardBadge}>PREMIUM</Text>
                <Text style={styles.subCardTitle}>{t('premium_subscribing')}</Text>
                {expiresAt && (
                  <Text style={styles.subCardDesc}>
                    {new Date(expiresAt).toLocaleDateString()} {t('renew_date')}
                  </Text>
                )}
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.textDisabled} />
            </AnimatedPressable>
          ) : (
            <AnimatedPressable
              onPress={() => navigation.navigate('Paywall')}
              style={[styles.subCard, shadow]}
            >
              <View style={styles.subCardLeft}>
                <Text style={styles.subCardBadgeGray}>FREE</Text>
                <Text style={styles.subCardTitle}>{t('upgrade_cta')}</Text>
                <Text style={styles.subCardDesc}>{t('upgrade_features')}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.primary} />
            </AnimatedPressable>
          )}

          {/* 설정 카드 */}
          <View style={styles.section}>
            <View style={styles.sectionTitleWrap}>
              <SectionTitle size="md">{t('section_settings')}</SectionTitle>
            </View>
            <View style={[styles.card, shadow]}>
              <MenuItem
                icon="moon-outline"
                label={t('theme_dark_mode')}
                colors={colors}
                right={
                  <Switch
                    value={isDark}
                    onValueChange={(v) => setMode(v ? 'dark' : 'light')}
                    trackColor={{ false: colors.disabled, true: colors.primary }}
                    thumbColor={colors.surface}
                  />
                }
              />
              <View style={styles.menuDivider} />
              <MenuItem
                icon="notifications-outline"
                label={t('menu_notification')}
                onPress={() => navigation.navigate('NotificationSettings')}
                colors={colors}
              />
              <View style={styles.menuDivider} />
              <MenuItem
                icon="person-circle-outline"
                label={t('menu_account')}
                onPress={() => navigation.navigate('Account')}
                colors={colors}
              />
            </View>
          </View>

          {/* 고객지원 카드 */}
          <View style={styles.section}>
            <View style={styles.sectionTitleWrap}>
              <SectionTitle size="md">{t('section_support')}</SectionTitle>
            </View>
            <View style={[styles.card, shadow]}>
              <MenuItem
                icon="megaphone-outline"
                label={t('menu_notice')}
                onPress={() => navigation.navigate('NoticeList')}
                colors={colors}
              />
              <View style={styles.menuDivider} />
              <MenuItem
                icon="help-circle-outline"
                label={t('menu_faq')}
                onPress={() => navigation.navigate('Faq')}
                colors={colors}
              />
              <View style={styles.menuDivider} />
              <MenuItem
                icon="book-outline"
                label={t('menu_guide')}
                onPress={() => navigation.navigate('Onboarding', { forceShow: true })}
                colors={colors}
              />
            </View>
          </View>

          {/* 법적 고지 — 카드 없이 흐린 텍스트 */}
          <View style={styles.legalList}>
            <TouchableOpacity
              style={styles.legalRow}
              onPress={() => navigation.navigate('Legal', { kind: 'terms' })}
              hitSlop={8}
            >
              <Text style={styles.legalText}>{t('legal_terms')}</Text>
              <Ionicons name="chevron-forward" size={14} color={colors.textDisabled} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.legalRow}
              onPress={() => navigation.navigate('Legal', { kind: 'privacy' })}
              hitSlop={8}
            >
              <Text style={styles.legalText}>{t('legal_privacy')}</Text>
              <Ionicons name="chevron-forward" size={14} color={colors.textDisabled} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.legalRow}
              onPress={() => navigation.navigate('Legal', { kind: 'licenses' })}
              hitSlop={8}
            >
              <Text style={styles.legalText}>{t('legal_licenses')}</Text>
              <Ionicons name="chevron-forward" size={14} color={colors.textDisabled} />
            </TouchableOpacity>
          </View>

          {/* 버전 정보 */}
          <View style={styles.versionRow}>
            <Text style={styles.versionLabel}>{t('version_label')}</Text>
            <Text style={styles.versionValue}>v{appVersion}</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};
