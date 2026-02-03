import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, CompositeNavigationProp } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { colors, sizes } from '@/constants';
import { useSubscriptionStore } from '@/features/subscription/store/subscriptionStore';
import { useSubscription } from '@/features/subscription/hooks/useSubscription';
import type { MyPageStackParamList } from '@/navigation/MyPageNavigator';
import type { RootStackParamList } from '@/navigation/RootNavigator';

type Nav = CompositeNavigationProp<
  StackNavigationProp<MyPageStackParamList, 'SubscriptionManage'>,
  StackNavigationProp<RootStackParamList>
>;

const formatDate = (iso?: string) => {
  if (!iso) return '-';
  const d = new Date(iso);
  return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일`;
};

export const SubscriptionManageScreen: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const { plan, expiresAt } = useSubscriptionStore();
  const { cancelSubscription, isCancelling } = useSubscription();

  const handleCancel = () => {
    Alert.alert(
      '구독 취소',
      '프리미엄 구독을 취소하시겠습니까?\n만료일까지는 계속 이용할 수 있습니다.',
      [
        { text: '유지', style: 'cancel' },
        {
          text: '취소하기',
          style: 'destructive',
          onPress: () => cancelSubscription(),
        },
      ]
    );
  };

  const isPremium = plan === 'PREMIUM';

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={12}>
          <Ionicons name="chevron-back" size={24} color={colors.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>구독 관리</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* 현재 플랜 카드 */}
        <View style={[styles.planCard, isPremium && styles.planCardPremium]}>
          <View style={styles.planBadgeRow}>
            <View style={[styles.planBadge, isPremium && styles.planBadgePremium]}>
              <Text style={[styles.planBadgeText, isPremium && styles.planBadgeTextPremium]}>
                {isPremium ? '프리미엄' : '무료'}
              </Text>
            </View>
          </View>
          <Text style={styles.planTitle}>
            {isPremium ? 'DearMI 프리미엄' : 'DearMI 무료 플랜'}
          </Text>
          {isPremium && expiresAt && (
            <Text style={styles.planExpiry}>
              {formatDate(expiresAt)} 갱신 예정
            </Text>
          )}
          {!isPremium && (
            <Text style={styles.planDesc}>
              프리미엄으로 업그레이드하여 모든 기능을 이용해 보세요.
            </Text>
          )}
        </View>

        {/* 프리미엄 기능 안내 */}
        {!isPremium && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>프리미엄 혜택</Text>
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
              <Text style={styles.upgradeBtnText}>프리미엄 시작하기</Text>
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
                <Text style={styles.cancelBtnText}>구독 취소</Text>
              )}
            </TouchableOpacity>
            <Text style={styles.cancelNote}>
              취소 후에도 만료일까지 프리미엄 기능을 사용할 수 있습니다.
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const BENEFITS = [
  '처방전 OCR 자동 인식',
  '약품 효능·주의사항 상세 정보',
  '복약 일정 자동 생성',
  '전체 상담 기록 무제한 조회',
  'PDF 진료 기록 내보내기',
  '상담 기록 무제한 작성',
];

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    height: sizes.headerHeight,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: sizes.spacing.lg,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  backBtn: { fontSize: sizes.font.md, color: colors.primary, fontWeight: sizes.fontWeight.medium, width: 60 },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: sizes.font.lg,
    fontWeight: sizes.fontWeight.bold,
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
    fontWeight: sizes.fontWeight.bold,
    color: colors.textSub,
  },
  planBadgeTextPremium: { color: colors.primary },
  planTitle: {
    fontSize: sizes.font.lg,
    fontWeight: sizes.fontWeight.bold,
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
    fontWeight: sizes.fontWeight.bold,
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
  benefitCheck: { fontSize: sizes.font.md, color: colors.secondary, fontWeight: sizes.fontWeight.bold },
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
    fontWeight: sizes.fontWeight.bold,
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
    fontWeight: sizes.fontWeight.semibold,
    color: colors.error,
  },
  cancelNote: {
    fontSize: sizes.font.xs,
    color: colors.textDisabled,
    textAlign: 'center',
  },
});
