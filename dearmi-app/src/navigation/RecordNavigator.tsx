import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';

import { RecordTab } from '@/features/record/screens/RecordTab';
import { RecordFormScreen } from '@/features/record/screens/RecordFormScreen';
import { PrescriptionTab } from '@/features/prescription/screens/PrescriptionTab';
import { PrescriptionUploadScreen } from '@/features/prescription/screens/PrescriptionUploadScreen';
import { OcrResultScreen } from '@/features/prescription/screens/OcrResultScreen';
import { MedicationDetailScreen } from '@/features/prescription/screens/MedicationDetailScreen';

export type RecordStackParamList = {
  RecordTab: undefined;
  RecordForm: { scheduleId?: number; recordId?: number } | undefined;
  PrescriptionList: undefined;
  PrescriptionUpload: undefined;
  OcrResult: { prescriptionId: number };
  MedicationDetail: { medicationId: number; medicationName: string };
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
      <Stack.Screen name="RecordForm" component={RecordFormScreen} />
      <Stack.Screen name="PrescriptionList" component={PrescriptionTab} />
      <Stack.Screen name="PrescriptionUpload" component={PrescriptionUploadScreen} />
      <Stack.Screen name="OcrResult" component={OcrResultScreen} />
      <Stack.Screen name="MedicationDetail" component={MedicationDetailScreen} />
    </Stack.Navigator>
  );
};
