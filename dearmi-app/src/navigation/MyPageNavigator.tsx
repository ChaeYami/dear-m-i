import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';

import { MyPageScreen } from '@/features/mypage/screens/MyPageScreen';
import { NotificationSettingsScreen } from '@/features/notification/screens/NotificationSettingsScreen';
import { SubscriptionManageScreen } from '@/features/subscription/screens/SubscriptionManageScreen';
import { LanguageSettingsScreen } from '@/features/mypage/screens/LanguageSettingsScreen';
import { ThemeSettingsScreen } from '@/features/mypage/screens/ThemeSettingsScreen';
import { AccountScreen } from '@/features/mypage/screens/AccountScreen';
import { NoticeListScreen } from '@/features/mypage/screens/NoticeListScreen';
import { FaqScreen } from '@/features/mypage/screens/FaqScreen';
import { LegalScreen } from '@/features/mypage/screens/LegalScreen';

export type MyPageStackParamList = {
  MyPageTab: undefined;
  NotificationSettings: undefined;
  LanguageSettings: undefined;
  ThemeSettings: undefined;
  SubscriptionManage: undefined;
  Account: undefined;
  NoticeList: undefined;
  Faq: undefined;
  Legal: { kind: 'terms' | 'privacy' | 'licenses' };
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
    <Stack.Screen name="Account" component={AccountScreen} />
    <Stack.Screen name="NoticeList" component={NoticeListScreen} />
    <Stack.Screen name="Faq" component={FaqScreen} />
    <Stack.Screen name="Legal" component={LegalScreen} />
  </Stack.Navigator>
);
