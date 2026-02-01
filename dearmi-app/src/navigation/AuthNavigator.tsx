import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { createStackNavigator } from '@react-navigation/stack';
import { colors } from '@/constants';

export type AuthStackParamList = {
  Login: undefined;
  /** 추가 예정: SignUp, ForgotPassword 등 */
};

const Stack = createStackNavigator<AuthStackParamList>();

/** 로그인 화면 플레이스홀더 (features/auth/screens/LoginScreen 구현 후 교체) */
const LoginPlaceholder: React.FC = () => (
  <View style={styles.placeholder}>
    <Text style={styles.text}>LoginScreen 구현 예정</Text>
  </View>
);

/**
 * 미인증 사용자용 네비게이터
 * - 로그인, 회원가입 등 인증 관련 화면
 */
export const AuthNavigator: React.FC = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        cardStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen name="Login" component={LoginPlaceholder} />
    </Stack.Navigator>
  );
};

const styles = StyleSheet.create({
  placeholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
  text: { color: colors.text.secondary },
});
