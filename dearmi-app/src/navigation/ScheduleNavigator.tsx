import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';

import { ScheduleTab } from '@/features/schedule/screens/ScheduleTab';
import { ScheduleDetailScreen } from '@/features/schedule/screens/ScheduleDetailScreen';
import { ScheduleFormScreen } from '@/features/schedule/screens/ScheduleFormScreen';
import { PrepNoteListScreen } from '@/features/prepnote/screens/PrepNoteListScreen';
import { PrepNoteFormScreen } from '@/features/prepnote/screens/PrepNoteFormScreen';
import type { HospitalSchedule } from '@/shared/types/domain.types';

export type ScheduleStackParamList = {
  ScheduleTab: undefined;
  ScheduleDetail: { scheduleId: number | string };
  ScheduleForm: { schedule?: HospitalSchedule; defaultDate?: string } | undefined;
  PrepNoteList: undefined;
  PrepNoteForm: { scheduleId?: string; noteId?: string } | undefined;
};

const Stack = createStackNavigator<ScheduleStackParamList>();

export const ScheduleNavigator: React.FC = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        cardStyle: { backgroundColor: 'transparent' },
      }}
    >
      <Stack.Screen name="ScheduleTab" component={ScheduleTab} />
      <Stack.Screen name="ScheduleDetail" component={ScheduleDetailScreen} />
      <Stack.Screen name="ScheduleForm" component={ScheduleFormScreen} />
      <Stack.Screen name="PrepNoteList" component={PrepNoteListScreen} />
      <Stack.Screen name="PrepNoteForm" component={PrepNoteFormScreen} />
    </Stack.Navigator>
  );
};
