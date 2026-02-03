import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { useTranslation } from 'react-i18next';
import { colors, sizes } from '@/constants';
import { ScheduleNavigator } from './ScheduleNavigator';
import { RecordNavigator } from './RecordNavigator';
import { CheckinNavigator } from './CheckinNavigator';
import { PrescriptionNavigator } from './PrescriptionNavigator';
import { MyPageNavigator } from './MyPageNavigator';
import { useAuthStore } from '@/features/auth/store/authStore';
import { useFcmSetup } from '@/shared/hooks/useFcmSetup';
import type { RootStackParamList } from './RootNavigator';

export type MainTabParamList = {
  Schedule: undefined;
  Record: undefined;
  Checkin: undefined;
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
  const { t } = useTranslation();

  return (
    <View style={styles.gateContainer}>
      <Text style={styles.gateLockIcon}>🔒</Text>
      <Text style={styles.gateTitle}>{t('premium_gate_title')}</Text>
      <Text style={styles.gateDesc}>{t('premium_gate_desc')}</Text>
      <TouchableOpacity
        style={styles.upgradeBtn}
        onPress={() => navigation.navigate('Paywall')}
        activeOpacity={0.85}
      >
        <Text style={styles.upgradeBtnTxt}>{t('upgrade')}</Text>
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
  const { t } = useTranslation();

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
        options={{ title: t('tab_schedule') }}
      />
      <Tab.Screen name="Record" component={RecordNavigator} options={{ title: t('tab_record') }} />
      <Tab.Screen name="Checkin" component={CheckinNavigator} options={{ title: t('tab_checkin') }} />
      <Tab.Screen name="Prescription" component={PrescriptionTabWrapper} options={{ title: t('tab_prescription') }} />
      <Tab.Screen name="MyPage" component={MyPageNavigator} options={{ title: t('tab_mypage') }} />
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
