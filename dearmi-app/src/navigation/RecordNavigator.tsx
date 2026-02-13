import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';

import { RecordTab } from '@/features/record/screens/RecordTab';
import { RecordDetailScreen } from '@/features/record/screens/RecordDetailScreen';
import { RecordFormScreen } from '@/features/record/screens/RecordFormScreen';

export type RecordStackParamList = {
  RecordTab: undefined;
  RecordDetail: { recordId: string };
  RecordForm: { scheduleId?: string; recordId?: string; consultedAt?: string } | undefined;
};

const Stack = createStackNavigator<RecordStackParamList>();

export const RecordNavigator: React.FC = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        cardStyle: { backgroundColor: 'transparent' },
      }}
    >
      <Stack.Screen name="RecordTab" component={RecordTab} />
      <Stack.Screen name="RecordDetail" component={RecordDetailScreen} />
      <Stack.Screen name="RecordForm" component={RecordFormScreen} />
    </Stack.Navigator>
  );
};
