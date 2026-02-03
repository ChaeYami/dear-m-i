import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
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

const PremiumGate: React.FC = () => {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const { t } = useTranslation();

  return (
    <View style={styles.gateContainer}>
      <Ionicons name="lock-closed" size={48} color={colors.textDisabled} />
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

const PrescriptionTabWrapper: React.FC = () => {
  const plan = useAuthStore((s) => s.user?.plan);

  if (plan === 'FREE') {
    return <PremiumGate />;
  }
  return <PrescriptionNavigator />;
};

const TAB_ICONS: Record<string, { focused: keyof typeof Ionicons.glyphMap; unfocused: keyof typeof Ionicons.glyphMap }> = {
  Schedule:     { focused: 'calendar',         unfocused: 'calendar-outline' },
  Record:       { focused: 'document-text',    unfocused: 'document-text-outline' },
  Checkin:      { focused: 'heart',            unfocused: 'heart-outline' },
  Prescription: { focused: 'medkit',           unfocused: 'medkit-outline' },
  MyPage:       { focused: 'person',           unfocused: 'person-outline' },
};

export const MainTabNavigator: React.FC = () => {
  useFcmSetup();
  const { t } = useTranslation();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textDisabled,
        tabBarStyle: {
          position: 'absolute' as const,
          bottom: 24,
          left: 20,
          right: 20,
          height: sizes.tabBarHeight,
          borderRadius: 32,
          backgroundColor: 'rgba(255, 255, 255, 0.85)',
          borderWidth: 1,
          borderColor: colors.glassBorder,
          borderTopWidth: 1,
          borderTopColor: colors.glassBorder,
          elevation: 0,
          ...Platform.select({
            ios: {
              shadowColor: colors.glassShadow,
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 1,
              shadowRadius: 24,
            },
          }),
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: sizes.fontWeight.medium,
          marginBottom: 6,
        },
        tabBarIconStyle: {
          marginTop: 6,
        },
        tabBarIcon: ({ focused, color }) => {
          const icons = TAB_ICONS[route.name] ?? TAB_ICONS.Schedule;
          return (
            <View style={styles.tabIconWrap}>
              {focused && <View style={styles.tabDot} />}
              <Ionicons name={focused ? icons.focused : icons.unfocused} size={focused ? 24 : 22} color={color} />
            </View>
          );
        },
      })}
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
  tabIconWrap: {
    alignItems: 'center',
  },
  tabDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.primary,
    marginBottom: 2,
  },
  // PremiumGate
  gateContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
    paddingHorizontal: sizes.spacing.xl,
  },
  gateTitle: {
    fontSize: sizes.font.xl,
    fontWeight: sizes.fontWeight.bold,
    color: colors.text,
    marginTop: sizes.spacing.lg,
    marginBottom: sizes.spacing.md,
    textAlign: 'center',
  },
  gateDesc: {
    fontSize: sizes.font.md,
    color: colors.textSub,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: sizes.spacing.xl,
  },
  upgradeBtn: {
    height: sizes.buttonHeight.lg,
    paddingHorizontal: sizes.spacing.xxl,
    borderRadius: sizes.radius.lg,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  upgradeBtnTxt: {
    fontSize: sizes.font.md,
    fontWeight: sizes.fontWeight.bold,
    color: colors.textInverse,
  },
});
