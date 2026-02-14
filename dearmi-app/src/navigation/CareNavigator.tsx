import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';

import { CareHomeScreen } from '@/features/care/screens/CareHomeScreen';
import { ScheduleDetailScreen } from '@/features/schedule/screens/ScheduleDetailScreen';
import { ScheduleFormScreen } from '@/features/schedule/screens/ScheduleFormScreen';
import { PrepNoteListScreen } from '@/features/prepnote/screens/PrepNoteListScreen';
import { PrepNoteFormScreen } from '@/features/prepnote/screens/PrepNoteFormScreen';
import { RecordDetailScreen } from '@/features/record/screens/RecordDetailScreen';
import { RecordFormScreen } from '@/features/record/screens/RecordFormScreen';
import type { HospitalSchedule } from '@/shared/types/domain.types';

export type CareStackParamList = {
  CareHome: undefined;
  ScheduleDetail: { scheduleId: number | string };
  ScheduleForm: { schedule?: HospitalSchedule; defaultDate?: string; defaultHospitalName?: string } | undefined;
  PrepNoteList: undefined;
  PrepNoteForm: { scheduleId?: string; noteId?: string } | undefined;
  RecordDetail: { recordId: string };
  RecordForm: { scheduleId?: string; recordId?: string; consultedAt?: string } | undefined;
};

const Stack = createStackNavigator<CareStackParamList>();

export const CareNavigator: React.FC = () => (
  <Stack.Navigator
    screenOptions={{
      headerShown: false,
      cardStyle: { backgroundColor: 'transparent' },
    }}
  >
    <Stack.Screen name="CareHome" component={CareHomeScreen} />
    <Stack.Screen name="ScheduleDetail" component={ScheduleDetailScreen} />
    <Stack.Screen name="ScheduleForm" component={ScheduleFormScreen} />
    <Stack.Screen name="PrepNoteList" component={PrepNoteListScreen} />
    <Stack.Screen name="PrepNoteForm" component={PrepNoteFormScreen} />
    <Stack.Screen name="RecordDetail" component={RecordDetailScreen} />
    <Stack.Screen name="RecordForm" component={RecordFormScreen} />
  </Stack.Navigator>
);
