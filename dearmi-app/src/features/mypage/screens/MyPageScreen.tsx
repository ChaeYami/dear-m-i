import React from 'react';
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
import { useNavigation, CompositeNavigationProp } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { useTranslation } from 'react-i18next';
import { colors, sizes } from '@/constants';
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
}

const MenuItem: React.FC<MenuItemProps> = ({ icon, label, onPress, badge, danger }) => (
  <TouchableOpacity style={styles.menuItem} onPress={onPress} activeOpacity={0.7}>
    <Ionicons name={icon} size={20} color={danger ? colors.error : colors.primary} />
    <Text style={[styles.menuLabel, danger && styles.menuLabelDanger]}>{label}</Text>
    {badge && (
      <View style={styles.badge}>
        <Text style={styles.badgeText}>{badge}</Text>
      </View>
    )}
    <Ionicons name="chevron-forward" size={18} color={colors.textDisabled} />
  </TouchableOpacity>
);

export const MyPageScreen: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const { t } = useTranslation('settings');
  const { user, logout } = useAuthStore();
  const { plan, expiresAt } = useSubscriptionStore();

  const handleLogout = () => {
    Alert.alert(t('auth:logout'), t('auth:logout_confirm'), [
      { text: t('common:cancel'), style: 'cancel' },
      { text: t('auth:logout'), style: 'destructive', onPress: () => logout() },
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t('mypage_title')}</Text>
        <TouchableOpacity onPress={() => navigation.navigate('Search')} hitSlop={8}>
          <Ionicons name="search-outline" size={22} color={colors.text} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
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

        {plan === 'PREMIUM' ? (
          <TouchableOpacity
            style={[styles.subCard, styles.subCardPremium]}
            onPress={() => navigation.navigate('SubscriptionManage')}
            activeOpacity={0.85}
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
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.subCard}
            onPress={() => navigation.navigate('Paywall')}
            activeOpacity={0.85}
          >
            <View style={styles.subCardLeft}>
              <Text style={styles.subCardBadgeGray}>FREE</Text>
              <Text style={styles.subCardTitle}>{t('upgrade_cta')}</Text>
              <Text style={styles.subCardDesc}>{t('upgrade_features')}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textDisabled} />
          </TouchableOpacity>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('section_health')}</Text>
          <View style={styles.card}>
            <MenuItem
              icon="medical-outline"
              label={t('menu_medication')}
              onPress={() => navigation.navigate('MedicationHome')}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('section_settings')}</Text>
          <View style={styles.card}>
            <MenuItem
              icon="notifications-outline"
              label={t('menu_notification')}
              onPress={() => navigation.navigate('NotificationSettings')}
            />
            <MenuItem
              icon="language-outline"
              label={t('menu_language')}
              onPress={() => navigation.navigate('LanguageSettings')}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('section_account')}</Text>
          <View style={styles.card}>
            <MenuItem
              icon="log-out-outline"
              label={t('auth:logout')}
              onPress={handleLogout}
              danger
            />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
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
    fontWeight: sizes.fontWeight.bold,
    color: colors.text,
  },
  content: { padding: sizes.spacing.lg, gap: sizes.spacing.lg, paddingBottom: sizes.tabBarSafeBottom + 16 },
  profileCard: {
    backgroundColor: colors.surfaceSolid,
    borderRadius: sizes.radius.xl,
    borderWidth: 1,
    borderColor: colors.divider,
    padding: sizes.spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: sizes.spacing.md,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: sizes.font.xl,
    fontWeight: sizes.fontWeight.bold,
    color: colors.textInverse,
  },
  profileInfo: { flex: 1 },
  profileName: {
    fontSize: sizes.font.md,
    fontWeight: sizes.fontWeight.semibold,
    color: colors.text,
  },
  profileEmail: {
    fontSize: sizes.font.xs,
    color: colors.textSub,
    marginTop: 2,
  },
  planBadge: {
    paddingHorizontal: sizes.spacing.sm,
    paddingVertical: sizes.spacing.xs,
    borderRadius: sizes.radius.full,
    backgroundColor: colors.disabled,
  },
  planBadgePremium: {
    backgroundColor: colors.secondaryLight + '30',
  },
  planBadgeText: {
    fontSize: sizes.font.xs,
    fontWeight: sizes.fontWeight.semibold,
    color: colors.textSub,
  },
  planBadgeTextPremium: {
    color: colors.secondary,
  },
  section: { gap: sizes.spacing.sm },
  sectionTitle: {
    fontSize: sizes.font.xs,
    fontWeight: sizes.fontWeight.bold,
    color: colors.textSub,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    paddingHorizontal: sizes.spacing.xs,
  },
  card: {
    backgroundColor: colors.surfaceSolid,
    borderRadius: sizes.radius.lg,
    borderWidth: 1,
    borderColor: colors.divider,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: sizes.spacing.lg,
    paddingVertical: sizes.spacing.md,
    gap: sizes.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  menuLabel: {
    flex: 1,
    fontSize: sizes.font.md,
    color: colors.text,
  },
  menuLabelDanger: { color: colors.error },
  badge: {
    backgroundColor: colors.primaryLight + '25',
    paddingHorizontal: sizes.spacing.sm,
    paddingVertical: 2,
    borderRadius: sizes.radius.full,
  },
  badgeText: {
    fontSize: sizes.font.xs,
    color: colors.primary,
    fontWeight: sizes.fontWeight.semibold,
  },
  subCard: {
    backgroundColor: colors.surfaceSolid,
    borderRadius: sizes.radius.xl,
    borderWidth: 1,
    borderColor: colors.divider,
    padding: sizes.spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
  },
  subCardPremium: {
    borderColor: colors.primaryLight,
    backgroundColor: colors.primaryLight + '10',
  },
  subCardLeft: { flex: 1, gap: sizes.spacing.xs },
  subCardBadge: {
    fontSize: sizes.font.xs,
    fontWeight: sizes.fontWeight.bold,
    color: colors.primary,
    letterSpacing: 1,
  },
  subCardBadgeGray: {
    fontSize: sizes.font.xs,
    fontWeight: sizes.fontWeight.bold,
    color: colors.textDisabled,
    letterSpacing: 1,
  },
  subCardTitle: {
    fontSize: sizes.font.md,
    fontWeight: sizes.fontWeight.semibold,
    color: colors.text,
  },
  subCardDesc: {
    fontSize: sizes.font.xs,
    color: colors.textSub,
  },
});
