import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';

import { CheckinHomeScreen } from '@/features/checkin/screens/CheckinHomeScreen';
import { CheckinHistoryScreen } from '@/features/checkin/screens/CheckinHistoryScreen';

export type CheckinStackParamList = {
  CheckinHome: undefined;
  CheckinHistory: undefined;
};

const Stack = createStackNavigator<CheckinStackParamList>();

export const CheckinNavigator: React.FC = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        cardStyle: { backgroundColor: 'transparent' },
      }}
    >
      <Stack.Screen name="CheckinHome" component={CheckinHomeScreen} />
      <Stack.Screen name="CheckinHistory" component={CheckinHistoryScreen} />
    </Stack.Navigator>
  );
};
