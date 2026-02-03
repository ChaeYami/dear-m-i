import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { colors } from '@/constants';
import { MyPageScreen } from '@/features/mypage/screens/MyPageScreen';
import { NotificationSettingsScreen } from '@/features/notification/screens/NotificationSettingsScreen';
import { SubscriptionManageScreen } from '@/features/subscription/screens/SubscriptionManageScreen';
import { LanguageSettingsScreen } from '@/features/mypage/screens/LanguageSettingsScreen';

export type MyPageStackParamList = {
  MyPageTab: undefined;
  NotificationSettings: undefined;
  LanguageSettings: undefined;
  SubscriptionManage: undefined;
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
    <Stack.Screen name="NotificationSettings" component={NotificationSettingsScreen} />
    <Stack.Screen name="LanguageSettings" component={LanguageSettingsScreen} />
    <Stack.Screen name="SubscriptionManage" component={SubscriptionManageScreen} />
  </Stack.Navigator>
);
