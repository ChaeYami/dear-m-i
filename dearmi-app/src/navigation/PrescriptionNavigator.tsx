import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { colors } from '@/constants';
import { PrescriptionTab } from '@/features/prescription/screens/PrescriptionTab';
import { PrescriptionUploadScreen } from '@/features/prescription/screens/PrescriptionUploadScreen';
import { OcrResultScreen } from '@/features/prescription/screens/OcrResultScreen';
import { MedicationDetailScreen } from '@/features/prescription/screens/MedicationDetailScreen';

export type PrescriptionStackParamList = {
  PrescriptionTab: undefined;
  PrescriptionUpload: undefined;
  OcrResult: { prescriptionId: number };
  MedicationDetail: { medicationId: number; medicationName: string };
};

const Stack = createStackNavigator<PrescriptionStackParamList>();

export const PrescriptionNavigator: React.FC = () => (
  <Stack.Navigator
    screenOptions={{
      headerShown: false,
      cardStyle: { backgroundColor: colors.background },
    }}
  >
    <Stack.Screen name="PrescriptionTab" component={PrescriptionTab} />
    <Stack.Screen name="PrescriptionUpload" component={PrescriptionUploadScreen} />
    <Stack.Screen name="OcrResult" component={OcrResultScreen} />
    <Stack.Screen name="MedicationDetail" component={MedicationDetailScreen} />
  </Stack.Navigator>
);
