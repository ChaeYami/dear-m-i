import React from 'react';
import { View, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  createBottomTabNavigator,
  type BottomTabBarProps,
} from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme, sizes } from '@/shared/theme';
import { runTabSwitchGuard } from '@/shared/navigation/tabSwitchGuard';
import { ScheduleNavigator } from './ScheduleNavigator';
import { CheckinNavigator } from './CheckinNavigator';
import { RecordNavigator } from './RecordNavigator';
import { MedicationNavigator } from './MedicationNavigator';
import { MyPageNavigator } from './MyPageNavigator';
import { useFcmSetup } from '@/shared/hooks/useFcmSetup';

export type MainTabParamList = {
  Schedule: undefined;
  Checkin: undefined;
  Record: undefined;
  Medication: undefined;
  MyPage: undefined;
};

const Tab = createBottomTabNavigator<MainTabParamList>();

const TAB_ICONS: Record<string, { focused: keyof typeof Ionicons.glyphMap; unfocused: keyof typeof Ionicons.glyphMap }> = {
  Schedule:   { focused: 'calendar',      unfocused: 'calendar-outline' },
  Checkin:    { focused: 'heart',         unfocused: 'heart-outline' },
  Record:     { focused: 'document-text', unfocused: 'document-text-outline' },
  Medication: { focused: 'medical',       unfocused: 'medical-outline' },
  MyPage:     { focused: 'person',        unfocused: 'person-outline' },
};

const CustomTabBar: React.FC<BottomTabBarProps> = ({ state, descriptors, navigation }) => {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const tabBarBottom = Math.max(insets.bottom + 8, 28);

  return (
    <View
      style={{
        position: 'absolute',
        left: 20,
        right: 20,
        bottom: tabBarBottom,
        height: sizes.tabBarHeight,
        borderRadius: 32,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: isDark ? 'rgba(30, 27, 46, 0.94)' : 'rgba(255, 255, 255, 0.94)',
        borderWidth: 1,
        borderColor: colors.glassBorder,
        elevation: 8,
        shadowColor: isDark ? '#000' : colors.glassShadow,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: isDark ? 0.4 : 0.15,
        shadowRadius: 16,
        paddingHorizontal: 4,
      }}
    >
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        const isFocused = state.index === index;
        const icons = TAB_ICONS[route.name] ?? TAB_ICONS.Schedule;
        const color = isFocused ? colors.primary : colors.textDisabled;

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });
          if (event.defaultPrevented) return;
          if (isFocused) return; // 같은 탭은 useResetStackOnTabFocus 에서 처리
          // 다른 탭 이동 — 가드(폼 이탈 경고 등) 통과 시에만 navigate
          runTabSwitchGuard(route.name, () => {
            navigation.navigate(route.name as never);
          });
        };

        const onLongPress = () => {
          navigation.emit({ type: 'tabLongPress', target: route.key });
        };

        return (
          <Pressable
            key={route.key}
            accessibilityRole="button"
            accessibilityState={isFocused ? { selected: true } : {}}
            accessibilityLabel={options.tabBarAccessibilityLabel}
            testID={options.tabBarButtonTestID}
            onPress={onPress}
            onLongPress={onLongPress}
            android_ripple={{ borderless: true }}
            style={{
              flex: 1,
              height: '100%',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <View style={{ alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons
                name={isFocused ? icons.focused : icons.unfocused}
                size={24}
                color={color}
              />
              <View
                style={{
                  marginTop: 4,
                  width: 20,
                  height: 3,
                  borderRadius: 1.5,
                  backgroundColor: isFocused ? colors.primary : 'transparent',
                }}
              />
            </View>
          </Pressable>
        );
      })}
    </View>
  );
};

export const MainTabNavigator: React.FC = () => {
  useFcmSetup();

  return (
    <Tab.Navigator
      screenOptions={{ headerShown: false }}
      tabBar={(props) => <CustomTabBar {...props} />}
      initialRouteName="Checkin"
    >
      <Tab.Screen name="Schedule" component={ScheduleNavigator} />
      <Tab.Screen name="Checkin" component={CheckinNavigator} />
      <Tab.Screen name="Record" component={RecordNavigator} />
      <Tab.Screen name="Medication" component={MedicationNavigator} />
      <Tab.Screen name="MyPage" component={MyPageNavigator} />
    </Tab.Navigator>
  );
};
