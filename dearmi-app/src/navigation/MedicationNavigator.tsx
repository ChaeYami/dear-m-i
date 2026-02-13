import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';

import { MedicationHomeScreen } from '@/features/medication/screens/MedicationHomeScreen';
import { MedicationFormScreen } from '@/features/medication/screens/MedicationFormScreen';
import { MedicationScheduleDetailScreen } from '@/features/medication/screens/MedicationScheduleDetailScreen';
import { PrescriptionTab } from '@/features/prescription/screens/PrescriptionTab';
import { PrescriptionUploadScreen } from '@/features/prescription/screens/PrescriptionUploadScreen';
import { OcrResultScreen } from '@/features/prescription/screens/OcrResultScreen';
import { MedicationDetailScreen } from '@/features/prescription/screens/MedicationDetailScreen';

/** OCR 흐름에서 전달되는 약품 항목 */
export interface OcrMedicationItem {
  drugName: string;
  dosage?: string;
  singleDose?: string;
  totalDays?: number;
}

export type MedicationStackParamList = {
  MedicationHome: { date?: string } | undefined;
  MedicationForm: {
    scheduleId?: string;
    prescriptionMedicationId?: string;
    drugName?: string;
    dosage?: string;
    singleDose?: string;
    totalDays?: number;
    startDate?: string; // 처방일 (YYYY-MM-DD) — OCR 흐름에서 전달
    isFromOcr?: boolean;
    remainingMeds?: OcrMedicationItem[];
  } | undefined;
  MedicationScheduleDetail: { scheduleId: string; drugName: string };
  PrescriptionList: undefined;
  PrescriptionUpload: undefined;
  OcrResult: { prescriptionId: string };
  MedicationDetail: { medicationId: number; medicationName: string };
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
    <Stack.Screen name="PrescriptionList" component={PrescriptionTab} />
    <Stack.Screen name="PrescriptionUpload" component={PrescriptionUploadScreen} />
    <Stack.Screen name="OcrResult" component={OcrResultScreen} />
    <Stack.Screen name="MedicationDetail" component={MedicationDetailScreen} />
  </Stack.Navigator>
);
