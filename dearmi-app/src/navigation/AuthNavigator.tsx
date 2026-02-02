import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { colors } from '@/constants';
import { LoginScreen } from '@/features/auth/screens/LoginScreen';

export type AuthStackParamList = {
  Login: undefined;
};

const Stack = createStackNavigator<AuthStackParamList>();

/**
 * 미인증 사용자용 네비게이터
 */
export const AuthNavigator: React.FC = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        cardStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen name="Login" component={LoginScreen} />
    </Stack.Navigator>
  );
};
