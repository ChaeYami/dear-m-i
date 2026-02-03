import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { colors, sizes } from '@/constants';
import { useSubscription } from '@/features/subscription/hooks/useSubscription';

type PlanOption = 'monthly' | 'yearly';

const FEATURES = [
  { icon: '📋', text: '처방전 OCR 자동 인식' },
  { icon: '💊', text: '약품 효능·주의사항 상세 정보' },
  { icon: '🔔', text: '복약 일정 자동 생성' },
  { icon: '📅', text: '전체 상담 기록 무제한 조회' },
  { icon: '📄', text: 'PDF 진료 기록 내보내기' },
  { icon: '📝', text: '상담 기록 무제한 작성' },
];

export const PaywallScreen: React.FC = () => {
  const navigation = useNavigation();
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

  return (
    <SafeAreaView style={styles.container}>
      {/* 닫기 */}
      <TouchableOpacity
        style={styles.closeBtn}
        onPress={() => navigation.goBack()}
        hitSlop={12}
      >
        <Text style={styles.closeTxt}>✕</Text>
      </TouchableOpacity>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* 헤더 */}
        <View style={styles.headerSection}>
          <Text style={styles.badge}>PREMIUM</Text>
          <Text style={styles.title}>DearMI 프리미엄</Text>
          <Text style={styles.subtitle}>
            처방전 OCR, 약품 정보, 전체 기록 조회까지{'\n'}
            건강 관리를 더 스마트하게
          </Text>
        </View>

        {/* 기능 목록 */}
        <View style={styles.featureList}>
          {FEATURES.map((f) => (
            <View key={f.text} style={styles.featureRow}>
              <Text style={styles.featureIcon}>{f.icon}</Text>
              <Text style={styles.featureTxt}>{f.text}</Text>
            </View>
          ))}
        </View>

        {/* 플랜 선택 */}
        <View style={styles.planRow}>
          <TouchableOpacity
            style={[styles.planCard, selected === 'monthly' && styles.planCardSelected]}
            onPress={() => setSelected('monthly')}
            activeOpacity={0.8}
          >
            <Text style={[styles.planLabel, selected === 'monthly' && styles.planLabelSelected]}>
              월간 플랜
            </Text>
            <Text style={[styles.planPrice, selected === 'monthly' && styles.planPriceSelected]}>
              ₩4,900
            </Text>
            <Text style={[styles.planUnit, selected === 'monthly' && styles.planUnitSelected]}>
              /월
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.planCard, selected === 'yearly' && styles.planCardSelected]}
            onPress={() => setSelected('yearly')}
            activeOpacity={0.8}
          >
            <View style={styles.saveBadge}>
              <Text style={styles.saveBadgeText}>2개월 무료</Text>
            </View>
            <Text style={[styles.planLabel, selected === 'yearly' && styles.planLabelSelected]}>
              연간 플랜
            </Text>
            <Text style={[styles.planPrice, selected === 'yearly' && styles.planPriceSelected]}>
              ₩39,900
            </Text>
            <Text style={[styles.planUnit, selected === 'yearly' && styles.planUnitSelected]}>
              /년
            </Text>
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
            <ActivityIndicator color={colors.text.onPrimary} />
          ) : (
            <Text style={styles.purchaseBtnText}>
              {selected === 'monthly' ? '월간 구독 시작하기' : '연간 구독 시작하기'}
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
            <ActivityIndicator size="small" color={colors.text.secondary} />
          ) : (
            <Text style={styles.restoreBtnText}>구매 복원하기</Text>
          )}
        </TouchableOpacity>

        {Platform.OS === 'ios' && (
          <Text style={styles.legalText}>
            구독은 iTunes 계정으로 청구됩니다. 갱신일 24시간 전에 자동 갱신이 취소되지 않으면
            구독이 자동 갱신됩니다. 구독 관리는 앱스토어 계정 설정에서 할 수 있습니다.
          </Text>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  closeBtn: { alignSelf: 'flex-end', padding: sizes.spacing.lg },
  closeTxt: { fontSize: sizes.font.lg, color: colors.text.secondary },
  content: { paddingHorizontal: sizes.spacing.xl, paddingBottom: sizes.spacing.xl },
  headerSection: { alignItems: 'center', marginBottom: sizes.spacing.xl },
  badge: {
    fontSize: sizes.font.xs,
    fontWeight: sizes.fontWeight.bold,
    color: colors.secondary,
    letterSpacing: 2,
    marginBottom: sizes.spacing.sm,
  },
  title: {
    fontSize: sizes.font.xxxl,
    fontWeight: sizes.fontWeight.bold,
    color: colors.text.primary,
    marginBottom: sizes.spacing.sm,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: sizes.font.md,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  featureList: {
    gap: sizes.spacing.md,
    marginBottom: sizes.spacing.xl,
    backgroundColor: colors.background,
    borderRadius: sizes.radius.lg,
    padding: sizes.spacing.lg,
  },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: sizes.spacing.md },
  featureIcon: { fontSize: 18, width: 24, textAlign: 'center' },
  featureTxt: { fontSize: sizes.font.md, color: colors.text.primary, flex: 1 },
  planRow: { flexDirection: 'row', gap: sizes.spacing.md },
  planCard: {
    flex: 1,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: sizes.radius.lg,
    padding: sizes.spacing.md,
    alignItems: 'center',
    gap: 4,
    position: 'relative',
  },
  planCardSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '08',
  },
  saveBadge: {
    position: 'absolute',
    top: -12,
    backgroundColor: colors.secondary,
    paddingHorizontal: sizes.spacing.sm,
    paddingVertical: 2,
    borderRadius: sizes.radius.full,
  },
  saveBadgeText: {
    fontSize: sizes.font.xs,
    fontWeight: sizes.fontWeight.bold,
    color: colors.text.onPrimary,
  },
  planLabel: {
    fontSize: sizes.font.sm,
    fontWeight: sizes.fontWeight.semibold,
    color: colors.text.secondary,
    marginTop: sizes.spacing.sm,
  },
  planLabelSelected: { color: colors.primary },
  planPrice: {
    fontSize: sizes.font.xl,
    fontWeight: sizes.fontWeight.bold,
    color: colors.text.primary,
  },
  planPriceSelected: { color: colors.primary },
  planUnit: {
    fontSize: sizes.font.xs,
    color: colors.text.secondary,
  },
  planUnitSelected: { color: colors.primary },
  footer: {
    paddingHorizontal: sizes.spacing.xl,
    paddingBottom: sizes.spacing.lg,
    paddingTop: sizes.spacing.md,
    gap: sizes.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
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
    fontWeight: sizes.fontWeight.bold,
    color: colors.text.onPrimary,
  },
  restoreBtn: {
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  restoreBtnText: {
    fontSize: sizes.font.sm,
    color: colors.text.secondary,
  },
  legalText: {
    fontSize: 10,
    color: colors.text.disabled,
    textAlign: 'center',
    lineHeight: 14,
    marginTop: sizes.spacing.xs,
  },
});
