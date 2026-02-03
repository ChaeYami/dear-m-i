import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { colors } from '@/constants';
import { MyPageScreen } from '@/features/mypage/screens/MyPageScreen';
import { MedicationHomeScreen } from '@/features/medication/screens/MedicationHomeScreen';
import { MedicationFormScreen } from '@/features/medication/screens/MedicationFormScreen';
import { MedicationHistoryScreen } from '@/features/medication/screens/MedicationHistoryScreen';
import { NotificationSettingsScreen } from '@/features/notification/screens/NotificationSettingsScreen';

export type MyPageStackParamList = {
  MyPageTab: undefined;
  MedicationHome: undefined;
  MedicationForm: { prescriptionMedicationId?: string } | undefined;
  MedicationHistory: undefined;
  NotificationSettings: undefined;
};

const Stack = createStackNavigator<MyPageStackParamList>();

export const MyPageNavigator: React.FC = () => (
  <Stack.Navigator
    screenOptions={{
      headerShown: false,
      cardStyle: { backgroundColor: colors.background },
    }}
  >
    <Stack.Screen name="MyPageTab" component={MyPageScreen} />
    <Stack.Screen name="MedicationHome" component={MedicationHomeScreen} />
    <Stack.Screen name="MedicationForm" component={MedicationFormScreen} />
    <Stack.Screen name="MedicationHistory" component={MedicationHistoryScreen} />
    <Stack.Screen name="NotificationSettings" component={NotificationSettingsScreen} />
  </Stack.Navigator>
);
