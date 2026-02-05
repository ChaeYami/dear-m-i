import React from 'react';
import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useTranslation } from 'react-i18next';
import { useTheme, sizes, fontFamily } from '@/shared/theme';
import { ScheduleNavigator } from './ScheduleNavigator';
import { CheckinNavigator } from './CheckinNavigator';
import { RecordNavigator } from './RecordNavigator';
import { MedicationNavigator } from './MedicationNavigator';
import { MyPageNavigator } from './MyPageNavigator';
import { useFcmSetup } from '@/shared/hooks/useFcmSetup';

export type MainTabParamList = {
  Schedule: undefined;
  Checkin: undefined;
  Record: undefined;
  Medication: undefined;
  MyPage: undefined;
};

const Tab = createBottomTabNavigator<MainTabParamList>();

const TAB_ICONS: Record<string, { focused: keyof typeof Ionicons.glyphMap; unfocused: keyof typeof Ionicons.glyphMap }> = {
  Schedule:   { focused: 'calendar',      unfocused: 'calendar-outline' },
  Checkin:    { focused: 'heart',         unfocused: 'heart-outline' },
  Record:     { focused: 'document-text', unfocused: 'document-text-outline' },
  Medication: { focused: 'medical',       unfocused: 'medical-outline' },
  MyPage:     { focused: 'person',        unfocused: 'person-outline' },
};

export const MainTabNavigator: React.FC = () => {
  useFcmSetup();
  const { colors, isDark } = useTheme();
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
          backgroundColor: isDark
            ? 'rgba(30, 27, 46, 0.94)'
            : 'rgba(255, 255, 255, 0.94)',
          borderWidth: 1,
          borderColor: colors.glassBorder,
          borderTopWidth: 0,
          elevation: 8,
          shadowColor: isDark ? '#000' : colors.glassShadow,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: isDark ? 0.4 : 0.15,
          shadowRadius: 16,
          paddingHorizontal: 4,
        },
        tabBarLabelStyle: {
          fontFamily: fontFamily.semibold,
          fontSize: 10,
          marginBottom: 6,
        },
        tabBarIconStyle: {
          marginTop: 4,
        },
        tabBarIcon: ({ focused, color }) => {
          const icons = TAB_ICONS[route.name] ?? TAB_ICONS.Schedule;
          return (
            <View style={{ alignItems: 'center' }}>
              <Ionicons
                name={focused ? icons.focused : icons.unfocused}
                size={focused ? 24 : 20}
                color={color}
              />
              {focused && (
                <View
                  style={{
                    width: 20,
                    height: 3,
                    borderRadius: 1.5,
                    backgroundColor: colors.primary,
                    marginTop: 3,
                  }}
                />
              )}
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
