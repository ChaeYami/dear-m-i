import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { colors, sizes } from '@/constants';

export type MainTabParamList = {
  Schedule: undefined;
  Record: undefined;
  Prescription: undefined;
  MyPage: undefined;
};

const Tab = createBottomTabNavigator<MainTabParamList>();

/** 탭 플레이스홀더 (각 feature 화면 구현 후 교체) */
const Placeholder = (label: string): React.FC => () => (
  <View style={styles.placeholder}>
    <Text style={styles.text}>{label} 구현 예정</Text>
  </View>
);

/**
 * 인증된 사용자의 메인 탭 네비게이터
 * - 각 탭의 Icon 및 Screen은 feature 구현 후 교체
 */
export const MainTabNavigator: React.FC = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.text.disabled,
        tabBarStyle: {
          height: sizes.tabBarHeight,
          borderTopColor: colors.border,
          backgroundColor: colors.surface,
        },
        tabBarLabelStyle: {
          fontSize: sizes.font.xs,
          fontWeight: sizes.fontWeight.medium,
          marginBottom: 4,
        },
      }}
    >
      <Tab.Screen name="Schedule" component={Placeholder('일정')} options={{ title: '일정' }} />
      <Tab.Screen name="Record" component={Placeholder('기록')} options={{ title: '기록' }} />
      <Tab.Screen name="Prescription" component={Placeholder('처방전')} options={{ title: '처방전' }} />
      <Tab.Screen name="MyPage" component={Placeholder('마이페이지')} options={{ title: '마이' }} />
    </Tab.Navigator>
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
