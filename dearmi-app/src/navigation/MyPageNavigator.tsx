import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';

import { MyPageScreen } from '@/features/mypage/screens/MyPageScreen';
import { NotificationSettingsScreen } from '@/features/notification/screens/NotificationSettingsScreen';
import { SubscriptionManageScreen } from '@/features/subscription/screens/SubscriptionManageScreen';
import { LanguageSettingsScreen } from '@/features/mypage/screens/LanguageSettingsScreen';
import { ThemeSettingsScreen } from '@/features/mypage/screens/ThemeSettingsScreen';

export type MyPageStackParamList = {
  MyPageTab: undefined;
  NotificationSettings: undefined;
  LanguageSettings: undefined;
  ThemeSettings: undefined;
  SubscriptionManage: undefined;
};

const Stack = createStackNavigator<MyPageStackParamList>();

export const MyPageNavigator: React.FC = () => (
  <Stack.Navigator
    screenOptions={{
      headerShown: false,
      cardStyle: { backgroundColor: 'transparent' },
    }}
  >
    <Stack.Screen name="MyPageTab" component={MyPageScreen} />
    <Stack.Screen name="NotificationSettings" component={NotificationSettingsScreen} />
    <Stack.Screen name="LanguageSettings" component={LanguageSettingsScreen} />
    <Stack.Screen name="ThemeSettings" component={ThemeSettingsScreen} />
    <Stack.Screen name="SubscriptionManage" component={SubscriptionManageScreen} />
  </Stack.Navigator>
);
