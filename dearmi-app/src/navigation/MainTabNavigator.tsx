import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { colors, sizes } from '@/constants';
import { ScheduleNavigator } from './ScheduleNavigator';
import { RecordNavigator } from './RecordNavigator';
import { PrescriptionNavigator } from './PrescriptionNavigator';
import { useAuthStore } from '@/features/auth/store/authStore';
import { useFcmSetup } from '@/shared/hooks/useFcmSetup';
import type { RootStackParamList } from './RootNavigator';

export type MainTabParamList = {
  Schedule: undefined;
  Record: undefined;
  Prescription: undefined;
  MyPage: undefined;
};

const Tab = createBottomTabNavigator<MainTabParamList>();

/** 탭 플레이스홀더 (각 feature 화면 구현 후 교체) */
const Placeholder = (label: string): React.FC => () => (
  <View style={styles.placeholder}>
    <Text style={styles.text}>{label} 구현 예정</Text>
  </View>
);

/** 프리미엄 전용 기능 잠금 화면 */
const PremiumGate: React.FC = () => {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();

  return (
    <View style={styles.gateContainer}>
      <Text style={styles.gateLockIcon}>🔒</Text>
      <Text style={styles.gateTitle}>프리미엄 전용 기능</Text>
      <Text style={styles.gateDesc}>
        처방전 OCR 자동 인식, 약품 정보 조회,{'\n'}
        복약 일정 관리 등 다양한 기능을{'\n'}
        프리미엄 플랜에서 이용할 수 있어요.
      </Text>
      <TouchableOpacity
        style={styles.upgradeBtn}
        onPress={() => navigation.navigate('Paywall')}
        activeOpacity={0.85}
      >
        <Text style={styles.upgradeBtnTxt}>업그레이드</Text>
      </TouchableOpacity>
    </View>
  );
};

/** Prescription 탭: FREE 플랜이면 PremiumGate, 아니면 실제 화면 */
const PrescriptionTabWrapper: React.FC = () => {
  const plan = useAuthStore((s) => s.user?.plan);

  if (plan === 'FREE') {
    return <PremiumGate />;
  }
  return <PrescriptionNavigator />;
};

export const MainTabNavigator: React.FC = () => {
  useFcmSetup();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.text.disabled,
        tabBarStyle: {
          height: sizes.tabBarHeight,
          borderTopColor: colors.border,
          backgroundColor: colors.surface,
        },
        tabBarLabelStyle: {
          fontSize: sizes.font.xs,
          fontWeight: sizes.fontWeight.medium,
          marginBottom: 4,
        },
      }}
    >
      <Tab.Screen
        name="Schedule"
        component={ScheduleNavigator}
        options={{ title: '일정' }}
      />
      <Tab.Screen name="Record" component={RecordNavigator} options={{ title: '기록' }} />
      <Tab.Screen name="Prescription" component={PrescriptionTabWrapper} options={{ title: '처방전' }} />
      <Tab.Screen name="MyPage" component={Placeholder('마이페이지')} options={{ title: '마이' }} />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  placeholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
  text: { color: colors.text.secondary },
  // PremiumGate
  gateContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
    paddingHorizontal: sizes.spacing.xl,
  },
  gateLockIcon: {
    fontSize: 48,
    marginBottom: sizes.spacing.lg,
  },
  gateTitle: {
    fontSize: sizes.font.xl,
    fontWeight: sizes.fontWeight.bold,
    color: colors.text.primary,
    marginBottom: sizes.spacing.md,
    textAlign: 'center',
  },
  gateDesc: {
    fontSize: sizes.font.md,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: sizes.spacing.xl,
  },
  upgradeBtn: {
    height: sizes.buttonHeight.lg,
    paddingHorizontal: sizes.spacing.xxl,
    borderRadius: sizes.radius.lg,
    backgroundColor: colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  upgradeBtnTxt: {
    fontSize: sizes.font.md,
    fontWeight: sizes.fontWeight.bold,
    color: colors.text.onPrimary,
  },
});
