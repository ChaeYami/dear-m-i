import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { useTranslation } from 'react-i18next';
import { colors, sizes } from '@/constants';
import { ScheduleNavigator } from './ScheduleNavigator';
import { CheckinNavigator } from './CheckinNavigator';
import { RecordNavigator } from './RecordNavigator';
import { MedicationNavigator } from './MedicationNavigator';
import { MyPageNavigator } from './MyPageNavigator';
import { useAuthStore } from '@/features/auth/store/authStore';
import { useFcmSetup } from '@/shared/hooks/useFcmSetup';
import type { RootStackParamList } from './RootNavigator';

export type MainTabParamList = {
  Schedule: undefined;
  Checkin: undefined;
  Record: undefined;
  Medication: undefined;
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


const TAB_ICONS: Record<string, { focused: keyof typeof Ionicons.glyphMap; unfocused: keyof typeof Ionicons.glyphMap }> = {
  Schedule:     { focused: 'calendar',         unfocused: 'calendar-outline' },
  Checkin:      { focused: 'heart',            unfocused: 'heart-outline' },
  Record:       { focused: 'document-text',    unfocused: 'document-text-outline' },
  Medication:   { focused: 'medical',          unfocused: 'medical-outline' },
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
          bottom: 28,
          marginHorizontal: 20,
          height: sizes.tabBarHeight,
          borderRadius: 32,
          backgroundColor: 'rgba(255, 255, 255, 0.92)',
          borderWidth: 1,
          borderColor: colors.glassBorder,
          borderTopWidth: 0,
          elevation: 8,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.12,
          shadowRadius: 16,
          paddingHorizontal: 4,
        },
        tabBarLabelStyle: {
          fontSize: 9,
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
              <Ionicons name={focused ? icons.focused : icons.unfocused} size={focused ? 22 : 20} color={color} />
            </View>
          );
        },
      })}
      initialRouteName="Checkin"
    >
      <Tab.Screen name="Schedule" component={ScheduleNavigator} options={{ title: t('tab_schedule') }} />
      <Tab.Screen name="Checkin" component={CheckinNavigator} options={{ title: t('tab_checkin') }} />
      <Tab.Screen name="Record" component={RecordNavigator} options={{ title: t('tab_record') }} />
      <Tab.Screen name="Medication" component={MedicationNavigator} options={{ title: '복약' }} />
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
