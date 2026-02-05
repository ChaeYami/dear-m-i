import React, { useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation, CompositeNavigationProp } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { useTranslation } from 'react-i18next';
import { useTheme, sizes, fontFamily } from '@/shared/theme';
import { softShadow } from '@/shared/theme/shadows';
import { AnimatedPressable } from '@/shared/components/AnimatedPressable';
import { ScreenHeader } from '@/shared/components/ScreenHeader';
import { useResetStackOnTabFocus } from '@/shared/hooks/useResetStackOnTabFocus';
import { useTabBarSafeBottom } from '@/shared/hooks/useTabBarSafeBottom';
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
  onPress: () => void;
  badge?: string;
  danger?: boolean;
  colors: any;
}

const MenuItem: React.FC<MenuItemProps> = ({ icon, label, onPress, badge, danger, colors }) => (
  <AnimatedPressable
    onPress={onPress}
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
        backgroundColor: danger ? colors.errorLight : colors.primaryMuted,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Ionicons name={icon} size={18} color={danger ? colors.error : colors.primary} />
    </View>
    <Text style={{
      flex: 1,
      fontSize: sizes.font.md,
      fontFamily: fontFamily.medium,
      color: danger ? colors.error : colors.text,
    }}>{label}</Text>
    {badge && (
      <View style={{
        backgroundColor: colors.primaryMuted,
        paddingHorizontal: sizes.spacing.sm,
        paddingVertical: 2,
        borderRadius: sizes.radius.full,
      }}>
        <Text style={{
          fontSize: sizes.font.xs,
          color: colors.primary,
          fontFamily: fontFamily.semibold,
        }}>{badge}</Text>
      </View>
    )}
    <Ionicons name="chevron-forward" size={16} color={colors.textDisabled} />
  </AnimatedPressable>
);

export const MyPageScreen: React.FC = () => {
  useResetStackOnTabFocus();
  const { colors, isDark } = useTheme();
  const navigation = useNavigation<Nav>();
  const { t } = useTranslation('settings');
  const { user, logout } = useAuthStore();
  const { plan, expiresAt } = useSubscriptionStore();
  const tabBarSafeBottom = useTabBarSafeBottom();

  const handleLogout = () => {
    Alert.alert(t('auth:logout'), t('auth:logout_confirm'), [
      { text: t('common:cancel'), style: 'cancel' },
      { text: t('auth:logout'), style: 'destructive', onPress: () => logout() },
    ]);
  };

  const shadow = softShadow(colors);

  const styles = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: {
      height: sizes.headerHeight,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: sizes.spacing.lg,
    },
    headerTitle: {
      fontSize: sizes.font.xl,
      fontFamily: fontFamily.bold,
      color: colors.text,
    },
    content: { paddingBottom: tabBarSafeBottom + 16 },
    gradientStrip: {
      height: 80,
      borderBottomLeftRadius: 32,
      borderBottomRightRadius: 32,
    },
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
    sectionTitle: {
      fontSize: sizes.font.sm,
      fontFamily: fontFamily.bold,
      color: colors.textSub,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
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
  }), [colors, tabBarSafeBottom]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScreenHeader
        variant="tab"
        title={t('mypage_title')}
        rightContent={
          <TouchableOpacity onPress={() => navigation.navigate('Search')} hitSlop={8}>
            <Ionicons name="search-outline" size={22} color={colors.text} />
          </TouchableOpacity>
        }
      />

      <ScrollView contentContainerStyle={styles.content}>
        {/* Gradient strip at top */}
        <LinearGradient
          colors={isDark
            ? [colors.surfaceElevated, colors.primaryMuted]
            : [colors.primaryLight, colors.primary]
          }
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradientStrip}
        />

        {/* Profile card overlapping gradient */}
        <View style={[styles.profileCard, shadow]}>
          <View style={[styles.avatar, { shadowColor: colors.glassShadow, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 1, shadowRadius: 10 }]}>
            <Text style={styles.avatarText}>
              {user?.name?.charAt(0)?.toUpperCase() ?? '?'}
            </Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{user?.name ?? t('user_default')}</Text>
            <Text style={styles.profileEmail}>{user?.email ?? ''}</Text>
          </View>
          <View style={[styles.planBadge, user?.plan === 'PREMIUM' && styles.planBadgePremium]}>
            <Text style={[styles.planBadgeText, user?.plan === 'PREMIUM' && styles.planBadgeTextPremium]}>
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

          {/* Settings section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('section_settings')}</Text>
            <View style={[styles.card, shadow]}>
              <MenuItem
                icon="notifications-outline"
                label={t('menu_notification')}
                onPress={() => navigation.navigate('NotificationSettings')}
                colors={colors}
              />
              <View style={styles.menuDivider} />
              <MenuItem
                icon="language-outline"
                label={t('menu_language')}
                onPress={() => navigation.navigate('LanguageSettings')}
                colors={colors}
              />
              <View style={styles.menuDivider} />
              <MenuItem
                icon="color-palette-outline"
                label="테마 설정"
                onPress={() => navigation.navigate('ThemeSettings')}
                colors={colors}
              />
            </View>
          </View>

          {/* Account section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('section_account')}</Text>
            <View style={[styles.card, shadow]}>
              <MenuItem
                icon="log-out-outline"
                label={t('auth:logout')}
                onPress={handleLogout}
                danger
                colors={colors}
              />
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};
