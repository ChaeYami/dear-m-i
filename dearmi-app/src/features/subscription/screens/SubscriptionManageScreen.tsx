import React, { useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,

  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, CompositeNavigationProp } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { useTranslation } from 'react-i18next';
import { customAlert } from '@/shared/components/CustomAlert';
import { useTheme, sizes, fontFamily } from '@/shared/theme';
import { useSubscriptionStore } from '@/features/subscription/store/subscriptionStore';
import { useSubscription } from '@/features/subscription/hooks/useSubscription';
import type { MyPageStackParamList } from '@/navigation/MyPageNavigator';
import type { RootStackParamList } from '@/navigation/RootNavigator';

type Nav = CompositeNavigationProp<
  StackNavigationProp<MyPageStackParamList, 'SubscriptionManage'>,
  StackNavigationProp<RootStackParamList>
>;

export const SubscriptionManageScreen: React.FC = () => {
  const { colors } = useTheme();
  const { t, i18n } = useTranslation(['subscription', 'settings']);
  const navigation = useNavigation<Nav>();
  const { plan, expiresAt } = useSubscriptionStore();
  const { cancelSubscription, isCancelling } = useSubscription();

  const formatDate = (iso?: string) => {
    if (!iso) return '-';
    const d = new Date(iso);
    if (i18n.language === 'ko') {
      return t('manage_date_format', { year: d.getFullYear(), month: d.getMonth() + 1, day: d.getDate() });
    }
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  const BENEFITS = [
    t('feature_ocr'),
    t('feature_drug_info'),
    t('feature_med_schedule'),
    t('feature_unlimited_records'),
    t('feature_pdf'),
    t('feature_unlimited_write'),
  ];

  const handleCancel = () => {
    customAlert(
      t('cancel_title'),
      t('manage_cancel_confirm_multiline'),
      [
        { text: t('manage_keep'), style: 'cancel' },
        {
          text: t('manage_cancel_btn'),
          style: 'destructive',
          onPress: () => cancelSubscription(),
        },
      ]
    );
  };

  const isPremium = plan === 'PREMIUM';

  const styles = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: {
      height: sizes.headerHeight,
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: sizes.spacing.lg,
    },
    backBtn: { fontSize: sizes.font.md, color: colors.primary, fontFamily: fontFamily.medium, width: 60 },
    headerTitle: {
      flex: 1,
      textAlign: 'center',
      fontSize: sizes.font.lg,
      fontFamily: fontFamily.bold,
      color: colors.text,
    },
    content: { padding: sizes.spacing.lg, gap: sizes.spacing.lg, paddingBottom: 40 },
    planCard: {
      backgroundColor: colors.surface,
      borderRadius: sizes.radius.lg,
      borderWidth: 1,
      borderColor: colors.divider,
      padding: sizes.spacing.lg,
      gap: sizes.spacing.sm,
    },
    planCardPremium: {
      borderColor: colors.primary + '55',
      backgroundColor: colors.primary + '06',
    },
    planBadgeRow: { flexDirection: 'row' },
    planBadge: {
      backgroundColor: colors.skeleton,
      paddingHorizontal: sizes.spacing.sm,
      paddingVertical: 3,
      borderRadius: sizes.radius.full,
    },
    planBadgePremium: { backgroundColor: colors.primary + '20' },
    planBadgeText: {
      fontSize: sizes.font.xs,
      fontFamily: fontFamily.bold,
      color: colors.textSub,
    },
    planBadgeTextPremium: { color: colors.primary },
    planTitle: {
      fontSize: sizes.font.lg,
      fontFamily: fontFamily.bold,
      color: colors.text,
    },
    planExpiry: {
      fontSize: sizes.font.sm,
      color: colors.textSub,
    },
    planDesc: {
      fontSize: sizes.font.sm,
      color: colors.textSub,
      lineHeight: 20,
    },
    section: { gap: sizes.spacing.md },
    sectionTitle: {
      fontSize: sizes.font.xs,
      fontFamily: fontFamily.bold,
      color: colors.textSub,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    benefitList: {
      backgroundColor: colors.surface,
      borderRadius: sizes.radius.lg,
      borderWidth: 1,
      borderColor: colors.divider,
      padding: sizes.spacing.lg,
      gap: sizes.spacing.md,
    },
    benefitRow: { flexDirection: 'row', alignItems: 'center', gap: sizes.spacing.md },
    benefitCheck: { fontSize: sizes.font.md, color: colors.secondary, fontFamily: fontFamily.bold },
    benefitText: { fontSize: sizes.font.md, color: colors.text, flex: 1 },
    upgradeBtn: {
      backgroundColor: colors.primary,
      borderRadius: sizes.radius.lg,
      height: sizes.buttonHeight.lg,
      alignItems: 'center',
      justifyContent: 'center',
    },
    upgradeBtnText: {
      fontSize: sizes.font.md,
      fontFamily: fontFamily.bold,
      color: colors.textInverse,
    },
    cancelBtn: {
      borderWidth: 1,
      borderColor: colors.error,
      borderRadius: sizes.radius.md,
      paddingVertical: sizes.spacing.md,
      alignItems: 'center',
    },
    cancelBtnDisabled: { opacity: 0.5 },
    cancelBtnText: {
      fontSize: sizes.font.md,
      fontFamily: fontFamily.semibold,
      color: colors.error,
    },
    cancelNote: {
      fontSize: sizes.font.xs,
      color: colors.textDisabled,
      textAlign: 'center',
    },
  }), [colors]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={12}>
          <Ionicons name="chevron-back" size={24} color={colors.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('manage_title')}</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* 현재 플랜 카드 */}
        <View style={[styles.planCard, isPremium && styles.planCardPremium]}>
          <View style={styles.planBadgeRow}>
            <View style={[styles.planBadge, isPremium && styles.planBadgePremium]}>
              <Text style={[styles.planBadgeText, isPremium && styles.planBadgeTextPremium]}>
                {isPremium ? t('settings:premium_badge') : t('manage_free')}
              </Text>
            </View>
          </View>
          <Text style={styles.planTitle}>
            {isPremium ? t('manage_premium') : t('manage_free')}
          </Text>
          {isPremium && expiresAt && (
            <Text style={styles.planExpiry}>
              {t('manage_renew_format', { date: formatDate(expiresAt) })}
            </Text>
          )}
          {!isPremium && (
            <Text style={styles.planDesc}>
              {t('manage_upgrade_desc')}
            </Text>
          )}
        </View>

        {/* 프리미엄 기능 안내 */}
        {!isPremium && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('manage_benefits')}</Text>
            <View style={styles.benefitList}>
              {BENEFITS.map((b) => (
                <View key={b} style={styles.benefitRow}>
                  <Text style={styles.benefitCheck}>✓</Text>
                  <Text style={styles.benefitText}>{b}</Text>
                </View>
              ))}
            </View>
            <TouchableOpacity
              style={styles.upgradeBtn}
              onPress={() => navigation.navigate('Paywall')}
              activeOpacity={0.85}
            >
              <Text style={styles.upgradeBtnText}>{t('manage_start')}</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* 구독 취소 */}
        {isPremium && (
          <View style={styles.section}>
            <TouchableOpacity
              style={[styles.cancelBtn, isCancelling && styles.cancelBtnDisabled]}
              onPress={handleCancel}
              disabled={isCancelling}
              activeOpacity={0.8}
            >
              {isCancelling ? (
                <ActivityIndicator size="small" color={colors.error} />
              ) : (
                <Text style={styles.cancelBtnText}>{t('manage_cancel')}</Text>
              )}
            </TouchableOpacity>
            <Text style={styles.cancelNote}>
              {t('manage_cancel_note')}
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};
