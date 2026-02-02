import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { colors } from '@/constants';
import { RecordTab } from '@/features/record/screens/RecordTab';
import { RecordFormScreen } from '@/features/record/screens/RecordFormScreen';

export type RecordStackParamList = {
  RecordTab: undefined;
  RecordForm: { scheduleId?: number; recordId?: number } | undefined;
};

const Stack = createStackNavigator<RecordStackParamList>();

export const RecordNavigator: React.FC = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        cardStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen name="RecordTab" component={RecordTab} />
      <Stack.Screen name="RecordForm" component={RecordFormScreen} />
    </Stack.Navigator>
  );
};
