import React, { useEffect } from 'react';
import { View, Pressable, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  createBottomTabNavigator,
  type BottomTabBarProps,
} from '@react-navigation/bottom-tabs';
import { getFocusedRouteNameFromRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  interpolate,
  interpolateColor,
} from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';
import { useTheme, sizes, fontFamily } from '@/shared/theme';
import { GlassView } from '@/shared/components/GlassView';
import { runTabSwitchGuard } from '@/shared/navigation/tabSwitchGuard';
import {
  TabBarVisibilityProvider,
  useTabBarVisibility,
} from '@/shared/navigation/TabBarVisibilityContext';
import { CareNavigator } from './CareNavigator';
import { CheckinNavigator } from './CheckinNavigator';
import { MedicationNavigator } from './MedicationNavigator';
import { MyPageNavigator } from './MyPageNavigator';
import { useFcmSetup } from '@/shared/hooks/useFcmSetup';

export type MainTabParamList = {
  Checkin: undefined;
  Care: undefined;
  Medication: undefined;
  MyPage: undefined;
};

const Tab = createBottomTabNavigator<MainTabParamList>();

const TAB_ICONS: Record<
  string,
  { focused: keyof typeof Ionicons.glyphMap; unfocused: keyof typeof Ionicons.glyphMap }
> = {
  Checkin:    { focused: 'heart',      unfocused: 'heart-outline' },
  Care:       { focused: 'clipboard',  unfocused: 'clipboard-outline' },
  Medication: { focused: 'medical',    unfocused: 'medical-outline' },
  MyPage:     { focused: 'person',     unfocused: 'person-outline' },
};

const TAB_LABEL_KEY: Record<string, string> = {
  Checkin:    'tab_checkin',
  Care:       'tab_care',
  Medication: 'tab_medication',
  MyPage:     'tab_mypage',
};

const TAB_ROOT_SCREENS: Record<string, string> = {
  Checkin:    'CheckinHome',
  Care:       'CareHome',
  Medication: 'MedicationTab',
  MyPage:     'MyPageTab',
};

const PILL_HEIGHT = 48;
const ICON_CIRCLE = 44;
const EXPANDED_WIDTH = 110;
const ANIM_DURATION = 280;

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface AnimatedTabItemProps {
  isFocused: boolean;
  focusedIcon: keyof typeof Ionicons.glyphMap;
  unfocusedIcon: keyof typeof Ionicons.glyphMap;
  label: string;
  primaryColor: string;
  textInverse: string;
  textSub: string; // 비포커스 아이콘 색상
  onPress: () => void;
  onLongPress: () => void;
  accessibilityLabel?: string;
  testID?: string;
}

const AnimatedTabItem: React.FC<AnimatedTabItemProps> = ({
  isFocused,
  focusedIcon,
  unfocusedIcon,
  label,
  primaryColor,
  textInverse,
  textSub,
  onPress,
  onLongPress,
  accessibilityLabel,
  testID,
}) => {
  const progress = useSharedValue(isFocused ? 1 : 0);

  useEffect(() => {
    progress.value = withTiming(isFocused ? 1 : 0, { duration: ANIM_DURATION });
  }, [isFocused]);

  const containerStyle = useAnimatedStyle(() => {
    const w = interpolate(progress.value, [0, 1], [ICON_CIRCLE, EXPANDED_WIDTH]);
    const bg = interpolateColor(
      progress.value,
      [0, 1],
      ['transparent', primaryColor],
    );
    return {
      width: w,
      height: PILL_HEIGHT,
      borderRadius: PILL_HEIGHT / 2,
      backgroundColor: bg,
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      marginHorizontal: 2,
      overflow: 'hidden' as const,
    };
  });

  const focusedLabelStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 0.5, 1], [0, 0, 1]),
    maxWidth: interpolate(progress.value, [0, 1], [0, 70]),
    marginLeft: interpolate(progress.value, [0, 1], [0, 6]),
  }));

  return (
    <AnimatedPressable
      accessibilityRole="button"
      accessibilityState={isFocused ? { selected: true } : undefined}
      accessibilityLabel={accessibilityLabel}
      testID={testID}
      onPress={onPress}
      onLongPress={onLongPress}
      style={containerStyle}
    >
      <Ionicons
        name={isFocused ? focusedIcon : unfocusedIcon}
        size={isFocused ? 20 : 22}
        color={isFocused ? textInverse : textSub}
      />
      <Animated.Text
        numberOfLines={1}
        style={[
          {
            fontFamily: fontFamily.semibold,
            fontSize: sizes.font.sm,
            color: textInverse,
          },
          focusedLabelStyle,
        ]}
      >
        {label}
      </Animated.Text>
    </AnimatedPressable>
  );
};

