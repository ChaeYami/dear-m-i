import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { colors } from '@/constants';
import { MyPageScreen } from '@/features/mypage/screens/MyPageScreen';
import { MedicationHomeScreen } from '@/features/medication/screens/MedicationHomeScreen';
import { MedicationFormScreen } from '@/features/medication/screens/MedicationFormScreen';
import { MedicationHistoryScreen } from '@/features/medication/screens/MedicationHistoryScreen';
import { NotificationSettingsScreen } from '@/features/notification/screens/NotificationSettingsScreen';
import { SubscriptionManageScreen } from '@/features/subscription/screens/SubscriptionManageScreen';

/** OCR 흐름에서 전달되는 약품 항목 */
export interface OcrMedicationItem {
  drugName: string;
  dosage?: string;
  totalDays?: number;
}

export type MyPageStackParamList = {
  MyPageTab: undefined;
  MedicationHome: undefined;
  MedicationForm: {
    prescriptionMedicationId?: string;
    /** OCR 흐름: 직접 pre-fill 값 */
    drugName?: string;
    dosage?: string;
    totalDays?: number;
    /** OCR 흐름 여부 — true이면 '다음 약품' 버튼 표시 */
    isFromOcr?: boolean;
    /** 아직 등록하지 않은 나머지 약품 목록 */
    remainingMeds?: OcrMedicationItem[];
  } | undefined;
  MedicationHistory: undefined;
  NotificationSettings: undefined;
  SubscriptionManage: undefined;
};

const Stack = createStackNavigator<MyPageStackParamList>();

export const MyPageNavigator: React.FC = () => (
  <Stack.Navigator
    screenOptions={{
      headerShown: false,
      cardStyle: { backgroundColor: colors.background },
    }}
  >
    <Stack.Screen name="MyPageTab" component={MyPageScreen} />
    <Stack.Screen name="MedicationHome" component={MedicationHomeScreen} />
    <Stack.Screen name="MedicationForm" component={MedicationFormScreen} />
    <Stack.Screen name="MedicationHistory" component={MedicationHistoryScreen} />
    <Stack.Screen name="NotificationSettings" component={NotificationSettingsScreen} />
    <Stack.Screen name="SubscriptionManage" component={SubscriptionManageScreen} />
  </Stack.Navigator>
);
