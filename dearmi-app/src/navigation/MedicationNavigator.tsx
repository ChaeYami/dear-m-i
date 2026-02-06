import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';

import { MedicationHomeScreen } from '@/features/medication/screens/MedicationHomeScreen';
import { MedicationFormScreen } from '@/features/medication/screens/MedicationFormScreen';
import { MedicationScheduleDetailScreen } from '@/features/medication/screens/MedicationScheduleDetailScreen';

/** OCR 흐름에서 전달되는 약품 항목 */
export interface OcrMedicationItem {
  drugName: string;
  dosage?: string;
  totalDays?: number;
}

export type MedicationStackParamList = {
  MedicationHome: { date?: string } | undefined;
  MedicationForm: {
    scheduleId?: string;
    prescriptionMedicationId?: string;
    drugName?: string;
    dosage?: string;
    totalDays?: number;
    isFromOcr?: boolean;
    remainingMeds?: OcrMedicationItem[];
  } | undefined;
  MedicationScheduleDetail: { scheduleId: string; drugName: string };
};

const Stack = createStackNavigator<MedicationStackParamList>();

export const MedicationNavigator: React.FC = () => (
  <Stack.Navigator
    screenOptions={{
      headerShown: false,
      cardStyle: { backgroundColor: 'transparent' },
    }}
  >
    <Stack.Screen name="MedicationHome" component={MedicationHomeScreen} />
    <Stack.Screen name="MedicationForm" component={MedicationFormScreen} />
    <Stack.Screen name="MedicationScheduleDetail" component={MedicationScheduleDetailScreen} />
  </Stack.Navigator>
);
