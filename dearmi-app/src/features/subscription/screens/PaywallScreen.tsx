import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { colors, sizes } from '@/constants';

/**
 * 결제/구독 화면 (v1.1 예정)
 * 현재는 placeholder — 결제 연동 전 UI 확인용
 */
export const PaywallScreen: React.FC = () => {
  const navigation = useNavigation();

  return (
    <SafeAreaView style={styles.container}>
      <TouchableOpacity style={styles.closeBtn} onPress={() => navigation.goBack()}>
        <Text style={styles.closeTxt}>✕</Text>
      </TouchableOpacity>

      <View style={styles.body}>
        <Text style={styles.badge}>PREMIUM</Text>
        <Text style={styles.title}>DearMI 프리미엄</Text>
        <Text style={styles.subtitle}>처방전 OCR, 약품 정보, 전체 기록 조회까지</Text>

        <View style={styles.featureList}>
          {FEATURES.map((f) => (
            <View key={f} style={styles.featureRow}>
              <Text style={styles.featureCheck}>✓</Text>
              <Text style={styles.featureTxt}>{f}</Text>
            </View>
          ))}
        </View>

        <TouchableOpacity style={styles.comingSoonBtn} disabled>
          <Text style={styles.comingSoonTxt}>결제 연동 준비 중</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const FEATURES = [
  '처방전 OCR 자동 인식',
  '약품 효능·주의사항 상세 정보',
  '복약 일정 자동 생성',
  '전체 상담 기록 조회',
  'PDF 내보내기',
];

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  closeBtn: { alignSelf: 'flex-end', padding: sizes.spacing.lg },
  closeTxt: { fontSize: sizes.font.lg, color: colors.text.secondary },
  body: { flex: 1, alignItems: 'center', paddingHorizontal: sizes.spacing.xl, paddingTop: sizes.spacing.xl },
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
    marginBottom: sizes.spacing.xl,
  },
  featureList: { width: '100%', gap: sizes.spacing.md, marginBottom: sizes.spacing.xxl },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: sizes.spacing.sm },
  featureCheck: { fontSize: sizes.font.md, color: colors.secondary, fontWeight: sizes.fontWeight.bold },
  featureTxt: { fontSize: sizes.font.md, color: colors.text.primary },
  comingSoonBtn: {
    width: '100%',
    height: sizes.buttonHeight.lg,
    borderRadius: sizes.radius.lg,
    backgroundColor: colors.disabled,
    alignItems: 'center',
    justifyContent: 'center',
  },
  comingSoonTxt: { fontSize: sizes.font.md, color: colors.text.disabled, fontWeight: sizes.fontWeight.semibold },
});
