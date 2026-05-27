import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,

  ScrollView,
  Platform,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { useTranslation } from 'react-i18next';
import { useTheme, sizes, fontFamily } from '@/shared/theme';
import { GlassView } from '@/shared/components/GlassView';
import { useSubscription } from '@/features/subscription/hooks/useSubscription';
import type { RootStackParamList } from '@/navigation/RootNavigator';

type PlanOption = 'monthly' | 'yearly';

const LEGAL_URLS = {
  terms: 'https://chaeon.studio/dearmi/terms/',
  privacy: 'https://chaeon.studio/dearmi/privacy/',
} as const;

export const PaywallScreen: React.FC = () => {
  const { colors } = useTheme();
  const { t } = useTranslation('subscription');
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const FEATURES = [
    { icon: 'document-text-outline', text: t('feature_ocr') },
    { icon: 'medical-outline', text: t('feature_drug_info') },
    { icon: 'notifications-outline', text: t('feature_med_schedule') },
    { icon: 'calendar-outline', text: t('feature_unlimited_records') },
    { icon: 'document-outline', text: t('feature_pdf') },
    { icon: 'create-outline', text: t('feature_unlimited_write') },
  ];
  const [selected, setSelected] = useState<PlanOption>('yearly');
  const {
    purchaseMonthly,
    purchaseYearly,
    restorePurchases,
    isPurchasing,
    isRestoring,
  } = useSubscription();

  const handlePurchase = () => {
    if (selected === 'monthly') purchaseMonthly();
    else purchaseYearly();
  };

  const isBusy = isPurchasing || isRestoring;

  const styles = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    gradientBg: { ...StyleSheet.absoluteFillObject },
    closeBtn: { alignSelf: 'flex-end', padding: sizes.spacing.lg },
    closeTxt: { fontSize: sizes.font.lg, color: colors.textSub },
    content: { paddingHorizontal: sizes.spacing.xl, paddingBottom: sizes.spacing.xl },
    headerSection: { alignItems: 'center', marginBottom: sizes.spacing.xl },
    badge: {
      fontSize: sizes.font.xs,
      fontFamily: fontFamily.bold,
      color: colors.secondary,
      letterSpacing: 2,
      marginBottom: sizes.spacing.sm,
    },
    title: {
      fontSize: sizes.font.xxxl,
      fontFamily: fontFamily.bold,
      color: colors.text,
      marginBottom: sizes.spacing.sm,
      textAlign: 'center',
    },
    subtitle: {
      fontSize: sizes.font.md,
      color: colors.textSub,
      textAlign: 'center',
      lineHeight: 22,
    },
    featureList: {
      gap: sizes.spacing.md,
      marginBottom: sizes.spacing.xl,
      padding: sizes.spacing.lg,
      borderWidth: 1,
      borderColor: colors.glassBorder,
    },
    featureRow: { flexDirection: 'row', alignItems: 'center', gap: sizes.spacing.md },
    featureIcon: { fontSize: 18, width: 24, textAlign: 'center' },
    featureTxt: { fontSize: sizes.font.md, color: colors.text, flex: 1 },
    planRow: { flexDirection: 'row', gap: sizes.spacing.md },
    planCardWrap: {
      flex: 1,
      position: 'relative',
    },
    planCard: {
      borderWidth: 2,
      borderColor: colors.divider,
      padding: sizes.spacing.md,
      alignItems: 'center',
      gap: 4,
    },
    planCardSelected: {
      borderColor: colors.primary,
    },
    saveBadge: {
      position: 'absolute',
      top: -12,
      alignSelf: 'center',
      backgroundColor: colors.secondary,
      paddingHorizontal: sizes.spacing.sm,
      paddingVertical: 2,
      borderRadius: sizes.radius.full,
    },
    saveBadgeText: {
      fontSize: sizes.font.xs,
      fontFamily: fontFamily.bold,
      color: colors.textInverse,
    },
    planLabel: {
      fontSize: sizes.font.sm,
      fontFamily: fontFamily.semibold,
      color: colors.textSub,
      marginTop: sizes.spacing.sm,
    },
    planLabelSelected: { color: colors.primary },
    planPrice: {
      fontSize: sizes.font.xl,
      fontFamily: fontFamily.bold,
      color: colors.text,
    },
    planPriceSelected: { color: colors.primary },
    planUnit: {
      fontSize: sizes.font.xs,
      color: colors.textSub,
    },
    planUnitSelected: { color: colors.primary },
    footer: {
      paddingHorizontal: sizes.spacing.xl,
      paddingBottom: sizes.spacing.lg,
      paddingTop: sizes.spacing.md,
      gap: sizes.spacing.sm,
      borderTopWidth: 1,
      borderTopColor: colors.divider,
    },
    purchaseBtn: {
      height: sizes.buttonHeight.lg,
      backgroundColor: colors.primary,
      borderRadius: sizes.radius.lg,
      alignItems: 'center',
      justifyContent: 'center',
    },
    purchaseBtnDisabled: { opacity: 0.6 },
    purchaseBtnText: {
      fontSize: sizes.font.md,
      fontFamily: fontFamily.bold,
      color: colors.textInverse,
    },
    restoreBtn: {
      height: 40,
      alignItems: 'center',
      justifyContent: 'center',
    },
    restoreBtnText: {
      fontSize: sizes.font.sm,
      color: colors.textSub,
    },
    webPayBtn: {
      height: sizes.buttonHeight.md,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.primary,
      borderRadius: sizes.radius.lg,
      alignItems: 'center',
      justifyContent: 'center',
    },
    webPayBtnText: {
      fontSize: sizes.font.md,
      fontFamily: fontFamily.semibold,
      color: colors.primary,
    },
    legalText: {
      fontSize: 10,
      color: colors.textDisabled,
      textAlign: 'center',
      lineHeight: 14,
      marginTop: sizes.spacing.xs,
    },
    legalLinksRow: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      marginTop: 2,
    },
    legalLink: {
      fontSize: 11,
      color: colors.primary,
      textDecorationLine: 'underline',
    },
    legalLinkSep: {
      fontSize: 11,
      color: colors.textDisabled,
    },
  }), [colors]);

  return (
    <SafeAreaView style={styles.container}>
      {/* 프리미엄 그라데이션 백드롭 */}
      <LinearGradient
        colors={[colors.primaryMuted, colors.background]}
        style={styles.gradientBg}
        pointerEvents="none"
      />
      {/* 닫기 */}
      <TouchableOpacity
        style={styles.closeBtn}
        onPress={() => navigation.goBack()}
        hitSlop={12}
      >
        <Ionicons name="close" size={22} color={colors.textSub} />
      </TouchableOpacity>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* 헤더 */}
        <View style={styles.headerSection}>
          <Text style={styles.badge}>{t('paywall_badge')}</Text>
          <Text style={styles.title}>{t('paywall_title')}</Text>
          <Text style={styles.subtitle}>
            {t('paywall_subtitle')}
          </Text>
        </View>

        {/* 기능 목록 */}
        <GlassView intensity="regular" borderRadius={sizes.radius.lg} style={styles.featureList}>
          {FEATURES.map((f) => (
            <View key={f.text} style={styles.featureRow}>
              <Ionicons name={f.icon as any} size={18} color={colors.primary} />
              <Text style={styles.featureTxt}>{f.text}</Text>
            </View>
          ))}
        </GlassView>

        {/* 플랜 선택 */}
        <View style={styles.planRow}>
          <TouchableOpacity
            style={styles.planCardWrap}
            onPress={() => setSelected('monthly')}
            activeOpacity={0.8}
          >
            <GlassView
              intensity={selected === 'monthly' ? 'thick' : 'regular'}
              borderRadius={sizes.radius.lg}
              style={[styles.planCard, selected === 'monthly' && styles.planCardSelected]}
            >
              <Text style={[styles.planLabel, selected === 'monthly' && styles.planLabelSelected]}>
                {t('plan_monthly')}
              </Text>
              <Text style={[styles.planPrice, selected === 'monthly' && styles.planPriceSelected]}>
                ₩3,900
              </Text>
              <Text style={[styles.planUnit, selected === 'monthly' && styles.planUnitSelected]}>
                {t('per_month')}
              </Text>
            </GlassView>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.planCardWrap}
            onPress={() => setSelected('yearly')}
            activeOpacity={0.8}
          >
            <GlassView
              intensity={selected === 'yearly' ? 'thick' : 'regular'}
              borderRadius={sizes.radius.lg}
              style={[styles.planCard, selected === 'yearly' && styles.planCardSelected]}
            >
              <Text style={[styles.planLabel, selected === 'yearly' && styles.planLabelSelected]}>
                {t('plan_yearly')}
              </Text>
              <Text style={[styles.planPrice, selected === 'yearly' && styles.planPriceSelected]}>
                ₩39,900
              </Text>
              <Text style={[styles.planUnit, selected === 'yearly' && styles.planUnitSelected]}>
                {t('per_year')}
              </Text>
            </GlassView>
            <View style={styles.saveBadge}>
              <Text style={styles.saveBadgeText}>{t('save_badge')}</Text>
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* 하단 버튼 영역 */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.purchaseBtn, isBusy && styles.purchaseBtnDisabled]}
          onPress={handlePurchase}
          disabled={isBusy}
          activeOpacity={0.85}
        >
          {isPurchasing ? (
            <ActivityIndicator color={colors.textInverse} />
          ) : (
            <Text style={styles.purchaseBtnText}>
              {selected === 'monthly' ? t('subscribe_monthly') : t('subscribe_yearly')}
            </Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.restoreBtn}
          onPress={restorePurchases}
          disabled={isBusy}
          activeOpacity={0.7}
        >
          {isRestoring ? (
            <ActivityIndicator size="small" color={colors.textSub} />
          ) : (
            <Text style={styles.restoreBtnText}>{t('restore_purchase')}</Text>
          )}
        </TouchableOpacity>

        {Platform.OS === 'ios' && (
          <Text style={styles.legalText}>
            {t('ios_legal')}
          </Text>
        )}

        {/* Terms / Privacy — App Store 3.1.2(c) 가 페이월 내 functional link 요구 */}
        <View style={styles.legalLinksRow}>
          <Text
            style={styles.legalLink}
            onPress={() => Linking.openURL(LEGAL_URLS.terms)}
          >
            {t('legal_terms_link')}
          </Text>
          <Text style={styles.legalLinkSep}>{t('legal_links_separator')}</Text>
          <Text
            style={styles.legalLink}
            onPress={() => Linking.openURL(LEGAL_URLS.privacy)}
          >
            {t('legal_privacy_link')}
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
};