const CustomTabBar: React.FC<BottomTabBarProps> = ({ state, descriptors, navigation }) => {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation('common');
  const { hidden } = useTabBarVisibility();
  const tabBarBottom = Math.max(insets.bottom + 6, 20);
  const totalShiftPx = sizes.tabBarHeight + tabBarBottom + 24;

  const containerStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: interpolate(hidden.value, [0, 1], [0, totalShiftPx]) },
    ],
    opacity: interpolate(hidden.value, [0, 1], [1, 0]),
  }));

  const focusedRoute = state.routes[state.index];
  const focusedChild = getFocusedRouteNameFromRoute(focusedRoute);
  const rootScreen = TAB_ROOT_SCREENS[focusedRoute.name];
  const isOnRoot = !focusedChild || focusedChild === rootScreen;

  if (!isOnRoot) return null;

  return (
    <View pointerEvents="box-none" style={{ position: 'absolute', left: 0, right: 0, bottom: tabBarBottom }}>
      <Animated.View
        pointerEvents="box-none"
        style={[
          { alignItems: 'center', justifyContent: 'center' },
          containerStyle,
        ]}
      >
        <GlassView
          intensity="regular"
          borderRadius={32}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: 6,
            paddingVertical: 6,
            borderWidth: 1,
            borderColor: colors.glassBorder,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 6 },
            shadowOpacity: isDark ? 0.5 : 0.12,
            shadowRadius: 16,
            elevation: 8,
          }}
        >
          {state.routes.map((route, index) => {
            const { options } = descriptors[route.key];
            const isFocused = state.index === index;
            const icons = TAB_ICONS[route.name] ?? TAB_ICONS.Schedule;
            const labelKey = TAB_LABEL_KEY[route.name];
            const label = labelKey ? t(labelKey) : route.name;

            const onPress = () => {
              const event = navigation.emit({
                type: 'tabPress',
                target: route.key,
                canPreventDefault: true,
              });
              if (event.defaultPrevented) return;
              if (isFocused) return;
              runTabSwitchGuard(route.name, () => {
                navigation.navigate(route.name as never);
              });
            };

            const onLongPress = () => {
              navigation.emit({ type: 'tabLongPress', target: route.key });
            };

            return (
              <AnimatedTabItem
                key={route.key}
                isFocused={isFocused}
                focusedIcon={icons.focused}
                unfocusedIcon={icons.unfocused}
                label={label}
                primaryColor={colors.primary}
                textInverse={colors.textInverse}
                textSub={colors.textSub}
                onPress={onPress}
                onLongPress={onLongPress}
                accessibilityLabel={options.tabBarAccessibilityLabel ?? label}
                testID={options.tabBarButtonTestID}
              />
            );
          })}
        </GlassView>
      </Animated.View>
    </View>
  );
};

export const MainTabNavigator: React.FC = () => {
  useFcmSetup();

  return (
    <TabBarVisibilityProvider>
      <Tab.Navigator
        screenOptions={{ headerShown: false }}
        tabBar={(props) => <CustomTabBar {...props} />}
        initialRouteName="Checkin"
      >
        <Tab.Screen name="Checkin" component={CheckinNavigator} />
        <Tab.Screen name="Care" component={CareNavigator} />
        <Tab.Screen name="Medication" component={MedicationNavigator} />
        <Tab.Screen name="MyPage" component={MyPageNavigator} />
      </Tab.Navigator>
    </TabBarVisibilityProvider>
  );
};
